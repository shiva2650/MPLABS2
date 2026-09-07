import {
  evaluateCostAnomaly,
  findDuplicateCandidates,
  calculateDelayPrediction,
  verifyLocationCoordinates,
  verifyPhotoAuthenticity
} from '../server/aiService.js';

import { mlAnomalyModel } from '../server/mlAnomalyModel.js';
import { Project } from '../src/types/index.js';

const mockProjects: Project[] = [
  {
    id: 'PRJ-TEST-01',
    projectCode: 'MPLADS-TEST-001',
    title: 'Construction of Community Hall Ward 1',
    description:
      'RCC multipurpose community hall with solar backup and sanitation block',
    category: 'Community Infrastructure',
    state: 'Telangana',
    district: 'Hyderabad',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    latitude: 17.3984,
    longitude: 78.5202,
    estimatedCost: 2100000,
    sanctionedAmount: 2100000,
    fundsUtilized: 1200000,
    startDate: '2024-01-01',
    expectedCompletionDate: '2024-08-31',
    status: 'Ongoing',
    completionPercentage: 55,
    photos: [],
    documents: [],
    payments: [],
    timeline: [],
    riskAnalysis: {} as any
  },
  {
    id: 'PRJ-TEST-02',
    projectCode: 'MPLADS-TEST-002',
    title: 'Community Welfare Center & Hall Ward 1',
    description:
      'Community facility and hall for ward residents near municipal park',
    category: 'Community Infrastructure',
    state: 'Telangana',
    district: 'Hyderabad',
    mpName: 'Dr. K. Laxman',
    constituency: 'Nominated (Telangana)',
    latitude: 17.3995,
    longitude: 78.5220,
    estimatedCost: 2200000,
    sanctionedAmount: 2200000,
    fundsUtilized: 600000,
    startDate: '2024-03-01',
    expectedCompletionDate: '2024-11-30',
    status: 'Ongoing',
    completionPercentage: 25,
    photos: [],
    documents: [],
    payments: [],
    timeline: [],
    riskAnalysis: {} as any
  }
];

