/**
 * AUTOMATED STATUTORY RBAC VERIFICATION TEST SUITE
 * Mandated under MoSPI MPLADS Security & Governance Framework
 *
 * Verifies that unauthorized roles are strictly blocked on the SERVER for every mutating action:
 * - Citizen (PUBLIC) cannot disburse funds, recommend, approve, or upload progress
 * - MP cannot approve own recommendation, sanction funds, or assign contractors
 * - Implementing Agency (Contractor) cannot approve/sanction projects, disburse funds, or dismiss risk flags
 * - District Authority (ADMIN) can sanction, approve, assign contractor, and disburse
 */

import express from 'express';
import { apiRouter } from '../server/routes.js';
import { generateToken, authenticateToken } from '../server/auth.js';
import { User } from '../src/types/index.js';

interface TestResult {
  name: string;
  passed: boolean;
  statusExpected: number;
  statusActual: number;
  errorMessage?: string;
}

const results: TestResult[] = [];

// Setup test express application with authenticateToken middleware
const app = express();
app.use(express.json());
app.use(authenticateToken);
app.use('/api', apiRouter);

// Test Identities
const adminUser: User = {
  id: 'u_admin',
  userId: 'ADMIN001',
  name: 'District Collector Hyderabad',
  role: 'ADMIN',
  designation: 'District Authority',
  district: 'Hyderabad'
};

const mpUser: User = {
  id: 'u_mp',
  userId: 'MP001',
  name: 'Shri Rajesh Kumar MP',
  role: 'MP',
  designation: 'Member of Parliament',
  constituency: 'Hyderabad North'
};

const agencyUser: User = {
  id: 'u_agency',
  userId: 'AGENCY001',
  name: 'TSUDA Executive Engineer',
  role: 'AGENCY',
  designation: 'Implementing Officer',
  agencyId: 'AGENCY001'
};

const citizenUser: User = {
  id: 'u_citizen',
  userId: 'CITIZEN001',
  name: 'Ramesh Patel',
  role: 'PUBLIC',
  designation: 'Citizen Resident'
};

const adminToken = generateToken(adminUser);
const mpToken = generateToken(mpUser);
const agencyToken = generateToken(agencyUser);
const citizenToken = generateToken(citizenUser);

// Helper for simulated requests
async function makeRequest(
  method: 'GET' | 'POST',
  path: string,
  token?: string,
  body?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve) => {
    // Construct mock request and response
    const req: any = {
      method,
      url: `/api${path}`,
      headers: {
        'content-type': 'application/json'
      },
      body: body || {},
      query: {},
      params: {}
    };

    if (token) {
      req.headers['authorization'] = `Bearer ${token}`;
    }

    let statusCode = 200;
    let responseBody: any = null;

    const res: any = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      json(data: any) {
        responseBody = data;
        resolve({ status: statusCode, body: responseBody });
        return res;
      },
      send(data: any) {
        responseBody = data;
        resolve({ status: statusCode, body: responseBody });
        return res;
      },
      setHeader() { return res; },
      end() {
        resolve({ status: statusCode, body: responseBody });
      }
    };

    (app as any).handle(req, res, () => {
      resolve({ status: 404, body: { error: 'Route not found' } });
    });
  });
}

function assertTest(name: string, actual: number, expected: number | number[], body: any) {
  const allowedExpected = Array.isArray(expected) ? expected : [expected];
  const passed = allowedExpected.includes(actual);
  results.push({
    name,
    passed,
    statusExpected: Array.isArray(expected) ? expected[0] : expected,
    statusActual: actual,
    errorMessage: passed ? undefined : JSON.stringify(body)
  });
}

