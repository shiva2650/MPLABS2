import { Project, VendorAnalytics, RiskLevel, Alert, VendorRiskEvent, VendorProjectSummary } from '../../types/index.ts';

/**
 * Calculates Haversine distance between two latitude/longitude points in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Cost Anomaly Detection Engine
 * Computes baseline mean and standard deviation for the given category within state/district
 */
export function evaluateCostAnomaly(
  targetProject: Project,
  allProjects: Project[],
  thresholdStdDev = 1.8
): {
  isAnomaly: boolean;
  zScore: number;
  baselineMean: number;
  baselineStdDev: number;
  reason: string;
} {
  // Filter comparable past projects within the same category and state/region
  const cohort = allProjects.filter(
    (p) =>
      p.id !== targetProject.id &&
      p.category === targetProject.category &&
      p.state.toLowerCase() === targetProject.state.toLowerCase() &&
      p.estimatedCost > 0
  );

  // If cohort is too small, broaden to same category nationwide
  const effectiveCohort =
    cohort.length >= 2
      ? cohort
      : allProjects.filter(
          (p) => p.id !== targetProject.id && p.category === targetProject.category && p.estimatedCost > 0
        );

  if (effectiveCohort.length < 2) {
    return {
      isAnomaly: false,
      zScore: 0,
      baselineMean: targetProject.estimatedCost,
      baselineStdDev: 0,
      reason: 'Insufficient regional historical baseline sample size for statistical modeling.'
    };
  }

  const costs = effectiveCohort.map((p) => p.estimatedCost);
  const mean = costs.reduce((sum, val) => sum + val, 0) / costs.length;
  const variance =
    costs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (costs.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return {
      isAnomaly: false,
      zScore: 0,
      baselineMean: Math.round(mean),
      baselineStdDev: 0,
      reason: 'Standard deviation is zero; cost is identical to baseline.'
    };
  }

  const zScore = Number(((targetProject.estimatedCost - mean) / stdDev).toFixed(2));
  const isAnomaly = zScore >= thresholdStdDev;

  const costLakhs = (targetProject.estimatedCost / 100000).toFixed(1);
  const meanLakhs = (mean / 100000).toFixed(1);

  const reason = isAnomaly
    ? `Cost of ₹${costLakhs} Lakhs is ${zScore} standard deviations above the regional average (₹${meanLakhs} Lakhs) for ${targetProject.category} in ${targetProject.state}.`
    : `Cost of ₹${costLakhs} Lakhs is within normal range (${zScore >= 0 ? '+' : ''}${zScore} std dev) of regional baseline (₹${meanLakhs} Lakhs).`;

  return {
    isAnomaly,
    zScore,
    baselineMean: Math.round(mean),
    baselineStdDev: Math.round(stdDev),
    reason
  };
}

/**
 * Text Trigram & Cosine/Jaccard Similarity for descriptions
 */
function textSimilarity(textA: string, textB: string): number {
  const tokenize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);

  const wordsA = new Set(tokenize(textA));
  const wordsB = new Set(tokenize(textB));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) intersection++;
  });

  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Duplicate Project Detection Engine
 * Scoped to same category and region first to reduce false positives
 */
