import { Project, ProjectStatus, User, UserRole, ApprovalTransitionRecord } from '../src/types/index.js';
import { db } from './db.js';
import { normalizeRole } from './auth.js';

export interface TransitionRule {
  from: ProjectStatus[];
  to: ProjectStatus;
  allowedRoles: UserRole[];
  authorityName: string;
  minSanctionAmount?: number;
  maxSanctionAmount?: number;
  requiresDtecClearance?: boolean;
}

/**
 * Backend-Enforced Statutory MPLADS Multi-Authority State Machine
 * Approval Chain: MP -> District Authority -> State Nodal Authority -> Central Ministry
 */
export const STATUTORY_TRANSITION_RULES: TransitionRule[] = [
  // 1. MP recommends project
  {
    from: ['Draft', 'Recommended'],
    to: 'Recommended',
    allowedRoles: ['MP', 'SUPER_ADMIN'],
    authorityName: 'Member of Parliament'
  },
  // 2. District Authority accepts for feasibility scrutiny
  {
    from: ['Recommended'],
    to: 'Feasibility Review',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    authorityName: 'District Authority'
  },
  // 3. District Authority sanctions works (standard ceiling up to ₹50 Lakhs)
  {
    from: ['Feasibility Review', 'Recommended', 'State Approved', 'Ministry Approved'],
    to: 'Sanctioned',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    authorityName: 'District Authority (Collector)',
    requiresDtecClearance: true
  },
  // 4. District Authority forwards high-value or inter-district works to State Nodal Authority
  {
    from: ['Feasibility Review', 'Recommended'],
    to: 'Forwarded To State',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    authorityName: 'District Authority'
  },
  // 5. State Nodal Authority accords state administrative clearance
  {
    from: ['Forwarded To State'],
    to: 'State Approved',
    allowedRoles: ['STATE_NODAL', 'SUPER_ADMIN'],
    authorityName: 'State Nodal Authority'
  },
  // 6. State forwards special category / mega schemes to Central Ministry
  {
    from: ['Forwarded To State', 'State Approved'],
    to: 'Forwarded To Ministry',
    allowedRoles: ['STATE_NODAL', 'SUPER_ADMIN'],
    authorityName: 'State Nodal Authority'
  },
  // 7. Ministry accords Central clearance
  {
    from: ['Forwarded To Ministry'],
    to: 'Ministry Approved',
    allowedRoles: ['MINISTRY', 'SUPER_ADMIN'],
    authorityName: 'Central MoSPI Ministry'
  },
  // 8. District assigns implementing agency & vendor
  {
    from: ['Sanctioned'],
    to: 'Assigned',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    authorityName: 'District Authority'
  },
  // 9. Agency starts execution
  {
    from: ['Assigned', 'Sanctioned'],
    to: 'Ongoing',
    allowedRoles: ['AGENCY', 'ADMIN', 'SUPER_ADMIN'],
    authorityName: 'Implementing Agency'
  },
  // 10. Flagged for vigilance review
  {
    from: ['Ongoing', 'Assigned', 'Sanctioned', 'Delayed'],
    to: 'Under Review',
    allowedRoles: ['ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN'],
    authorityName: 'Vigilance Directorate / District Authority'
  },
  // 11. Work certified completed
  {
    from: ['Ongoing', 'Under Review'],
    to: 'Completed',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    authorityName: 'District Authority (Certified)'
  },
  // 12. Rejection at any administrative review stage
  {
    from: ['Recommended', 'Feasibility Review', 'Forwarded To State', 'Forwarded To Ministry', 'Under Review'],
    to: 'Rejected',
    allowedRoles: ['ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN'],
    authorityName: 'Competent Administrative Authority'
  }
];

export class ApprovalWorkflowService {
  /**
   * Validates and executes a statutory state transition
   */
  public executeTransition(params: {
    project: Project;
    targetStatus: ProjectStatus;
    user: User;
    sanctionedAmount?: number;
    statutoryRemarks?: string;
    dtecClearanceRef?: string;
  }): { success: boolean; project: Project; record: ApprovalTransitionRecord } {
    const { project, targetStatus, user, sanctionedAmount, statutoryRemarks, dtecClearanceRef } = params;
    const userRole = normalizeRole(user.role);

    // Find matching rule
    const rule = STATUTORY_TRANSITION_RULES.find(
      r => r.to === targetStatus && (r.from.includes(project.status) || project.status === targetStatus)
    );

    if (!rule) {
      throw new Error(`Invalid state transition: Cannot move project from '${project.status}' to '${targetStatus}'.`);
    }

    // Role check
    const isAuthorized = userRole === 'SUPER_ADMIN' || rule.allowedRoles.includes(userRole);
    if (!isAuthorized) {
      throw new Error(`Access Denied: Role '${user.role}' is not authorized to transition project to '${targetStatus}'. Required: ${rule.allowedRoles.join(', ')}.`);
    }

    // High-value routing is handled by the authority workflow rules above.
    // Do not hard-code a universal statutory single-work ceiling here; applicable
    // administrative/state rules must be configured separately for production.

    const prevStatus = project.status;
    project.status = targetStatus;

    if (sanctionedAmount !== undefined && sanctionedAmount > 0) {
      project.sanctionedAmount = sanctionedAmount;
    }

    if (targetStatus === 'Sanctioned') {
      project.sanctionDate = new Date().toISOString().split('T')[0];
    } else if (targetStatus === 'Completed') {
      project.actualCompletionDate = new Date().toISOString().split('T')[0];
    }

    // Set active authority queue
    project.currentAuthorityQueue =
      targetStatus === 'Recommended' ? 'DISTRICT_AUTHORITY' :
      targetStatus === 'Forwarded To State' ? 'STATE_NODAL_AUTHORITY' :
      targetStatus === 'Forwarded To Ministry' ? 'CENTRAL_MINISTRY' :
      targetStatus === 'Sanctioned' || targetStatus === 'Assigned' ? 'AGENCY_EXECUTION' :
      targetStatus === 'Completed' ? 'COMPLETED' : 'DISTRICT_AUTHORITY';

    // Record transition history
    const record: ApprovalTransitionRecord = {
      id: `TR-${Date.now().toString().slice(-6)}`,
      projectId: project.id,
      fromStatus: prevStatus,
      toStatus: targetStatus,
      transitionedByUserId: user.userId,
      transitionedByRole: userRole,
      transitionedByName: user.name,
      authorityLevel: userRole === 'MP' ? 'MP' : userRole === 'STATE_NODAL' ? 'STATE_NODAL_AUTHORITY' : userRole === 'MINISTRY' || userRole === 'SUPER_ADMIN' ? 'CENTRAL_MINISTRY' : 'DISTRICT_AUTHORITY',
      sanctionedAmount: project.sanctionedAmount,
      statutoryRemarks: statutoryRemarks || `Status transitioned to ${targetStatus} by ${user.name}`,
      dtecClearanceRef,
      timestamp: new Date().toISOString()
    };

    if (!project.approvalHistory) project.approvalHistory = [];
    project.approvalHistory.push(record);

    // Add entry to audit log
    db.addAuditLog({
      userId: user.userId,
      userName: user.name,
      userRole,
      action: 'APPROVAL_STATE_TRANSITION',
      targetEntity: 'Project',
      targetId: project.id,
      previousValue: `Status: ${prevStatus}`,
      newValue: `Status: ${targetStatus} | Remarks: ${statutoryRemarks || 'None'} | Authority: ${rule.authorityName}`,
      ipAddressMasked: '10.14.02.***'
    });

    return { success: true, project, record };
  }
}

export const approvalWorkflow = new ApprovalWorkflowService();
