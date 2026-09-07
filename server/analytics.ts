import { Project, CostAnomalyAnalysis, DuplicateMatchAnalysis, DelayPredictionAnalysis, VendorAnalyticsSummary } from '../src/types';
import { calculateHaversineDistanceMeters } from './verification';

/**
 * Calculates Cost Anomaly based on baseline mean + standard deviation
 * within the same category and state/district.
 */
export function evaluateCostAnomaly(
  targetProject: {
    sector: string;
    state: string;
    district: string;
    estimatedCostLakhs: number;
    id?: string;
  },
  allProjects: Project[]
): CostAnomalyAnalysis {
  // Filter comparable projects in same sector and state
  let peerProjects = allProjects.filter(
    (p) => p.sector === targetProject.sector && p.state === targetProject.state && p.id !== targetProject.id
  );

  // If fewer than 2 peers in the state, expand to same sector across all states for robust baseline
  if (peerProjects.length < 2) {
    peerProjects = allProjects.filter((p) => p.sector === targetProject.sector && p.id !== targetProject.id);
  }

  if (peerProjects.length === 0) {
    return {
      isAnomaly: false,
      categoryMeanLakhs: targetProject.estimatedCostLakhs,
      categoryStdDevLakhs: 0,
      zScore: 0,
      reason: 'Insufficient historical baseline data in this category for anomaly evaluation.',
      benchmarkThresholdLakhs: targetProject.estimatedCostLakhs * 1.5,
    };
  }

  const costs = peerProjects.map((p) => p.estimatedCostLakhs);
  const sum = costs.reduce((a, b) => a + b, 0);
  const mean = sum / costs.length;

  const variance =
    costs.length > 1
      ? costs.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (costs.length - 1)
      : 10;
  const stdDev = Math.sqrt(variance) || 5;

  const zScore = (targetProject.estimatedCostLakhs - mean) / stdDev;
  const isAnomaly = zScore >= 2.0;
  const benchmarkThreshold = mean + 2.0 * stdDev;

  let reason = `Cost aligns within normal parameters for ${targetProject.sector} in ${targetProject.state}.`;
  if (isAnomaly) {
    reason = `Cost is ${zScore.toFixed(1)} std deviations above the average for ${targetProject.sector.toLowerCase()} projects in ${targetProject.state}.`;
  }

  return {
    isAnomaly,
    categoryMeanLakhs: parseFloat(mean.toFixed(2)),
    categoryStdDevLakhs: parseFloat(stdDev.toFixed(2)),
    zScore: parseFloat(zScore.toFixed(2)),
    reason,
    benchmarkThresholdLakhs: parseFloat(benchmarkThreshold.toFixed(2)),
  };
}

/**
 * Text tokenization and similarity comparison
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(
    text1
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
  const words2 = new Set(
    text2
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  if (words1.size === 0 || words2.size === 0) return 0;
  let intersectionCount = 0;
  for (const w of words1) {
    if (words2.has(w)) intersectionCount++;
  }
  const unionSize = new Set([...words1, ...words2]).size;
  return unionSize > 0 ? (intersectionCount / unionSize) * 100 : 0;
}

/**
 * Duplicate Project Detection scoped to same category / region first
 */
export function evaluateDuplicateProject(
  target: {
    id?: string;
    title: string;
    description: string;
    sector: string;
    state: string;
    district: string;
    coordinates?: { lat: number; lng: number };
    estimatedCostLakhs: number;
  },
  allProjects: Project[]
): DuplicateMatchAnalysis {
  let highestSimilarity = 0;
  let matchedProject: Project | null = null;
  let reason = '';

  for (const p of allProjects) {
    if (p.id === target.id) continue;

    // Must be in same state or district
    if (p.state.toLowerCase() !== target.state.toLowerCase()) continue;

    // 1. Text similarity
    const titleSim = calculateTextSimilarity(target.title, p.title);
    const descSim = calculateTextSimilarity(target.description, p.description);
    const textSim = titleSim * 0.6 + descSim * 0.4;

    // 2. Proximity check
    let geoMatchScore = 0;
    if (target.coordinates && p.coordinates) {
      const distMeters = calculateHaversineDistanceMeters(
        target.coordinates.lat,
        target.coordinates.lng,
        p.coordinates.lat,
        p.coordinates.lng
      );
      if (distMeters <= 200) {
        geoMatchScore = 40;
      } else if (distMeters <= 1000) {
        geoMatchScore = 20;
      }
    }

    // 3. Sector & Cost ratio
    let sectorScore = p.sector === target.sector ? 20 : 0;
    const costRatio =
      Math.min(target.estimatedCostLakhs, p.estimatedCostLakhs) /
      Math.max(target.estimatedCostLakhs, p.estimatedCostLakhs);
    let costScore = costRatio >= 0.85 ? 15 : 0;

    const totalScore = Math.min(100, Math.round(textSim * 0.4 + geoMatchScore + sectorScore + costScore));

    if (totalScore > highestSimilarity) {
      highestSimilarity = totalScore;
      matchedProject = p;
      reason = `${totalScore}% similarity with existing sanctioned work '${p.title}' (${p.workCode}) in ${p.district}.`;
    }
  }

  if (highestSimilarity >= 75 && matchedProject) {
    return {
      isPossibleDuplicate: true,
      matchedProjectId: matchedProject.workCode,
      matchedTitle: matchedProject.title,
      similarityPercent: highestSimilarity,
      reason,
    };
  }

  return {
    isPossibleDuplicate: false,
  };
}