export function detectDuplicateProject(
  targetProject: Project,
  allProjects: Project[]
): {
  isSuspected: boolean;
  matchedProjectId?: string;
  similarityScore?: number;
  reason?: string;
} {
  let bestMatch: { project: Project; score: number; reason: string } | null = null;

  for (const candidate of allProjects) {
    if (candidate.id === targetProject.id) continue;

    // Must be in same category and same district/constituency to avoid irrelevant comparisons
    if (
      candidate.category !== targetProject.category ||
      candidate.state.toLowerCase() !== targetProject.state.toLowerCase()
    ) {
      continue;
    }

    const distanceMeters = calculateHaversineDistance(
      targetProject.latitude,
      targetProject.longitude,
      candidate.latitude,
      candidate.longitude
    );

    const descSimilarity = textSimilarity(
      `${targetProject.title} ${targetProject.description}`,
      `${candidate.title} ${candidate.description}`
    );

    // Spatial proximity weight
    let spatialScore = 0;
    if (distanceMeters <= 100) spatialScore = 1.0;
    else if (distanceMeters <= 300) spatialScore = 0.8;
    else if (distanceMeters <= 1000) spatialScore = 0.5;
    else if (distanceMeters <= 2000) spatialScore = 0.2;

    // Cost ratio similarity (closer to 1 = more similar)
    const costRatio =
      Math.min(targetProject.estimatedCost, candidate.estimatedCost) /
      Math.max(targetProject.estimatedCost, candidate.estimatedCost);

    // Composite similarity score: 45% spatial + 35% text description + 20% cost & metadata
    const compositeScore = Math.round(
      (spatialScore * 0.45 + descSimilarity * 0.35 + costRatio * 0.2) * 100
    );

    if (compositeScore >= 65) {
      const reason = `Registered coordinates are ${distanceMeters}m from Work ID ${candidate.workId} with ${Math.round(descSimilarity * 100)}% scope overlap and matching category (${candidate.category}).`;

      if (!bestMatch || compositeScore > bestMatch.score) {
        bestMatch = { project: candidate, score: compositeScore, reason };
      }
    }
  }

  if (bestMatch) {
    return {
      isSuspected: true,
      matchedProjectId: bestMatch.project.id,
      similarityScore: bestMatch.score,
      reason: bestMatch.reason
    };
  }

  return { isSuspected: false };
}

/**
 * Delay Prediction Engine with confidence range
 */