export async function runAnomalyTests(): Promise<boolean> {
  console.log('\n===============================================================');
  console.log(' AI ANOMALIES, ML MODEL & DUPLICATE VERIFICATION TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function test(
    name: string,
    assertion: boolean,
    details = 'Assertion failed'
  ): void {
    total++;

    if (assertion) {
      passed++;
      console.log(`  PASS | ${name}`);
    } else {
      console.log(`  FAIL | ${name} - ${details}`);
    }
  }

  // ===============================================================
  // 1. STATISTICAL COST BASELINE
  // ===============================================================

  console.log('--- 1. Statistical Cost Baseline Testing ---');

  const normalProject = mockProjects[0];

  const normalRes = evaluateCostAnomaly(
    normalProject,
    mockProjects,
    2.0
  );

  test(
    'Normal project within benchmark is NOT flagged as anomaly',
    normalRes.isAnomaly === false
  );

  test(
    'Normal project provides human-readable distribution reason',
    typeof normalRes.explanation === 'string' &&
      normalRes.explanation.includes('normal empirical distribution')
  );

  const outlierProject: Project = {
    ...normalProject,
    id: 'PRJ-TEST-OUTLIER',
    projectCode: 'MPLADS-TEST-OUTLIER',
    sanctionedAmount: 5200000
  };

  const outlierRes = evaluateCostAnomaly(
    outlierProject,
    mockProjects,
    2.0
  );

  test(
    'Outlier project (>2σ) IS flagged as cost anomaly',
    outlierRes.isAnomaly === true
  );

  test(
    'Outlier explanation states category',
    typeof outlierRes.explanation === 'string' &&
      outlierRes.explanation.includes('Community Infrastructure')
  );

  // ===============================================================
  // 2. MACHINE LEARNING ISOLATION FOREST
  // ===============================================================

  console.log(
    '\n--- 2. Machine Learning Isolation Forest & Retraining Loop ---'
  );

  const mlScore = mlAnomalyModel.predictAnomalyScore(
    normalProject,
    mockProjects
  );

  test(
    'Isolation Forest model generates anomaly score between 0 and 100',
    typeof mlScore.score === 'number' &&
      Number.isFinite(mlScore.score) &&
      mlScore.score >= 0 &&
      mlScore.score <= 100
  );

  test(
    'ML inference provides feature contributions for explainability',
    mlScore.contributingFeatures !== undefined &&
      Object.keys(mlScore.contributingFeatures).length >= 5
  );

  const previousFalsePositives =
    mlAnomalyModel.metadata.falsePositivesCount;

  mlAnomalyModel.recordFeedback(
    'ALT-TEST-1',
    normalProject.id,
    'False Positive',
    'Verified legitimate design difference',
    'Auditor IAS'
  );

  test(
    'Feedback loop incorporates False Positive label',
    mlAnomalyModel.metadata.falsePositivesCount ===
      previousFalsePositives + 1
  );

  const updatedMetadata = mlAnomalyModel.retrain();

  test(
    'Model retraining updates empirical F1 and ROC-AUC metrics',
    typeof updatedMetadata.f1Score === 'number' &&
      typeof updatedMetadata.rocAuc === 'number' &&
      updatedMetadata.f1Score > 0 &&
      updatedMetadata.rocAuc > 0
  );

  // ===============================================================
  // 3. DUPLICATE WORK DETECTION
  // ===============================================================

  console.log(
    '\n--- 3. Duplicate Work Detection Testing ---'
  );

  const duplicates = findDuplicateCandidates(
    mockProjects[1],
    mockProjects
  );

  const duplicate = duplicates.length > 0
    ? duplicates[0]
    : undefined;

  test(
    'Identifies duplicate candidate within 500m',
    duplicate !== undefined &&
      typeof duplicate.distanceMeters === 'number' &&
      duplicate.distanceMeters < 500
  );

  test(
    'Flags Cross-MP / Cross-Constituency allocation overlap',
    duplicate !== undefined &&
      duplicate.isCrossMp === true
  );

  test(
    'Surfaces overlapping sanction window factor',
    duplicate !== undefined &&
      duplicate.overlappingSanctionWindow === true
  );

  test(
    'Calculates multi-factor specification match score >= 70%',
    duplicate !== undefined &&
      typeof duplicate.similarityScore === 'number' &&
      duplicate.similarityScore >= 70
  );

  // ===============================================================
  // 4. PREDICTIVE DELAY & COST-OVERRUN FORECASTING
  // ===============================================================

  console.log(
    '\n--- 4. Predictive Delay & Cost-Overrun Forecasting ---'
  );

  const delayedWork: Project = {
    ...normalProject,
    id: 'PRJ-DELAYED-TEST',
    projectCode: 'MPLADS-DELAY-TEST',
    status: 'Ongoing',
    completionPercentage: 20,
    startDate: '2024-01-01',
    expectedCompletionDate: '2024-04-01'
  };

  const delayForecast = calculateDelayPrediction(
    delayedWork
  );

  test(
    'Predicts schedule delay for overdue project with low completion',
    typeof delayForecast.delayDays === 'number' &&
      delayForecast.delayDays > 30
  );

  test(
    'Attaches statistical confidence interval string',
    typeof delayForecast.confidenceInterval === 'string' &&
      delayForecast.confidenceInterval
        .toLowerCase()
        .includes('confidence')
  );

  test(
    'Computes CPWD cost-overrun forecast with escalation amount',
    delayForecast.costOverrunForecast !== undefined &&
      typeof delayForecast.costOverrunForecast
        .projectedCostOverrunAmount === 'number' &&
      delayForecast.costOverrunForecast
        .projectedCostOverrunAmount > 0
  );

  // ===============================================================
  // 5. GPS & PHOTO AUTHENTICITY
  // ===============================================================

  console.log(
    '\n--- 5. GPS Geotag & Photo Authenticity Testing ---'
  );

  const validGps = verifyLocationCoordinates(
    17.3984,
    78.5202,
    17.3986,
    78.5204,
    500
  );

  test(
    'Photo within 500m registered as VERIFIED',
    validGps.verified === true &&
      validGps.status === 'VERIFIED'
  );

  const mismatchGps = verifyLocationCoordinates(
    17.3984,
    78.5202,
    17.5142,
    78.4320,
    500
  );

  test(
    'Photo far from registered location flagged as LOCATION_MISMATCH',
    mismatchGps.isMismatch === true &&
      typeof mismatchGps.distanceMeters === 'number' &&
      mismatchGps.distanceMeters > 5000
  );

  const nullIsland = verifyLocationCoordinates(
    17.3984,
    78.5202,
    0,
    0,
    500
  );

  test(
    'Null Island (0,0) coordinates flagged as UNVERIFIABLE',
    nullIsland.status === 'UNVERIFIABLE'
  );

  // ===============================================================
  // PHOTO AUTHENTICITY
  // ===============================================================

  const photoCheck = verifyPhotoAuthenticity(
    'https://example.com/ro.jpg',
    'RO Plant Machinery Assembly',
    'during',
    '2022-10-10T00:00:00Z',
    '2024-04-10'
  );

  test(
    'Recycled image triggers perceptual similarity alert',
    photoCheck.similarityAlert === true
  );

  test(
    'EXIF timestamp pre-dating sanction flagged',
    Boolean(photoCheck.timestampIssue)
  );

  // ===============================================================
  // FINAL RESULT
  // ===============================================================

  console.log(
    '\n---------------------------------------------------------------'
  );

  const percentage =
    total === 0
      ? 0
      : Math.round((passed / total) * 100);

  console.log(
    `TOTAL: ${passed}/${total} AI & ML Tests Passed (${percentage}% compliance)`
  );

  console.log(
    '---------------------------------------------------------------\n'
  );

  if (passed < total) {
    throw new Error(
      `${total - passed} test(s) failed!`
    );
  }

  return true;
}

// ===============================================================
// RUN TEST SUITE DIRECTLY
// ===============================================================

const currentFile = process.argv[1] ?? '';

if (
  currentFile.includes('anomalies.test') ||
  currentFile.includes('anomaliesTest')
) {
  runAnomalyTests()
    .then(() => {
      console.log(
        'All anomaly tests completed successfully.'
      );

      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(
        '\nAnomaly test suite failed:'
      );

      if (error instanceof Error) {
        console.error(error.message);
        console.error(error.stack);
      } else {
        console.error(error);
      }

      process.exit(1);
    });
}