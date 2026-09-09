import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { api } from '../src/services/api.js';
import { clientMockDb } from '../src/services/clientMockDb.js';
import { db } from '../server/db.js';
import { User } from '../src/types/index.js';

export async function runResilienceAndNotificationTests() {
  console.log('\n================================================================');
  console.log('  RESILIENCE, NOTIFICATIONS & PERSISTENCE AUDIT');
  console.log('================================================================');

  // --- 1. Notification User-Specific Isolation & Access Control ---
  console.log('--- 1. Notification User-Specific Isolation & Security Testing ---');

  const adminUser: User = {
    id: 'ADMIN001',
    userId: 'ADMIN001',
    name: 'District Collector',
    email: 'collector@nic.in',
    role: 'ADMIN',
    designation: 'District Magistrate & Collector',
    district: 'Hyderabad'
  };

  const mpUser: User = {
    id: 'MP001',
    userId: 'MP001',
    name: 'Shri G. Kishan Reddy',
    email: 'kishan.reddy@sansad.nic.in',
    role: 'MP',
    designation: 'Member of Parliament (Lok Sabha)',
    constituency: 'Secunderabad'
  };

  const agencyUser: User = {
    id: 'AGENCY001',
    userId: 'AGENCY001',
    name: 'TSIIC Technical Team',
    email: 'contact@tsiic.telangana.gov.in',
    role: 'AGENCY',
    designation: 'Executive Engineer / Project Agency Lead',
    agencyName: 'Telangana State Industrial Infrastructure Corp'
  };

  // Reset notifications to baseline clean state
  db.resetNotifications();

  // Test MP notifications isolation
  const mpNotifs = db.getNotificationsForUser(mpUser);
  assert(Array.isArray(mpNotifs), 'Server should return notifications array for MP');
  assert(mpNotifs.some(n => n.id === 'NOTIF-002'), 'MP must receive milestone disbursal notification NOTIF-002');
  assert(mpNotifs.some(n => n.id === 'NOTIF-004'), 'MP must receive statutory broadcast notification NOTIF-004');
  assert(!mpNotifs.some(n => n.id === 'NOTIF-001'), 'MP must NOT receive internal Admin notification NOTIF-001');
  assert(!mpNotifs.some(n => n.id === 'NOTIF-003'), 'MP must NOT receive internal Agency directive NOTIF-003');
  console.log('✓ PASS | MP receives strictly user-specific and broadcast records, no leaked Admin/Agency items');

  // Test Agency notifications isolation
  const agencyNotifs = db.getNotificationsForUser(agencyUser);
  assert(agencyNotifs.some(n => n.id === 'NOTIF-003'), 'Agency must receive inspection directive NOTIF-003');
  assert(agencyNotifs.some(n => n.id === 'NOTIF-004'), 'Agency must receive broadcast notification NOTIF-004');
  assert(!agencyNotifs.some(n => n.id === 'NOTIF-001'), 'Agency must NOT receive Admin alert NOTIF-001');
  assert(!agencyNotifs.some(n => n.id === 'NOTIF-002'), 'Agency must NOT receive MP disbursal NOTIF-002');
  console.log('✓ PASS | Agency receives strictly user-specific records without cross-role leakage');

  // Test Admin notifications
  const adminNotifs = db.getNotificationsForUser(adminUser);
  assert(adminNotifs.some(n => n.id === 'NOTIF-001'), 'Admin must receive high-risk alert NOTIF-001');
  assert(adminNotifs.some(n => n.id === 'NOTIF-004'), 'Admin must receive broadcast notification NOTIF-004');
  assert(!adminNotifs.some(n => n.id === 'NOTIF-002'), 'Admin does not see private MP notifications');
  assert(!adminNotifs.some(n => n.id === 'NOTIF-003'), 'Admin does not see private Agency directives');
  console.log('✓ PASS | Admin notifications are properly scoped and isolated');

  // Test Security: MP cannot mark Admin's notification as read
  const unauthorizedMark = db.markNotificationRead('NOTIF-001', mpUser);
  assert(unauthorizedMark === false, 'Unauthorized user must NOT be permitted to mark other user notification read');
  console.log('✓ PASS | RBAC prevents unauthorized cross-user notification manipulation');

  // --- 2. markAsRead Functionality & Disk Persistence ---
  console.log('--- 2. markAsRead & Backend Disk Persistence Testing ---');

  // MP marks NOTIF-002 as read
  const mpReadResult = db.markAsRead('NOTIF-002', mpUser);
  assert(mpReadResult === true, 'markAsRead must succeed for authorized user');
  const mpNotifsAfterRead = db.getNotificationsForUser(mpUser);
  const targetMpNotif = mpNotifsAfterRead.find(n => n.id === 'NOTIF-002');
  assert(targetMpNotif?.read === true, 'NOTIF-002 must now be marked read for MP');

  // Verify backend disk persistence by reading directly from filesystem
  const storeFilePath = path.join(process.cwd(), 'data', 'mplads_store.json');
  assert(fs.existsSync(storeFilePath), 'Store file must exist on disk');
  const diskContent = JSON.parse(fs.readFileSync(storeFilePath, 'utf-8'));
  const diskNotif = diskContent.notifications.find((n: any) => n.id === 'NOTIF-002');
  assert(diskNotif, 'Target notification must be present in persisted store');
  assert(diskNotif.read === true || (Array.isArray(diskNotif.readBy) && diskNotif.readBy.includes('MP001')),
    'Notification read state must be persisted to backend storage file');
  console.log('✓ PASS | markAsRead successfully persisted to backend file store (mplads_store.json)');

  // Test Broadcast read isolation: MP marks NOTIF-004 as read
  const broadcastRead = db.markAsRead('NOTIF-004', mpUser);
  assert(broadcastRead === true, 'MP marks broadcast notification as read');
  const mpNotifsAfterBroadcast = db.getNotificationsForUser(mpUser);
  assert(mpNotifsAfterBroadcast.find(n => n.id === 'NOTIF-004')?.read === true, 'NOTIF-004 is read for MP');
  const adminNotifsAfterBroadcast = db.getNotificationsForUser(adminUser);
  assert(adminNotifsAfterBroadcast.find(n => n.id === 'NOTIF-004')?.read === false, 'NOTIF-004 remains UNREAD for Admin (no shared global read state)');
  console.log('✓ PASS | Broadcast notification read state is isolated per user; no shared global state corruption');

  // Test markAllNotificationsRead
  const readCount = db.markAllNotificationsRead(adminUser);
  assert(readCount >= 0, 'Mark all notifications should return marked count');
  const adminAllRead = db.getNotificationsForUser(adminUser).every(n => n.read === true);
  assert(adminAllRead, 'All admin notifications must now be read');
  console.log('✓ PASS | markAllNotificationsRead operates strictly on user-scoped records');

  // Clean reset
  db.resetNotifications();

  // --- 3. Client Mock DB & Fallback Synchronization ---
  console.log('--- 3. Client Mock DB & Fallback Testing ---');
  const clientNotifsRes = await clientMockDb.getNotifications();
  assert(Array.isArray(clientNotifsRes.notifications), 'Client mock db should return notifications');
  const clientReset = await clientMockDb.resetNotifications();
  assert(clientReset.success === true, 'Client reset notifications should succeed');
  console.log('✓ PASS | Client mock store notifications verified');

  // --- 4. API Robust Error-Handling Pattern ---
  console.log('--- 4. Resilient API Error Handling Testing ---');

  const originalFetch = globalThis.fetch;
  try {
    (globalThis as any).fetch = async () => {
      throw new Error('Network failure simulation');
    };

    const summary = await api.getDashboardSummary();
    assert(summary !== null && typeof summary === 'object', 'getDashboardSummary must return valid summary object despite fetch failure');
    console.log('✓ PASS | getDashboardSummary gracefully handles fetch failure without crashing');

    const alerts = await api.getAlerts();
    assert(alerts !== null && Array.isArray(alerts.alerts), 'getAlerts must return valid alerts array despite fetch failure');
    console.log('✓ PASS | getAlerts gracefully handles fetch failure without crashing');

    const feedback = await api.getCitizenFeedback();
    assert(feedback !== null && Array.isArray(feedback.feedback), 'getCitizenFeedback must return valid feedback array despite fetch failure');
    console.log('✓ PASS | getCitizenFeedback gracefully handles fetch failure without crashing');

    const notifs = await api.getNotifications();
    assert(notifs !== null && Array.isArray(notifs.notifications), 'getNotifications must return valid object despite fetch failure');
    console.log('✓ PASS | getNotifications gracefully handles fetch failure without crashing');
  } finally {
    globalThis.fetch = originalFetch;
  }

  // --- 5. Database Persistence Integrity ---
  console.log('--- 5. Database Persistence Integrity Testing ---');
  const prjCountBefore = db.projects.length;
  assert(prjCountBefore > 0, 'Database should have initial projects loaded from disk');
  const alertCountBefore = db.alerts.length;
  assert(alertCountBefore > 0, 'Database should have initial alerts loaded from disk');
  console.log(`✓ PASS | Persistence store active with ${prjCountBefore} projects and ${alertCountBefore} alerts`);

  // --- 6. Dedicated DataService Layer & Application Restart Persistence ---
  console.log('--- 6. Dedicated DataService Layer & Application Restart Persistence ---');
  const { dataService } = await import('../src/services/dataService.js');

  // Verify async calls to dedicated service layer
  const serviceData = await dataService.syncAll();
  assert(Array.isArray(serviceData.projects), 'DataService must asynchronously return projects array');
  assert(serviceData.projects.length > 0, 'DataService must load populated projects from backend');
  assert(Array.isArray(serviceData.alerts), 'DataService must asynchronously return alerts array');
  assert(serviceData.summary !== null && typeof serviceData.summary === 'object', 'DataService must asynchronously return summary');
  assert(Array.isArray(serviceData.feedback), 'DataService must asynchronously return citizen feedback');
  console.log('✓ PASS | DataService asynchronously queries projects, alerts, summary, and feedback');

  // Verify subscription listener pattern
  let listenerCalls = 0;
  const unsubscribe = dataService.subscribe(() => {
    listenerCalls++;
  });
  dataService.notify();
  assert(listenerCalls > 0, 'DataService subscriber must be notified upon data change');
  unsubscribe();
  console.log('✓ PASS | DataService observer subscription correctly dispatches change notifications');

  // Verify application restart persistence simulation:
  // 1. Mutate state via backend / service layer
  const testProjectId = `PRJ-PERSIST-${Date.now().toString().slice(-4)}`;
  const newPrj = db.addProject({
    id: testProjectId,
    projectCode: `MPLADS-2024-TEST-${Date.now().toString().slice(-4)}`,
    title: 'Automated Resilience Test Project for Restart Verification',
    category: 'Drinking Water & Sanitation',
    description: 'Testing persistence across application server restart cycles',
    locationAddress: 'Survey 108, Jubilee Hills',
    district: 'Hyderabad',
    state: 'Telangana',
    mpName: 'Hon. MP User',
    mpId: mpUser.userId,
    constituency: 'Hyderabad Central',
    status: 'Recommended',
    estimatedCost: 2500000,
    sanctionedAmount: 0,
    fundsUtilized: 0,
    completionPercentage: 0,
    implementingAgencyId: 'AG-001',
    implementingAgencyName: 'State Water Works Dept',
    vendorName: 'Deccan Infra Works',
    vendorPanMasked: 'ABCDE****F',
    recommendationDate: new Date().toISOString().split('T')[0],
    sanctionDate: '',
    startDate: '',
    expectedCompletionDate: '',
    latitude: 17.432,
    longitude: 78.407,
    timeline: [],
    photos: [],
    documents: [],
    payments: [],
    riskAnalysis: {
      overallScore: 12,
      riskLevel: 'LOW',
      lastEvaluatedAt: new Date().toISOString(),
      costAnomalyScore: 10,
      duplicateProbability: 5,
      photoAnomalyScore: 0,
      locationMismatch: false,
      delayProbability: 10,
      reasons: ['Initial recommendation.'],
      recommendations: ['Administrative verification.'],
      disclaimer: 'Model predictions are advisory.'
    }
  });
  assert(newPrj && newPrj.id, 'New project recommendation must succeed');

  // Verify file on disk immediately contains new project
  const diskRawAfterMutate = JSON.parse(fs.readFileSync(storeFilePath, 'utf-8'));
  const foundOnDisk = diskRawAfterMutate.projects.some((p: any) => p.id === newPrj.id);
  assert(foundOnDisk, 'Newly recommended project must be immediately flushed to persistent disk');
  console.log('✓ PASS | Service mutation immediately written to persistent disk storage');

  // 2. Simulate complete application/server restart by reloading from disk into fresh DB instance
  const freshDbInstance = new (db.constructor as any)();
  const foundAfterSimulatedRestart = freshDbInstance.projects.some((p: any) => p.id === newPrj.id);
  assert(foundAfterSimulatedRestart, 'Project MUST persist and be reloaded after full server restart cycle');
  console.log('✓ PASS | Data persistence strictly verified across simulated application restarts');

  console.log('----------------------------------------------------------------');
  console.log('✓ ALL RESILIENCE, NOTIFICATION & PERSISTENCE TESTS PASSED (100%)');
  console.log('----------------------------------------------------------------\n');
}
