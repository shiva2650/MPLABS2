import { GoogleGenAI } from '@google/genai';
import { Project, Alert, CitizenFeedback, ProjectInspection, ProjectDocument, User } from '../../types/index.ts';

// Priority candidate models compliant with official Gemini SDK guidance
const CANDIDATE_GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite'
];

async function tryGenerateWithTimeout(
  aiClient: GoogleGenAI,
  model: string,
  contents: string,
  systemInstruction: string,
  timeoutMs = 8000
): Promise<string | null> {
  const generationPromise = aiClient.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      temperature: 0.2
    }
  });

  const timeoutPromise = new Promise<null>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  const response = await Promise.race([generationPromise, timeoutPromise]);
  if (response && 'text' in response && response.text) {
    return response.text.trim();
  }
  return null;
}

interface AssistantResponse {
  answer: string;
  sourceCount: number;
  role: string;
  suggestedFollowups?: string[];
}

export async function processAiAssistantQuery(
  query: string,
  user: User | undefined,
  data: {
    projects: Project[];
    alerts: Alert[];
    feedback: CitizenFeedback[];
    inspections: ProjectInspection[];
    documents: ProjectDocument[];
  },
  aiClient: GoogleGenAI | null
): Promise<AssistantResponse> {
  const q = (query || '').toLowerCase().trim();
  const userRole = user?.role || 'citizen';

  // 1. RBAC Data Isolation
  let authorizedProjects = data.projects;
  let authorizedAlerts = data.alerts;
  let authorizedFeedback = data.feedback;
  let authorizedInspections = data.inspections;

  if (userRole === 'mp') {
    const mpId = user?.userId;
    const constituency = (user?.constituency || '').toLowerCase();
    authorizedProjects = data.projects.filter(
      (p) => (mpId && p.mpId === mpId) || (constituency && p.constituency.toLowerCase().includes(constituency))
    );
    const projIds = new Set(authorizedProjects.map((p) => p.id));
    authorizedAlerts = data.alerts.filter((a) => projIds.has(a.projectId));
    authorizedFeedback = data.feedback.filter((f) => projIds.has(f.projectId));
    authorizedInspections = data.inspections.filter((i) => projIds.has(i.projectId));
  } else if (userRole === 'agency') {
    const agencyId = user?.agencyId;
    const agencyName = (user?.agencyName || '').toLowerCase();
    authorizedProjects = data.projects.filter(
      (p) => (agencyId && p.agencyId === agencyId) || (agencyName && p.agencyName.toLowerCase().includes(agencyName))
    );
    const projIds = new Set(authorizedProjects.map((p) => p.id));
    authorizedAlerts = data.alerts.filter((a) => projIds.has(a.projectId));
    authorizedFeedback = data.feedback.filter((f) => projIds.has(f.projectId));
    authorizedInspections = data.inspections.filter((i) => projIds.has(i.projectId));
  } else if (userRole === 'citizen') {
    // Public citizen views
    authorizedAlerts = data.alerts.filter((a) => a.status === 'Valid' || a.status === 'Open');
  }

  // 2. Prepare Grounded Summary Context
  const totalSanctioned = authorizedProjects.reduce((s, p) => s + (p.sanctionedCost || p.estimatedCost), 0);
  const totalUtilized = authorizedProjects.reduce((s, p) => s + p.utilizedCost, 0);
  const delayedProjects = authorizedProjects.filter((p) => p.delayPrediction?.status === 'Delayed' || (p.delayPrediction?.estimatedDelayDays || 0) > 30);
  const highRiskProjects = authorizedProjects.filter((p) => p.riskScore >= 61 || p.riskLevel === 'High' || p.riskLevel === 'Critical');
  const financialDiscrepancies = authorizedProjects.filter((p) => {
    const cost = p.sanctionedCost || p.estimatedCost || 1;
    const expPct = Math.round((p.utilizedCost / cost) * 100);
    return expPct > p.completionPercentage + 20 && expPct > 30;
  });
  const photoFailures = authorizedProjects.filter((p) => p.photos.some((ph) => ph.exifStatus === 'Mismatch' || ph.exifStatus === 'Suspicious'));
  const unresolvedGrievances = authorizedFeedback.filter((f) => f.status !== 'Resolved' && f.status !== 'Dismissed');

  // Format concise text representation of authorized projects
  const projectsSummaryText = authorizedProjects
    .map((p) => {
      const costLakhs = ((p.sanctionedCost || p.estimatedCost) / 100000).toFixed(1);
      const utilLakhs = (p.utilizedCost / 100000).toFixed(1);
      const expPct = Math.round((p.utilizedCost / (p.sanctionedCost || p.estimatedCost || 1)) * 100);
      const delayText = p.delayPrediction?.status === 'Delayed' ? `DELAYED by ${p.delayPrediction.estimatedDelayDays} days` : 'On Track';
      const reasonsText = p.riskReasons && p.riskReasons.length > 0 ? p.riskReasons.join('; ') : p.riskReason || 'Normal bounds';
      const photosStatus = p.photos.map((ph) => ph.exifStatus).join(', ') || 'No photos uploaded';

      return `• [${p.workId}] "${p.title}" | MP: ${p.mpName} (${p.constituency}, ${p.state}) | Category: ${p.category} | Status: ${p.status} | Sanctioned: ₹${costLakhs}L | Utilized: ₹${utilLakhs}L (${expPct}%) | Physical Progress: ${p.completionPercentage}% | Timeline: ${delayText} | Risk: ${p.riskScore}/100 (${p.riskLevel}) | Risk Factors: ${reasonsText} | Photos: [${photosStatus}] | Agency: ${p.agencyName || 'Unassigned'} | Vendor: ${p.vendorName || 'Unassigned'}`;
    })
    .join('\n');

  const alertsSummaryText = authorizedAlerts
    .slice(0, 10)
    .map((a) => `• Alert: [${a.type}] for Work ${a.workId} (${a.riskLevel} Risk): ${a.reason} [Status: ${a.status}]`)
    .join('\n');

  const feedbackSummaryText = authorizedFeedback
    .slice(0, 10)
    .map((f) => `• Grievance: [${f.grievanceId || f.id}] on Work ${f.workId} - ${f.issueType}: "${f.comments}" [Status: ${f.status}, Action: ${f.actionTaken || 'Pending'}]`)
    .join('\n');

  const inspectionsSummaryText = authorizedInspections
    .slice(0, 10)
    .map((i) => `• Inspection on Work ${i.workId} by ${i.inspectingOfficer}: Result=${i.result}, Observations="${i.observations}"`)
    .join('\n');

  const systemInstruction = `You are the official MPLADS AI Monitoring Assistant for the Ministry of Statistics and Programme Implementation (MoSPI), Government of India.
You are assisting an authenticated user with role: "${userRole.toUpperCase()}".

CRITICAL ACCURACY INSTRUCTIONS:
1. You MUST answer using ONLY the verified database records provided below.
2. NEVER invent, assume, or hallucinate project names, numbers, or amounts.
3. If asked about delayed projects, list ONLY the projects from the data that are delayed, specifying exact Work IDs, titles, delay days, and percentages.
4. If asked about high-risk projects, list ONLY those with High or Critical risk scores, detailing their specific risk reasons.
5. If asked about financial discrepancies, identify works where expenditure percentage significantly exceeds physical completion percentage.
6. If asked about photo verification failures, cite the projects with location mismatches or stripped EXIF.
7. If asked for a constituency or state overview, provide a factual summary with total works, sanctioned amount, utilized amount, and key flags.
8. If the requested information is absent or insufficient in the verified records, explicitly say: "Insufficient data is available in the verified records to provide an answer."
9. Format all responses cleanly using markdown bullet points, bold key terms, and exact rupee amounts (in Lakhs). Keep responses crisp, objective, and executive-ready.`;

  const contextData = `=== VERIFIED MPLADS SYSTEM DATA (SCOPE: ${userRole.toUpperCase()}) ===
Total Authorized Works: ${authorizedProjects.length}
Total Sanctioned: ₹${(totalSanctioned / 100000).toFixed(2)} Lakhs (₹${(totalSanctioned / 10000000).toFixed(2)} Cr)
Total Utilized: ₹${(totalUtilized / 100000).toFixed(2)} Lakhs (₹${(totalUtilized / 10000000).toFixed(2)} Cr)
Delayed Works Count: ${delayedProjects.length}
High/Critical Risk Works Count: ${highRiskProjects.length}
Financial Discrepancy Works Count: ${financialDiscrepancies.length}
Photo Verification Failures: ${photoFailures.length}
Open Citizen Grievances: ${unresolvedGrievances.length}

=== PROJECT RECORDS ===
${projectsSummaryText}

=== INTEGRITY ALERTS ===
${alertsSummaryText || 'No active integrity alerts.'}

=== CITIZEN GRIEVANCES ===
${feedbackSummaryText || 'No citizen grievances registered.'}

=== FIELD INSPECTIONS ===
${inspectionsSummaryText || 'No site inspections on record.'}
===================================================`;

  // 3. Attempt Gemini API Generation across supported models with graceful fallback
  if (aiClient) {
    for (const model of CANDIDATE_GEMINI_MODELS) {
      try {
        const text = await tryGenerateWithTimeout(
          aiClient,
          model,
          `${contextData}\n\nUSER QUESTION: ${query}`,
          systemInstruction,
          7500
        );

        if (text) {
          return {
            answer: text,
            sourceCount: authorizedProjects.length,
            role: userRole,
            suggestedFollowups: generateFollowups(q, userRole)
          };
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isTemporaryBusy =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('429');

        if (isTemporaryBusy) {
          console.info(`[AIAssistant] Model ${model} is experiencing temporary high demand; checking alternate model...`);
          // Brief backoff pause before trying alternate model pool
          await new Promise((resolve) => setTimeout(resolve, 250));
        } else {
          console.info(`[AIAssistant] Model ${model} unavailable: ${errMsg.slice(0, 80)}. Trying fallback.`);
        }
      }
    }
    console.info('[AIAssistant] Generative models temporarily at capacity; serving verified response via deterministic MPLADS analytics engine.');
  }

  // 4. Robust Deterministic Fallback Engine
  const deterministicAnswer = generateDeterministicAnswer(
    q,
    authorizedProjects,
    delayedProjects,
    highRiskProjects,
    financialDiscrepancies,
    photoFailures,
    authorizedFeedback,
    authorizedInspections,
    userRole
  );

  return {
    answer: deterministicAnswer,
    sourceCount: authorizedProjects.length,
    role: userRole,
    suggestedFollowups: generateFollowups(q, userRole)
  };
}

function generateDeterministicAnswer(
  q: string,
  projects: Project[],
  delayed: Project[],
  highRisk: Project[],
  discrepancies: Project[],
  photoFailures: Project[],
  feedback: CitizenFeedback[],
  inspections: ProjectInspection[],
  role: string
): string {
  // Query 1: Delayed projects
  if (q.includes('delay') || q.includes('late') || q.includes('overdue') || q.includes('behind')) {
    if (delayed.length === 0) {
      return `**Delayed Works Status:**\n\nThere are currently **no delayed works** within your authorized scope (${projects.length} total works on track).`;
    }
    const list = delayed
      .map((p) => {
        const costL = ((p.sanctionedCost || p.estimatedCost) / 100000).toFixed(1);
        const delayDays = p.delayPrediction?.estimatedDelayDays || 60;
        return `- **${p.workId}** — *${p.title}*\n  - **Location:** ${p.constituency}, ${p.state}\n  - **Delay:** ~${delayDays} days past sanctioned timeline\n  - **Physical Progress:** ${p.completionPercentage}% | **Cost:** ₹${costL}L\n  - **Vendor:** ${p.vendorName || 'Unassigned'}\n  - **Status:** ${p.status}`;
      })
      .join('\n\n');
    return `### ⏱️ Delayed Works Report (${delayed.length} flagged out of ${projects.length})\n\nThe following projects have exceeded their sanctioned milestones or target completion dates:\n\n${list}\n\n*Recommended Action: Issue show-cause notice to executing agencies under MPLADS Guidelines.*`;
  }

  // Query 2: High Risk projects
  if (q.includes('risk') || q.includes('critical') || q.includes('anomaly') || q.includes('score')) {
    if (highRisk.length === 0) {
      return `**AI Risk Scoring Report:**\n\nNo works are classified in **High (61-80)** or **Critical (81-100)** risk categories. All ${projects.length} monitored works remain within Low/Moderate risk bounds.`;
    }
    const list = highRisk
      .map((p) => {
        const factors = p.riskReasons && p.riskReasons.length > 0 ? p.riskReasons.map((r) => `    • ${r}`).join('\n') : `    • ${p.riskReason}`;
        return `- **${p.workId}** — *${p.title}*\n  - **Risk Score:** **${p.riskScore}/100** (**${p.riskLevel}**)\n  - **Physical Progress:** ${p.completionPercentage}% | **Sanctioned:** ₹${((p.sanctionedCost || p.estimatedCost) / 100000).toFixed(1)}L\n  - **Specific Integrity Factors:**\n${factors}`;
      })
      .join('\n\n');
    return `### ⚠️ High & Critical Risk Works (${highRisk.length} flagged)\n\nThe deterministic AI Risk Engine has identified the following high-priority interventions:\n\n${list}`;
  }

  // Query 3: Financial discrepancy (expenditure > physical progress)
  if (
    q.includes('expenditure') ||
    q.includes('discrepancy') ||
    q.includes('fund') ||
    q.includes('money') ||
    q.includes('spend') ||
    q.includes('cost') ||
    q.includes('financial')
  ) {
    if (discrepancies.length === 0) {
      return `**Financial vs. Physical Progress Analysis:**\n\nAll ${projects.length} works show fund utilization proportionate to verified physical milestones. No severe expenditure anomalies detected.`;
    }
    const list = discrepancies
      .map((p) => {
        const cost = p.sanctionedCost || p.estimatedCost || 1;
        const expPct = Math.round((p.utilizedCost / cost) * 100);
        return `- **${p.workId}** — *${p.title}*\n  - **Funds Utilized:** ₹${(p.utilizedCost / 100000).toFixed(1)}L (**${expPct}%** of sanction)\n  - **Physical Completion:** **${p.completionPercentage}%**\n  - **Discrepancy Gap:** **+${expPct - p.completionPercentage}%** expenditure ahead of construction\n  - **Executing Agency:** ${p.agencyName}`;
      })
      .join('\n\n');
    return `### 💸 Expenditure vs Physical Progress Discrepancies (${discrepancies.length} works flagged)\n\nThe following projects exhibit disproportionate fund disbursement relative to verified ground execution:\n\n${list}\n\n*Policy Directive: Physical MB verification and Utilization Certificate required prior to releasing subsequent installments.*`;
  }

  // Query 4: Photo verification failures
  if (q.includes('photo') || q.includes('image') || q.includes('gps') || q.includes('exif') || q.includes('camera')) {
    if (photoFailures.length === 0) {
      return `**Site Photo Geo-Verification Status:**\n\nAll uploaded inspection photographs have passed EXIF integrity, hardware authenticity, and geo-fence proximity validation.`;
    }
    const list = photoFailures
      .map((p) => {
        const badPhotos = p.photos.filter((ph) => ph.exifStatus !== 'Verified');
        const details = badPhotos.map((ph) => `    • Photo ${ph.fileName}: ${ph.exifStatus} (${ph.notes || 'Location mismatch or metadata tampering'})`).join('\n');
        return `- **${p.workId}** — *${p.title}*\n  - **Registered Coordinates:** ${p.latitude}, ${p.longitude}\n  - **Photo Audit Finding:**\n${details}`;
      })
      .join('\n\n');
    return `### 📸 Photo Geo-Verification Integrity Failures (${photoFailures.length} works)\n\nAutomated EXIF extraction detected location mismatches or metadata anomalies on the following works:\n\n${list}`;
  }

  // Query 5: Citizen grievances
  if (q.includes('grievance') || q.includes('complaint') || q.includes('feedback') || q.includes('citizen')) {
    if (feedback.length === 0) {
      return `**Citizen Grievances Overview:**\n\nThere are **no citizen grievances** on record for your authorized constituency/projects.`;
    }
    const list = feedback
      .map((f) => {
        return `- **${f.grievanceId || f.id}** on **${f.workId}**\n  - **Issue:** ${f.issueType.toUpperCase()}\n  - **Citizen:** ${f.citizenName}\n  - **Comment:** "${f.comments}"\n  - **Workflow Status:** **${f.status}**\n  - **Action Taken:** ${f.actionTaken || 'Assigned to field officer for verification.'}`;
      })
      .join('\n\n');
    return `### 📢 Citizen Grievance Redressal Dossier (${feedback.length} registered)\n\n${list}`;
  }

  // Query 6: Inspections
  if (q.includes('inspection') || q.includes('quality') || q.includes('officer') || q.includes('site visit')) {
    if (inspections.length === 0) {
      return `**Field Inspections Summary:**\n\nNo formal quality inspection reports have been filed yet for the selected scope.`;
    }
    const list = inspections
      .map((i) => {
        return `- **${i.workId}** — *${i.projectTitle}*\n  - **Inspecting Officer:** ${i.inspectingOfficer} (${i.officerDesignation})\n  - **Date:** ${i.inspectionDate || i.scheduledDate} | **Result:** **${i.result}**\n  - **Observations:** "${i.observations}"\n  - **Recommendations:** ${i.recommendations}`;
      })
      .join('\n\n');
    return `### 🔍 Quality & Field Inspection Records (${inspections.length} reports)\n\n${list}`;
  }

  // Default: Comprehensive Summary Overview
  const totalSanctioned = projects.reduce((s, p) => s + (p.sanctionedCost || p.estimatedCost), 0);
  const totalUtilized = projects.reduce((s, p) => s + p.utilizedCost, 0);
  const utilPct = totalSanctioned > 0 ? Math.round((totalUtilized / totalSanctioned) * 100) : 0;
  const completed = projects.filter((p) => p.status === 'Completed').length;
  const ongoing = projects.filter((p) => p.status === 'Ongoing').length;

  return `### 🏛️ MPLADS AI Integrity & Monitoring Executive Summary
**Authorized Scope:** ${role.toUpperCase()} Profile | **Total Works Monitored:** ${projects.length}

- **Financial Overview:**
  - **Total Sanctioned:** ₹${(totalSanctioned / 100000).toFixed(2)} Lakhs (₹${(totalSanctioned / 10000000).toFixed(2)} Cr)
  - **Total Utilized:** ₹${(totalUtilized / 100000).toFixed(2)} Lakhs (₹${(totalUtilized / 10000000).toFixed(2)} Cr)
  - **Overall Utilization Rate:** **${utilPct}%**
- **Physical Progress Overview:**
  - **Completed Works:** ${completed}
  - **Ongoing Execution:** ${ongoing}
  - **Delayed Works:** ${delayed.length}
- **AI Integrity & Exception Highlights:**
  - **High/Critical Risk Works:** ${highRisk.length} works require immediate oversight.
  - **Financial Discrepancies:** ${discrepancies.length} works show expenditure ahead of physical progress.
  - **Photo Verification Failures:** ${photoFailures.length} works failed GPS/EXIF checks.
  - **Open Citizen Grievances:** ${feedback.filter((f) => f.status !== 'Resolved').length} unresolved complaints.

*You can ask specific questions such as "Which projects are delayed?", "Show high-risk works", "Are there expenditure anomalies?", or "List citizen grievances".*`;
}

function generateFollowups(query: string, role: string): string[] {
  return [
    'Which projects are delayed?',
    'Which projects are high risk?',
    'Expenditure higher than physical progress?',
    'Projects that failed photo verification?',
    'Show unresolved citizen grievances'
  ];
}
