/**
 * AUTOMATED AI ANOMALIES & INTEGRITY VERIFICATION TEST SUITE
 * Tests:
 * 1. Dynamic statistical cost baseline (mean + std dev per category & state, z-score outlier, human-readable reason string)
 * 2. Partitioned duplicate detection (category + state/district/25km first)
 * 3. Delay prediction model (confidence intervals, synthetic data disclaimer, holdout split metrics)
 * 4. GPS location verification (Null Island 0,0 spoofing, missing EXIF, >500m threshold alert)
 * 5. Perceptual hashing photo duplicate detection
 */

import {
  evaluateCostAnomaly,
  findDuplicateCandidates,
  calculateDelayPrediction,
  evaluateDelayModelOnHoldout,
  verifyLocationCoordinates,
  verifyPhotoAuthenticity
} from '../server/aiService.js';
import { Project } from '../src/types/index.js';

// Construct sample cohort of projects for statistical baselining
const mockRoadProjects = [
  {
    id: 'PRJ-MOCK-01',
    projectCode: 'MPLADS-TG-001',
    title: 'CC Road Construction Ward 1',
    description: 'Cement concrete road laying with roadside drains',
    category: 'Roads & Bridges',
    state: 'Telangana',
    district: 'Hyderabad',
    latitude: 17.4411,
    longitude: 78.5015,
    estimatedCost: 2000000,
    sanctionedAmount: 2000000,
    fundsUtilized: 1000000,
    startDate: '2024-01-01',
    expectedCompletionDate: '2024-06-30',
    status: 'Completed',
    completionPercentage: 100,
    photos: [],
    documents: [],
    payments: [],
    timeline: [],
    riskAnalysis: {} as any
  },
  {
    id: 'PRJ-MOCK-02',
    projectCode: 'MPLADS-TG-002',
    title: 'Internal BT Road Ward 2',
    description: 'Blacktop road with storm water drains',
    category: 'Roads & Bridges',
    state: 'Telangana',
    district: 'Hyderabad',
    latitude: 17.4420,
    longitude: 78.5020,
    estimatedCost: 2200000,
    sanctionedAmount: 2200000,
    fundsUtilized: 1500000,
    startDate: '2024-02-01',
    expectedCompletionDate: '2024-07-31',
    status: 'Completed',
    completionPercentage: 100,
    photos: [],
    documents: [],
    payments: [],
    timeline: [],
    riskAnalysis: {} as any
  },
  {
    id: 'PRJ-MOCK-03',
    projectCode: 'MPLADS-TG-003',
    title: 'Approach Road Ward 3',
    description: 'Concrete approach road for rural connectivity',
    category: 'Roads & Bridges',
    state: 'Telangana',
    district: 'Hyderabad',
    latitude: 17.4430,
    longitude: 78.5030,
    estimatedCost: 2100000,
    sanctionedAmount: 2100000,
    fundsUtilized: 1200000,
    startDate: '2024-03-01',
    expectedCompletionDate: '2024-08-31',
    status: 'Completed',
    completionPercentage: 100,
    photos: [],
    documents: [],
    payments: [],
    timeline: [],
    riskAnalysis: {} as any
  }
] as unknown as Project[];

