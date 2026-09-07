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

const app = express();
app.use(express.json());
app.use(authenticateToken);
app.use('/api', apiRouter);

const ministryUser: User = {
  id: 'u_min',
  userId: 'MINISTRY001',
  name: 'MoSPI Joint Secretary',
  role: 'MINISTRY',
  designation: 'Central Ministry Officer',
  district: 'New Delhi'
};

const stateNodalUser: User = {
  id: 'u_state',
  userId: 'STATE001',
  name: 'Telangana Principal Secretary',
  role: 'STATE_NODAL',
  designation: 'State Nodal Officer',
  state: 'Telangana'
};

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

const ministryToken = generateToken(ministryUser);
const stateNodalToken = generateToken(stateNodalUser);
const adminToken = generateToken(adminUser);
const mpToken = generateToken(mpUser);
const agencyToken = generateToken(agencyUser);
const citizenToken = generateToken(citizenUser);

async function makeRequest(
  method: 'GET' | 'POST',
  path: string,
  token?: string,
  body?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve) => {
    const req: any = {
      method,
      url: `/api${path}`,
      headers: { 'content-type': 'application/json' },
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
  console.log('  STATUTORY MPLADS RBAC & MULTI-AUTHORITY ENFORCEMENT SUITE');
  console.log('================================================================\n');

  // 1. Citizen Access Enforcements
  console.log('Group 1: Citizen (Public Role) Boundary Enforcements');
  let res = await makeRequest('POST', '/projects/recommend', citizenToken, {
    title: 'Citizen Unauthorized Road',
    category: 'Roads, Bridges & Pathways',
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

  // 2. MP Separation of Duties
  console.log('\nGroup 2: Member of Parliament (MP) Separation of Duties');
  res = await makeRequest('POST', '/projects/PRJ-2024-001/status', mpToken, {
    status: 'Sanctioned',
    sanctionedAmount: 2500000
  });
  assertTest('MP CANNOT approve own or any project recommendation (403 Forbidden)', res.status, 403, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/payments/disburse', mpToken, {
    amount: 500000
  });
  assertTest('MP CANNOT disburse public treasury funds (403 Forbidden)', res.status, 403, res.body);

  res = await makeRequest('POST', '/alerts/ALT-101/action', mpToken, {
    status: 'False Positive'
  });
  assertTest('MP CANNOT dismiss vigilance risk flags (403 Forbidden)', res.status, 403, res.body);

  // 3. Implementing Agency Separation of Duties
  console.log('\nGroup 3: Implementing Agency Boundary Enforcements');
  res = await makeRequest('POST', '/projects/PRJ-2024-001/status', agencyToken, {
    status: 'Sanctioned'
  });
  assertTest('Agency CANNOT sanction projects (403 Forbidden)', res.status, 403, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/payments/disburse', agencyToken, {
    amount: 500000
  });
  assertTest('Agency CANNOT disburse public funds directly (403 Forbidden)', res.status, 403, res.body);

  // 4. Multi-Authority Approval Chain Enforcements
  console.log('\nGroup 4: Multi-Authority Approval State Machine Enforcements');
  res = await makeRequest('POST', '/projects/PRJ-2024-001/transition', mpToken, {
    targetStatus: 'State Approved'
  });
  assertTest('MP CANNOT accord State or Ministry approval (403 Forbidden)', res.status, 403, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/transition', adminToken, {
    targetStatus: 'Forwarded To State',
    statutoryRemarks: 'Project exceeds ₹50L regional threshold; forwarded to State Nodal'
  });
  assertTest('District Authority CAN forward high-value works to State (200 OK)', res.status, 200, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/transition', stateNodalToken, {
    targetStatus: 'State Approved',
    statutoryRemarks: 'State technical committee clearance granted'
  });
  assertTest('State Nodal Authority CAN grant State administrative clearance (200 OK)', res.status, 200, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/transition', stateNodalToken, {
    targetStatus: 'Forwarded To Ministry',
    statutoryRemarks: 'Inter-state mega scheme forwarded to Central Ministry'
  });
  assertTest('State Nodal Authority CAN forward works to Central Ministry (200 OK)', res.status, 200, res.body);

  res = await makeRequest('POST', '/projects/PRJ-2024-001/transition', ministryToken, {
    targetStatus: 'Ministry Approved',
    statutoryRemarks: 'Central MoSPI approval recorded under national allocation'
  });
  assertTest('Central Ministry CAN grant final Ministry approval (200 OK)', res.status, 200, res.body);

  // 5. Positive Statutory Authorizations
  console.log('\nGroup 5: Positive Statutory Verifications');
  res = await makeRequest('POST', '/projects/recommend', mpToken, {
    title: 'Sanctioned Community Health Sub-centre',
    category: 'Healthcare & Wellness',
    district: 'Hyderabad',
    locationAddress: 'Ward 4, Secunderabad',
    estimatedCost: 1800000
  });
  assertTest('MP CAN recommend legitimate developmental work (200/201 OK)', res.status, [200, 201], res.body);

  res = await makeRequest('POST', '/citizen-feedback', undefined, {
    projectId: 'PRJ-2024-001',
    citizenName: 'Anonymous Citizen',
    issueType: 'Incomplete Work',
    description: 'Road leveling uneven near municipal park.'
  });
  assertTest('Citizen CAN submit grievance without official credentials (200/201 OK)', res.status, [200, 201], res.body);

  res = await makeRequest('GET', '/projects', undefined);
  assertTest('Citizen CAN view public project register (200 OK)', res.status, 200, res.body);

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
