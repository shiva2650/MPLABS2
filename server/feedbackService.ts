import { CitizenFeedback, GrievanceQueue, Project } from '../src/types/index.js';
import { db } from './db.js';

export class CitizenFeedbackPipeline {
  /**
   * Intelligently routes citizen feedback to District, State, or Central Ministry queue
   */
  public routeFeedback(
    feedbackData: Omit<CitizenFeedback, 'id' | 'status' | 'submittedAt'>,
    project?: Project
  ): CitizenFeedback {
    const text = `${feedbackData.issueType} ${feedbackData.description}`.toLowerCase();

    let routedQueue: GrievanceQueue = 'DISTRICT_QUEUE';
    let priorityLevel: CitizenFeedback['priorityLevel'] = 'NORMAL';
    let slaDeadlineDays = 15;

    // Severity & Keyword Analysis
    const isCorruptionOrGhost =
      text.includes('corruption') ||
      text.includes('bribe') ||
      text.includes('siphon') ||
      text.includes('ghost asset') ||
      text.includes('misappropriation') ||
      text.includes('does not exist');

    const isHighValue = project && (project.sanctionedAmount || project.estimatedCost) >= 5000000;

    if (isCorruptionOrGhost || isHighValue) {
      routedQueue = 'MINISTRY_VIGILANCE_QUEUE';
      priorityLevel = 'VIGILANCE_URGENT';
      slaDeadlineDays = 7;
    } else if (text.includes('state') || text.includes('inter-district') || (project && project.sanctionedAmount >= 2500000)) {
      routedQueue = 'STATE_QUEUE';
      priorityLevel = 'HIGH';
      slaDeadlineDays = 10;
    }

    const count = db.citizenFeedback.length + 1;
    const queueCode = routedQueue === 'MINISTRY_VIGILANCE_QUEUE' ? 'MIN' : routedQueue === 'STATE_QUEUE' ? 'STA' : 'DIS';
    const id = `FB-${String(count).padStart(3, '0')}`;
    const trackingNumber = `MPLADS-GRV-2025-${queueCode}-${String(count).padStart(3, '0')}`;

    const feedback: CitizenFeedback = {
      id,
      trackingNumber,
      projectId: feedbackData.projectId,
      projectTitle: feedbackData.projectTitle || project?.title || 'MPLADS Developmental Work',
      projectCode: feedbackData.projectCode || project?.projectCode || 'MPLADS-REF',
      district: feedbackData.district || project?.district || 'Hyderabad',
      state: feedbackData.state || project?.state || 'Telangana',
      citizenName: feedbackData.citizenName || 'Concerned Citizen',
      citizenContactMasked: feedbackData.citizenContactMasked,
      issueType: feedbackData.issueType,
      description: feedbackData.description,
      photoUrl: feedbackData.photoUrl,
      latitude: feedbackData.latitude || project?.latitude,
      longitude: feedbackData.longitude || project?.longitude,
      submittedAt: new Date().toISOString(),
      status: 'New',
      routedQueue,
      priorityLevel,
      slaDeadlineDays,
      adminNotes: `Automatically triaged to ${routedQueue} with SLA of ${slaDeadlineDays} working days.`
    };

    db.citizenFeedback.unshift(feedback);

    // Audit Log
    db.addAuditLog({
      userId: 'PUBLIC_CITIZEN',
      userName: feedback.citizenName,
      userRole: 'PUBLIC',
      action: 'CITIZEN_GRIEVANCE_FILED',
      targetEntity: 'CitizenFeedback',
      targetId: feedback.id,
      newValue: `Grievance registered. Tracking: ${trackingNumber} | Queue: ${routedQueue} | SLA: ${slaDeadlineDays}d`,
      ipAddressMasked: '10.14.02.***'
    });

    return feedback;
  }
}

export const feedbackPipeline = new CitizenFeedbackPipeline();