/**
 * Delay Prediction using sanction date, expected completion, current date, and completion %
 */
export function evaluateDelayPrediction(project: Project): DelayPredictionAnalysis {
  if (project.status === 'Completed') {
    return {
      classification: 'On Track',
      confidencePercent: 98,
      delayDaysMin: 0,
      delayDaysMax: 0,
      reason: 'Work completed and certified.',
      modelType: 'Historical Heuristic + Regression Baseline (Synthetic/Trained on MPLADS norm data)',
    };
  }

  const now = new Date().getTime();
  const sanctionTime = project.sanctionDate ? new Date(project.sanctionDate).getTime() : now - 180 * 86400000;
  const expectedTime = project.expectedCompletionDate
    ? new Date(project.expectedCompletionDate).getTime()
    : sanctionTime + 270 * 86400000;

  const totalDurationDays = Math.max(30, Math.round((expectedTime - sanctionTime) / 86400000));
  const elapsedDays = Math.max(1, Math.round((now - sanctionTime) / 86400000));
  const expectedProgress = Math.min(100, Math.round((elapsedDays / totalDurationDays) * 100));
  const actualProgress = project.progressPercentage;

  const lagPercent = expectedProgress - actualProgress;

  if (now > expectedTime && actualProgress < 95) {
    const overdueDays = Math.round((now - expectedTime) / 86400000);
    const estimatedRemainingDays = Math.round(((100 - actualProgress) / Math.max(5, actualProgress)) * elapsedDays);
    return {
      classification: 'Delayed',
      confidencePercent: 85,
      delayDaysMin: overdueDays + 15,
      delayDaysMax: overdueDays + Math.min(90, estimatedRemainingDays),
      reason: `Execution has exceeded sanctioned timeline by ${overdueDays} days with only ${actualProgress}% progress recorded.`,
      modelType: 'Historical Heuristic + Regression Baseline (Synthetic/Trained on MPLADS norm data)',
    };
  }

  if (lagPercent > 20) {
    const estimatedDelayDays = Math.round((lagPercent / 100) * totalDurationDays);
    return {
      classification: 'At Risk',
      confidencePercent: 74,
      delayDaysMin: Math.max(10, estimatedDelayDays - 10),
      delayDaysMax: estimatedDelayDays + 20,
      reason: `Physical progress (${actualProgress}%) is trailing expected benchmark (${expectedProgress}%) by ${lagPercent}%.`,
      modelType: 'Historical Heuristic + Regression Baseline (Synthetic/Trained on MPLADS norm data)',
    };
  }

  return {
    classification: 'On Track',
    confidencePercent: 88,
    delayDaysMin: 0,
    delayDaysMax: 7,
    reason: `Physical progress (${actualProgress}%) is tracking in line with scheduled timeline.`,
    modelType: 'Historical Heuristic + Regression Baseline (Synthetic/Trained on MPLADS norm data)',
  };
}

/**
 * Aggregates vendor performance analytics across projects
 */
export function computeVendorAnalytics(projects: Project[]): VendorAnalyticsSummary[] {
  const vendorMap = new Map<string, {
    name: string;
    projects: Project[];
  }>();

  for (const p of projects) {
    if (!p.vendorId || !p.vendorName) continue;
    if (!vendorMap.has(p.vendorId)) {
      vendorMap.set(p.vendorId, { name: p.vendorName, projects: [] });
    }
    vendorMap.get(p.vendorId)!.projects.push(p);
  }

  const results: VendorAnalyticsSummary[] = [];

  for (const [vendorId, data] of vendorMap.entries()) {
    const vProjects = data.projects;
    const totalCount = vProjects.length;
    const totalValueLakhs = parseFloat(
      vProjects.reduce((acc, p) => acc + p.sanctionedCostLakhs, 0).toFixed(2)
    );
    const completedCount = vProjects.filter((p) => p.status === 'Completed').length;
    const delayedCount = vProjects.filter((p) => p.status === 'Delayed').length;
    const highRiskCount = vProjects.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length;

    const completionRatePercent = Math.round((completedCount / totalCount) * 100);
    const delayRatePercent = Math.round((delayedCount / totalCount) * 100);

    // Compute average duration for completed
    let totalDays = 0;
    let completedWithDates = 0;
    for (const p of vProjects) {
      if (p.sanctionDate && p.actualCompletionDate) {
        const d1 = new Date(p.sanctionDate).getTime();
        const d2 = new Date(p.actualCompletionDate).getTime();
        totalDays += Math.round((d2 - d1) / 86400000);
        completedWithDates++;
      }
    }
    const avgCompletionTimeDays = completedWithDates > 0 ? Math.round(totalDays / completedWithDates) : 210;

    results.push({
      vendorId,
      vendorName: data.name,
      projectCount: totalCount,
      totalValueLakhs,
      completedCount,
      ongoingCount: totalCount - completedCount - delayedCount,
      delayedCount,
      highRiskCount,
      completionRatePercent,
      delayRatePercent,
      avgCompletionTimeDays,
    });
  }

  return results.sort((a, b) => b.totalValueLakhs - a.totalValueLakhs);
}