export async function runRbacTests() {
  console.log('\n================================================================');
  console.log('  STATUTORY MPLADS RBAC SERVER-SIDE ENFORCEMENT VERIFICATION');
  console.log('================================================================\n');

  // 1. Citizen Access Tests
  console.log('Group 1: Citizen (Unauthenticated / Public Role) Boundary Enforcements');

  let res = await makeRequest('POST', '/projects/recommend', citizenToken, {
    title: 'Citizen Unauthorized Road',
    category: 'Roads & Bridges',
    district: 'Hyderabad',
    locationAddress: 'Test Colony',
    estimatedCost: 2500000
  });
  assertTest('Citizen CANNOT recommend projects (401/403 blocked)', res.status, [401, 403], res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/status', citizenToken, {
    status: 'Sanctioned',
    sanctionedAmount: 2500000
  });
  assertTest('Citizen CANNOT sanction or approve projects (401/403 blocked)', res.status, [401, 403], res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/payments/disburse', citizenToken, {
    amount: 500000
  });
  assertTest('Citizen CANNOT disburse public funds (401/403 blocked)', res.status, [401, 403], res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/assign-agency', citizenToken, {
    agencyId: 'AGENCY001'
  });
  assertTest('Citizen CANNOT assign contractor / implementing agency (401/403 blocked)', res.status, [401, 403], res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/progress', citizenToken, {
    completionPercentage: 85
  });
  assertTest('Citizen CANNOT submit progress percentage or milestone updates (401/403 blocked)', res.status, [401, 403], res.body);

  res = await makeRequest('POST', '/alerts/ALT-001/action', citizenToken, {
    status: 'Dismissed'
  });
  assertTest('Citizen CANNOT dismiss or review AI risk flags (401/403 blocked)', res.status, [401, 403], res.body);

  // 2. MP Boundary Tests
  console.log('\nGroup 2: Member of Parliament (MP) Separation of Duties Enforcements');

  res = await makeRequest('POST', '/projects/PRJ-2024-001/status', mpToken, {
    status: 'Sanctioned',
    sanctionedAmount: 2500000
  });
  assertTest('MP CANNOT approve own or any project recommendation (403 Forbidden)', res.status, 403, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/payments/disburse', mpToken, {
    amount: 500000
  });
  assertTest('MP CANNOT disburse public treasury funds (403 Forbidden)', res.status, 403, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/assign-agency', mpToken, {
    agencyId: 'AGENCY001'
  });
  assertTest('MP CANNOT assign contractor / tender award (403 Forbidden)', res.status, 403, res.body);

  res = await makeRequest('POST', '/alerts/ALT-001/action', mpToken, {
    status: 'Dismissed'
  });
  assertTest('MP CANNOT dismiss audit risk flags (403 Forbidden)', res.status, 403, res.body);

  // 3. Implementing Agency (Contractor) Boundary Tests
  console.log('\nGroup 3: Implementing Agency / Contractor Boundary Enforcements');

  res = await makeRequest('POST', '/projects/PRJ-2024-001/status', agencyToken, {
    status: 'Sanctioned'
  });
  assertTest('Contractor CANNOT sanction or modify project administrative status (403 Forbidden)', res.status, 403, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/payments/disburse', agencyToken, {
    amount: 500000
  });
  assertTest('Contractor CANNOT disburse public funds directly (403 Forbidden)', res.status, 403, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/payments', agencyToken, {
    amount: 500000,
    action: 'DISBURSE'
  });
  assertTest('Contractor CANNOT trigger DISBURSE action on payment endpoint (403 Forbidden)', res.status, 403, res.body);

  res = await makeRequest('POST', '/alerts/ALT-001/action', agencyToken, {
    status: 'Dismissed'
  });
  assertTest('Contractor CANNOT dismiss vigilance anomaly alerts (403 Forbidden)', res.status, 403, res.body);

  // 4. Authorized Action Tests
  console.log('\nGroup 4: Authorized Statutory Actions (Positive Verification)');

  res = await makeRequest('POST', '/projects/recommend', mpToken, {
    title: 'Sanctioned Community Health Sub-centre',
    category: 'Healthcare',
    district: 'Hyderabad',
    locationAddress: 'Ward 4, Secunderabad',
    estimatedCost: 1800000
  });
  assertTest('MP CAN recommend legitimate developmental project (200/201 OK)', res.status, [200, 201], res.body);

  res = await makeRequest('POST', '/citizen-feedback', undefined, {
    projectId: 'PRJ-2024-001',
    citizenName: 'Anonymous Resident',
    issueType: 'Quality of Work',
    description: 'Road surface leveling is uneven near water pipeline junction.'
  });
  assertTest('Citizen CAN submit grievance and feedback without credentials (200/201 OK)', res.status, [200, 201], res.body);

  res = await makeRequest('GET', '/projects', undefined);
  assertTest('Citizen CAN view public project register (200 OK)', res.status, 200, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/status', adminToken, {
    status: 'Sanctioned',
    sanctionedAmount: 50000000,
    remarks: 'Approved after technical scrutiny'
  });
  assertTest('District Authority CAN sanction and update project status (200 OK)', res.status, 200, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/payments/disburse', adminToken, {
    amount: 600000,
    sanctionOrderNo: 'SAN/DISBURSE/2025/001'
  });
  assertTest('District Authority CAN disburse sanctioned funds (200 OK)', res.status, 200, res.body);

  // Print Summary Table
  let passedCount = 0;
  console.log('\n----------------------------------------------------------------');
  console.log('RBAC TEST RESULTS TABLE:');
  console.log('----------------------------------------------------------------');
  for (const r of results) {
    const symbol = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${symbol.padEnd(8)} | ${r.name.padEnd(65)} | HTTP ${r.statusActual} (expected ${r.statusExpected})`);
    if (r.passed) passedCount++;
  }
  console.log('----------------------------------------------------------------');
  console.log(`TOTAL: ${passedCount}/${results.length} tests passed (${Math.round((passedCount / results.length) * 100)}% compliance)`);

  if (passedCount < results.length) {
    throw new Error(`${results.length - passedCount} RBAC tests failed!`);
  }
  return results;
}

if (process.argv[1]?.includes('rbac.test')) {
  runRbacTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