export async function runAnomalyTests() {
  console.log('\n================================================================');
  console.log('  AI ANOMALIES & INTEGRITY VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, assertion: boolean, details?: string) {
    total++;
    if (assertion) {
      passed++;
      console.log(`✓ PASS | ${name}`);
    } else {
      console.log(`✗ FAIL | ${name} — ${details || 'Assertion failed'}`);
    }
  }

  // 1. STATISTICAL COST BASELINE
  console.log('--- 1. Statistical Cost Baseline Testing ---');
  // Normal project around mean
  const normalRoad: Project = {
    ...mockRoadProjects[0],
    id: 'PRJ-TEST-NORMAL',
    sanctionedAmount: 2150000
  };
  const normalRes = evaluateCostAnomaly(normalRoad, mockRoadProjects, 2.0);
  test('Normal project within baseline is NOT flagged as anomaly', !normalRes.isAnomaly);
  test('Normal project attaches human-readable explanation', normalRes.explanation.includes('normal empirical distribution'));

  // Outlier project: ₹45 Lakh (well above mean ~₹21 Lakh)
  const outlierRoad: Project = {
    ...mockRoadProjects[0],
    id: 'PRJ-TEST-OUTLIER',
    sanctionedAmount: 4500000
  };
  const outlierRes = evaluateCostAnomaly(outlierRoad, mockRoadProjects, 2.0);
  test('Outlier project (>2 std dev) IS flagged as cost anomaly', outlierRes.isAnomaly);
  test('Outlier explanation specifies exact std devs above average', outlierRes.explanation.includes('std deviations above the average'));
  test('Outlier explanation specifies category AND state', outlierRes.explanation.includes('Roads & Bridges') && outlierRes.explanation.includes('Telangana'));
  test('Outlier response provides structured baseline object', Boolean(outlierRes.baseline && outlierRes.baseline.zScore > 2.0));

  // Boundary Case: Zero / Negative budget
  const negativeCost: Project = {
    ...mockRoadProjects[0],
    id: 'PRJ-TEST-NEG',
    sanctionedAmount: -5000
  };
  const negRes = evaluateCostAnomaly(negativeCost, mockRoadProjects);
  test('Negative/Zero cost is flagged as critical anomaly', negRes.isAnomaly && negRes.costScore > 90);

  // 2. PARTITIONED DUPLICATE DETECTION
  console.log('\n--- 2. Partitioned Duplicate Project Detection ---');
  // Candidate in same category and nearby (distance < 500m)
  const duplicateCandidate: Project = {
    ...mockRoadProjects[0],
    id: 'PRJ-DUP-01',
    title: 'CC Road Construction Ward 1 Extension',
    description: 'Cement concrete road laying with roadside drains in Ward 1',
    latitude: 17.4415,
    longitude: 78.5018
  };
  const dupList = findDuplicateCandidates(duplicateCandidate, mockRoadProjects);
  test('Local duplicate within 25km and same category is detected', dupList.length > 0);
  test('Duplicate match includes sector partition factor', dupList[0].matchingFactors.some(f => f.includes('Sector Partition')));

  // Candidate in different state should NOT be compared
  const differentStateProject: Project = {
    ...mockRoadProjects[0],
    id: 'PRJ-DIFF-STATE',
    state: 'Maharashtra',
    district: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567
  };
  const diffList = findDuplicateCandidates(differentStateProject, mockRoadProjects);
  test('Records in different states (>25km) are partitioned out', diffList.length === 0);

  // 3. DELAY PREDICTION & HOLDOUT VALIDATION
  console.log('\n--- 3. Delay Prediction Model & Holdout Validation ---');
  const delayedProject: Project = {
    ...mockRoadProjects[0],
    id: 'PRJ-DELAYED',
    status: 'Ongoing',
    completionPercentage: 25,
    startDate: '2024-01-01',
    expectedCompletionDate: '2024-04-01' // Past expected date with low completion
  };
  const delayRes = calculateDelayPrediction(delayedProject);
  test('Delay prediction computes delay probability > 70% for overdue project', delayRes.delayProbability > 70);
  test('Delay prediction attaches confidence interval string', delayRes.confidenceIntervalString.includes('confidence, ±'));
  test('Delay prediction includes statutory model training disclaimer', delayRes.modelTrainingStatus.includes('Model trained on synthetic data'));

  const holdout = evaluateDelayModelOnHoldout(mockRoadProjects);
  test('Holdout validation computes precision, recall, F1, and accuracy', holdout.precision > 0 && holdout.recall > 0 && holdout.f1Score > 0);
  test('Holdout validation documents train/holdout split ratio', holdout.datasetSplit.includes('Holdout Validation'));

  // 4. GPS LOCATION VERIFICATION
  console.log('\n--- 4. GPS EXIF Telemetry Verification ---');
  // Match within 500m
  const validGps = verifyLocationCoordinates(17.4411, 78.5015, 17.4415, 78.5018, 500);
  test('Photo within 500m is marked VERIFIED', validGps.verified && validGps.status === 'VERIFIED');

  // Mismatch > 500m
  const mismatchGps = verifyLocationCoordinates(17.4411, 78.5015, 17.5142, 78.4320, 500);
  test('Photo > 500m away is marked LOCATION_MISMATCH with exact distance', mismatchGps.isMismatch && mismatchGps.distanceMeters > 500);
  test('Mismatch message specifies exact coordinate delta', mismatchGps.message.includes('threshold: 500m'));

  // Null Island 0,0 spoofing
  const nullIsland = verifyLocationCoordinates(17.4411, 78.5015, 0, 0, 500);
  test('Null Island (0,0) coordinates flagged as UNVERIFIABLE spoofing', nullIsland.status === 'UNVERIFIABLE');

  // Missing EXIF
  const missingExif = verifyLocationCoordinates(17.4411, 78.5015, undefined, undefined, 500);
  test('Missing EXIF telemetry flagged as UNVERIFIABLE', missingExif.status === 'UNVERIFIABLE');

  // 5. PHOTO AUTHENTICITY & PERCEPTUAL HASHING
  console.log('\n--- 5. Photo Authenticity & Perceptual Hashing ---');
  const reusedPhoto = verifyPhotoAuthenticity(
    'https://example.com/photo.jpg',
    'RO Plant Machinery Assembly',
    'during',
    '2022-10-10T00:00:00Z',
    '2024-04-10'
  );
  test('Recycled archive image triggers perceptual similarity alert', reusedPhoto.similarityAlert);
  test('Perceptual duplicate provides matched project code & Hamming distance', Boolean(reusedPhoto.duplicateMatchDetails && reusedPhoto.duplicateMatchDetails.hammingDistance <= 5));
  test('EXIF timestamp sanity check detects photo predating project sanction', Boolean(reusedPhoto.timestampIssue));

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL: ${passed}/${total} Anomaly & Integrity tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('----------------------------------------------------------------\n');

  if (passed < total) {
    throw new Error(`${total - passed} tests failed!`);
  }
}

if (process.argv[1]?.includes('anomalies.test')) {
  runAnomalyTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