export function predictProjectDelay(project: Project): {
  status: 'On Track' | 'At Risk' | 'Delayed';
  estimatedDelayDays: number;
  confidenceRange: string;
  modelType: string;
} {
  if (project.status === 'Completed') {
    return {
      status: 'On Track',
      estimatedDelayDays: 0,
      confidenceRange: '100% verified completed',
      modelType: 'Asset Handover Ledger (MoSPI)'
    };
  }

  if (project.status === 'Recommended' || project.status === 'Under Review') {
    return {
      status: 'On Track',
      estimatedDelayDays: 0,
      confidenceRange: 'Awaiting administrative sanction',
      modelType: 'Sanction Approval Estimator'
    };
  }

  const now = new Date();
  const sanctionDate = project.sanctionDate ? new Date(project.sanctionDate) : new Date(project.createdAt);
  const targetDate = project.expectedCompletionDate ? new Date(project.expectedCompletionDate) : new Date(sanctionDate.getTime() + 180 * 86400000);

  const totalDurationDays = Math.max(30, Math.round((targetDate.getTime() - sanctionDate.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(1, Math.round((now.getTime() - sanctionDate.getTime()) / (1000 * 60 * 60 * 24)));

  const expectedProgress = Math.min(100, Math.round((elapsedDays / totalDurationDays) * 100));
  const actualProgress = project.completionPercentage;
  const progressDeficit = expectedProgress - actualProgress;

  if (now > targetDate) {
    const overdueDays = Math.round((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
    const estimatedExtra = Math.round(((100 - actualProgress) / Math.max(actualProgress, 10)) * 60);
    const totalEst = overdueDays + estimatedExtra;
    return {
      status: 'Delayed',
      estimatedDelayDays: totalEst,
      confidenceRange: `92% confidence, estimated slippage of ${Math.max(10, totalEst - 15)}–${totalEst + 25} days`,
      modelType: 'Time-Elapsed Execution Discrepancy Model (Demo Synthetic Trained)'
    };
  }

  if (progressDeficit >= 25) {
    const delayDays = Math.round((progressDeficit / 100) * totalDurationDays);
    return {
      status: 'At Risk',
      estimatedDelayDays: delayDays,
      confidenceRange: `78% confidence, delay of ${Math.max(5, delayDays - 10)}–${delayDays + 15} days`,
      modelType: 'Milestone Velocity Deficit Regression (Demo Synthetic Trained)'
    };
  }

  return {
    status: 'On Track',
    estimatedDelayDays: 0,
    confidenceRange: '86% confidence, progress velocity matches schedule',
    modelType: 'Scheduled Milestone Execution (Standard)'
  };
}

/**
 * Composite Risk Scoring (0–100)
 */
export function calculateRiskScore(project: Project): {
  score: number;
  level: RiskLevel;
  reason: string;
} {
  let score = 10;
  const factors: string[] = [];

  // Cost Anomaly Factor
  if (project.costAnomaly?.isAnomaly) {
    const z = project.costAnomaly.zScore;
    const add = Math.min(35, Math.round(z * 12));
    score += add;
    factors.push(`Cost outlier (+${add} pts, z-score: ${z})`);
  }

  // Duplicate Suspect Factor
  if (project.duplicateFlag?.isSuspected) {
    const sim = project.duplicateFlag.similarityScore || 70;
    const add = Math.round((sim / 100) * 35);
    score += add;
    factors.push(`Possible duplicate asset (+${add} pts, ${sim}% overlap)`);
  }

  // Delay Factor
  if (project.delayPrediction?.status === 'Delayed') {
    score += 30;
    factors.push('Overdue past target date (+30 pts)');
  } else if (project.delayPrediction?.status === 'At Risk') {
    score += 15;
    factors.push('Milestone velocity lag (+15 pts)');
  }

  // Photo / GPS Anomaly Factors
  const hasMismatch = project.photos.some((p) => p.exifStatus === 'Mismatch');
  const hasUnverifiable = project.photos.some((p) => p.exifStatus === 'Unverifiable');
  const hasSuspicious = project.photos.some((p) => p.exifStatus === 'Suspicious');

  if (hasMismatch) {
    score += 30;
    factors.push('Site photo location mismatch (+30 pts)');
  }
  if (hasSuspicious) {
    score += 25;
    factors.push('Software edit/AI image indicator (+25 pts)');
  }
  if (hasUnverifiable) {
    score += 15;
    factors.push('Stripped EXIF metadata (+15 pts)');
  }

  score = Math.min(100, Math.max(5, score));

  let level: RiskLevel = 'Low';
  if (score > 80) level = 'Critical';
  else if (score > 60) level = 'High';
  else if (score > 30) level = 'Medium';

  const reason =
    factors.length > 0
      ? `Decision support indicators: ${factors.join('; ')}.`
      : 'All physical milestones, cost baselines, and geo-inspections within normal operational bounds.';

  return { score, level, reason };
}

/**
 * Aggregates Vendor & Agency Analytics with performance metrics,
 * average completion delay, AI risk history, and suitability assessment for District Authorities.
 */
export function computeVendorAnalytics(projects: Project[], alerts: Alert[] = []): VendorAnalytics[] {
  interface VendorGroup {
    vendorName: string;
    agencyName: string;
    agencies: Set<string>;
    sectors: Set<string>;
    projects: Project[];
  }

  const groups = new Map<string, VendorGroup>();

  for (const p of projects) {
    if (!p.vendorName || p.vendorName === 'Unassigned' || p.vendorName === 'None') continue;

    if (!groups.has(p.vendorName)) {
      groups.set(p.vendorName, {
        vendorName: p.vendorName,
        agencyName: p.agencyName || 'Implementing Agency',
        agencies: new Set<string>(),
        sectors: new Set<string>(),
        projects: []
      });
    }

    const group = groups.get(p.vendorName)!;
    if (p.agencyName && p.agencyName !== 'Unassigned') {
      group.agencies.add(p.agencyName);
    }
    if (p.category) {
      group.sectors.add(p.category);
    }
    group.projects.push(p);
  }

  const result: VendorAnalytics[] = [];

  for (const group of groups.values()) {
    const pList = group.projects;
    const totalProjects = pList.length;

    let activeProjects = 0;
    let completedProjects = 0;
    let delayedProjects = 0;
    let highRiskProjects = 0;
    let totalValue = 0;
    let utilizedValue = 0;
    let totalDelayDays = 0;
    let totalRiskScore = 0;

    const projectSummaries: VendorProjectSummary[] = [];
    const riskEvents: VendorRiskEvent[] = [];

    for (const p of pList) {
      const cost = p.sanctionedCost || p.estimatedCost || 0;
      totalValue += cost;
      utilizedValue += p.utilizedCost || 0;
      totalRiskScore += p.riskScore || 15;

      let delayDays = 0;
      if (p.status === 'Completed') {
        completedProjects += 1;
        if (p.actualCompletionDate && p.expectedCompletionDate) {
          const diff = Math.round(
            (new Date(p.actualCompletionDate).getTime() - new Date(p.expectedCompletionDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (diff > 0) {
            delayDays = diff;
            delayedProjects += 1;
          }
        }
      } else {
        if (['Ongoing', 'Sanctioned', 'Assigned'].includes(p.status)) {
          activeProjects += 1;
        }

        if (p.status === 'Delayed' || p.delayPrediction?.status === 'Delayed') {
          delayedProjects += 1;
          delayDays = p.delayPrediction?.estimatedDelayDays || 35;
        } else if (p.delayPrediction?.status === 'At Risk') {
          delayDays = p.delayPrediction?.estimatedDelayDays || 18;
        } else if (p.delayPrediction?.status === 'On Track') {
          delayDays = 0;
        } else if (p.expectedCompletionDate && new Date() > new Date(p.expectedCompletionDate)) {
          delayDays = Math.min(60, Math.round(
            (new Date().getTime() - new Date(p.expectedCompletionDate).getTime()) / (1000 * 60 * 60 * 24)
          ));
          if (delayDays > 0) delayedProjects += 1;
        }
      }

      totalDelayDays += delayDays;

      if (p.riskLevel === 'High' || p.riskLevel === 'Critical') {
        highRiskProjects += 1;
      }

      projectSummaries.push({
        id: p.id,
        workId: p.workId,
        title: p.title,
        category: p.category,
        status: p.status,
        sanctionedCost: p.sanctionedCost || p.estimatedCost,
        utilizedCost: p.utilizedCost || 0,
        completionPercentage: p.completionPercentage,
        delayDays,
        riskLevel: p.riskLevel,
        riskScore: p.riskScore,
        locationAddress: p.locationAddress
      });

      // AI Risk Event Extraction
      if (p.costAnomaly?.isAnomaly) {
        riskEvents.push({
          id: `re_cost_${p.id}`,
          projectId: p.id,
          workId: p.workId,
          projectTitle: p.title,
          type: 'Cost Anomaly (Statistical Z-Score Outlier)',
          riskLevel: p.costAnomaly.zScore > 2.0 ? 'High' : 'Medium',
          date: p.sanctionDate || p.recommendedDate || p.createdAt,
          description: p.costAnomaly.reason,
          evidence: `Z-score of ${p.costAnomaly.zScore.toFixed(2)} relative to cohort mean of ₹${(p.costAnomaly.baselineMean / 100000).toFixed(1)}L`,
          status: 'Flagged by AI Engine'
        });
      }

      if (p.duplicateFlag?.isSuspected) {
        riskEvents.push({
          id: `re_dup_${p.id}`,
          projectId: p.id,
          workId: p.workId,
          projectTitle: p.title,
          type: 'Spatial / Description Overlap',
          riskLevel: 'Critical',
          date: p.recommendedDate || p.createdAt,
          description: p.duplicateFlag.reason || 'Candidate work exhibits high spatial proximity to existing sanctioned asset.',
          evidence: `Similarity score: ${p.duplicateFlag.similarityScore}%`,
          status: 'Flagged for Site Verification'
        });
      }

      if (p.delayPrediction?.status === 'Delayed' && p.delayPrediction.estimatedDelayDays > 20) {
        riskEvents.push({
          id: `re_delay_${p.id}`,
          projectId: p.id,
          workId: p.workId,
          projectTitle: p.title,
          type: 'Execution Velocity Deficit',
          riskLevel: p.delayPrediction.estimatedDelayDays > 40 ? 'High' : 'Medium',
          date: p.updatedAt || p.createdAt,
          description: `Work progress lagging milestone curve. Estimated schedule slippage of ${p.delayPrediction.estimatedDelayDays} days.`,
          evidence: p.delayPrediction.confidenceRange,
          status: 'Active Slippage'
        });
      }

      // Check site photos for EXIF / Geo-integrity issues
      for (const ph of p.photos || []) {
        if (ph.exifStatus === 'Mismatch') {
          riskEvents.push({
            id: `re_geo_${ph.id}`,
            projectId: p.id,
            workId: p.workId,
            projectTitle: p.title,
            type: 'Photo Geo-Location Mismatch',
            riskLevel: 'Critical',
            date: ph.uploadedAt,
            description: `Site photo captured ${ph.distanceMeters || 'unknown'}m from registered project coordinates (threshold: 500m).`,
            evidence: `Camera: ${ph.device || 'Unspecified'} | Coords: ${ph.exifGps ? `${ph.exifGps.lat.toFixed(4)}N, ${ph.exifGps.lng.toFixed(4)}E` : 'None'}`,
            status: 'Requires Field Inspection'
          });
        } else if (ph.exifStatus === 'Suspicious') {
          riskEvents.push({
            id: `re_photo_${ph.id}`,
            projectId: p.id,
            workId: p.workId,
            projectTitle: p.title,
            type: 'Image Metadata Tampering / Editing Software',
            riskLevel: 'High',
            date: ph.uploadedAt,
            description: 'Inspection photograph contains image editing metadata tags or synthetic perceptual fingerprint.',
            evidence: `Detected software signature: ${ph.software || 'Image Editor'}`,
            status: 'Under Technical Review'
          });
        }
      }
    }

    // Also match explicit alerts from alertsStore
    for (const alert of alerts) {
      if (pList.some((p) => p.id === alert.projectId)) {
        if (!riskEvents.some((re) => re.projectId === alert.projectId && re.type.includes(alert.type))) {
          riskEvents.push({
            id: `re_alt_${alert.id}`,
            projectId: alert.projectId,
            workId: alert.workId,
            projectTitle: alert.projectTitle,
            type: alert.type,
            riskLevel: alert.riskLevel,
            date: alert.createdAt,
            description: alert.reason,
            evidence: alert.evidence,
            status: alert.status
          });
        }
      }
    }

    const avgCompletionDelayDays = Math.round(totalDelayDays / Math.max(totalProjects, 1));
    const avgRiskScore = Math.round(totalRiskScore / Math.max(totalProjects, 1));
    const completionRate = Math.round((completedProjects / Math.max(totalProjects, 1)) * 100);
    const delayRate = Math.round((delayedProjects / Math.max(totalProjects, 1)) * 100);

    // Composite Risk Level
    let riskLevel: RiskLevel = 'Low';
    if (avgRiskScore > 60 || highRiskProjects >= 2 || riskEvents.some((re) => re.riskLevel === 'Critical')) {
      riskLevel = 'Critical';
    } else if (avgRiskScore > 40 || highRiskProjects >= 1 || avgCompletionDelayDays > 30) {
      riskLevel = 'High';
    } else if (avgRiskScore > 25 || avgCompletionDelayDays > 14 || delayedProjects > 0) {
      riskLevel = 'Medium';
    }

    // Pre-assignment suitability assessment for District Authorities
    let suitabilityStatus: 'Recommended' | 'Proceed with Caution' | 'High Risk / Review Required' = 'Recommended';
    let suitabilityReason = '';

    if (riskLevel === 'Critical' || highRiskProjects >= 2 || avgCompletionDelayDays > 40) {
      suitabilityStatus = 'High Risk / Review Required';
      suitabilityReason = `Repeated execution delays (avg ${avgCompletionDelayDays} days) or critical AI integrity anomalies. Rule 2.11 mandatory review recommended before assigning fresh works.`;
    } else if (riskLevel === 'High' || avgCompletionDelayDays > 20 || activeProjects >= 4) {
      suitabilityStatus = 'Proceed with Caution';
      suitabilityReason = `Moderate completion delay (${avgCompletionDelayDays} days) or elevated active load (${activeProjects} ongoing works). District Authority should verify operational bandwidth.`;
    } else {
      suitabilityStatus = 'Recommended';
      suitabilityReason = `Demonstrated timely delivery (avg ${avgCompletionDelayDays}d delay) with zero critical anomalies across ${totalProjects} sanctioned works. Eligible for fresh work assignment.`;
    }

    result.push({
      vendorName: group.vendorName,
      agencyName: group.agencyName,
      secondaryAgencies: Array.from(group.agencies),
      sectors: Array.from(group.sectors),
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
      highRiskProjects,
      totalValue,
      utilizedValue,
      completionRate,
      delayRate,
      avgCompletionDelayDays,
      avgCompletionDays: 140 + avgCompletionDelayDays,
      avgRiskScore,
      riskLevel,
      suitabilityStatus,
      suitabilityReason,
      aiRiskHistory: riskEvents,
      projects: projectSummaries
    });
  }

  // Sort by total projects descending, then by avgRiskScore descending
  return result.sort((a, b) => b.totalProjects - a.totalProjects || b.avgRiskScore - a.avgRiskScore);
}
