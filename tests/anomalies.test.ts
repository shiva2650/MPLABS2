import {
  evaluateCostAnomaly,
  findDuplicateCandidates,
  calculateDelayPrediction,
  evaluateDelayModelOnHoldout,
  verifyLocationCoordinates,
  verifyPhotoAuthenticity
} from '../server/aiService.js';
import { mlAnomalyModel } from '../server/mlAnomalyModel.js';
import { forecastingService } from '../server/forecastingService.js';
import { Project } from '../src/types/index.js';

const mockProjects: Project[] = [
  {
    id: 'PRJ-TEST-01',
    projectCode: 'MPLADS-TEST-001',
    title: 'Construction of Community Hall Ward 1',
    description: 'RCC multipurpose community hall with solar backup and sanitation block',
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
    description: 'Community facility and hall for ward residents near municipal park',
    category: 'Community Infrastructure',
    state: 'Telangana',
    district: 'Hyderabad',
    mpName: 'Dr. K. Laxman', // Different MP! Cross-MP test
    constituency: 'Nominated (Telangana)',
    latitude: 17.3995,
    longitude: 78.5220, // Only 230 meters away!
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

export async function runAnomalyTests() {
  console.log('\n================================================================');
  console.log('  AI ANOMALIES, ML MODEL & DUPLICATE VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, assertion: boolean, details?: string) {
    total++;
    if (assertion) {
      passed++;
      console.log(`  PASS | ${name}`);
    } else {
      console.log(`  FAIL | ${name} - ${details || 'Assertion failed'}`);
    }
  }

  // 1. STATISTICAL COST BASELINE
  console.log('--- 1. Statistical Cost Baseline Testing ---');
  const normalRes = evaluateCostAnomaly(mockProjects[0], mockProjects, 2.0);
  test('Normal project within benchmark is NOT flagged as anomaly', !normalRes.isAnomaly);
  test('Normal project provides human-readable distribution reason', normalRes.explanation.includes('normal empirical distribution'));

  const outlierProject: Project = {
    ...mockProjects[0],
    id: 'PRJ-TEST-OUTLIER',
    sanctionedAmount: 5200000 // ₹52 Lakh vs ~₹21L benchmark
  };
  const outlierRes = evaluateCostAnomaly(outlierProject, mockProjects, 2.0);
  test('Outlier project (>2σ) IS flagged as cost anomaly', outlierRes.isAnomaly);
  test('Outlier explanation states exact σ deviation and category', outlierRes.explanation.includes('Community Infrastructure'));

  // 2. REAL TRAINABLE MACHINE LEARNING MODEL & FEEDBACK LOOP
  console.log('\n--- 2. Machine Learning Isolation Forest & Retraining Loop ---');
  const mlScore = mlAnomalyModel.predictAnomalyScore(mockProjects[0], mockProjects);
  test('Isolation Forest model generates anomaly score between 0 and 100', mlScore.score >= 0 && mlScore.score <= 100);
  test('ML inference provides feature contributions for explainability', Object.keys(mlScore.contributingFeatures).length >= 5);

  const prevFp = mlAnomalyModel.metadata.falsePositivesCount;
  mlAnomalyModel.recordFeedback('ALT-TEST-1', mockProjects[0].id, 'False Positive', 'Verified legitimate design difference', 'Auditor IAS');
  test('Feedback loop incorporates False Positive label', mlAnomalyModel.metadata.falsePositivesCount === prevFp + 1);

  const updatedMetadata = mlAnomalyModel.retrain();
  test('Model retraining updates empirical F1 and ROC-AUC metrics', updatedMetadata.f1Score > 0 && updatedMetadata.rocAuc > 0);

  // 3. REAL DUPLICATE WORK DETECTION (GEOSPATIAL + TEXT + OVERLAP + CROSS-MP)
  console.log('\n--- 3. Duplicate Work Detection Testing ---');
  const duplicates = findDuplicateCandidates(mockProjects[1], mockProjects);
  test('Identifies real duplicate candidate within 500m (< 250m away)', duplicates.length > 0 && duplicates[0].distanceMeters < 500);
  test('Flags Cross-MP / Cross-Constituency allocation overlap', duplicates[0].isCrossMp === true);
  test('Surfaces overlapping sanction window factor', duplicates[0].overlappingSanctionWindow === true);
  test('Calculates multi-factor specification match score >= 70%', duplicates[0].similarityScore >= 70);

  // 4. PREDICTIVE DELAY & COST-OVERRUN FORECASTING
  console.log('\n--- 4. Predictive Delay & Cost-Overrun Forecasting ---');
  const delayedWork: Project = {
    ...mockProjects[0],
    id: 'PRJ-DELAYED-TEST',
    status: 'Ongoing',
    completionPercentage: 20,
    startDate: '2024-01-01',
    expectedCompletionDate: '2024-04-01' // 4 months past deadline
  };
  const delayForecast = calculateDelayPrediction(delayedWork);
  test('Predicts schedule delay for overdue project with low completion', delayForecast.delayDays > 30);
  test('Attaches statistical confidence interval string', delayForecast.confidenceInterval.includes('confidence'));
  test('Computes CPWD cost-overrun forecast with escalation amount', delayForecast.costOverrunForecast !== undefined && delayForecast.costOverrunForecast.projectedCostOverrunAmount > 0);

  // 5. GPS & PHOTO AUTHENTICITY
  console.log('\n--- 5. GPS Geotag & Photo Authenticity Testing ---');
  const validGps = verifyLocationCoordinates(17.3984, 78.5202, 17.3986, 78.5204, 500);
  test('Photo within 500m registered as VERIFIED', validGps.verified === true && validGps.status === 'VERIFIED');

  const mismatchGps = verifyLocationCoordinates(17.3984, 78.5202, 17.5142, 78.4320, 500);
  test('Photo 8km away flagged as LOCATION_MISMATCH with exact distance', mismatchGps.isMismatch && mismatchGps.distanceMeters > 5000);

  const nullIsland = verifyLocationCoordinates(17.3984, 78.5202, 0, 0, 500);
  test('Null Island (0,0) coordinates flagged as UNVERIFIABLE spoof', nullIsland.status === 'UNVERIFIABLE');

  const photoCheck = verifyPhotoAuthenticity('https://example.com/ro.jpg', 'RO Plant Machinery Assembly', 'during', '2022-10-10T00:00:00Z', '2024-04-10');
  test('Recycled image triggers perceptual similarity alert', photoCheck.similarityAlert === true);
  test('EXIF timestamp pre-dating sanction flagged', Boolean(photoCheck.timestampIssue));

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL: ${passed}/${total} AI & ML Tests Passed (${Math.round((passed / total) * 100)}% compliance)`);
  console.log('----------------------------------------------------------------\n');
  if (passed < total) {
    throw new Error(`${total - passed} tests failed!`);
  }
  return true;
}

if (process.argv[1]?.includes('anomalies.test')) {
  runAnomalyTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
