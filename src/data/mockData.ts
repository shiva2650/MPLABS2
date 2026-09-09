import { Project, RiskAlert, CitizenFeedback, AuditLogEntry, User } from '../types/index.js';

// Universal pure TypeScript/JavaScript SHA-256 implementation (browser & Node.js compatible)
export function sha256Hex(str: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0, j = 0;
  let result = '';
  const words: number[] = [];
  const ascii = unescape(encodeURIComponent(str));
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let s = ascii + '\x80';
  while ((s[lengthProperty] % 64) - 56) s += '\x00';
  for (i = 0; i < s[lengthProperty]; i++) {
    j = s.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

// Pre-seeded Users with Salted PBKDF2 Hashes
export const users: (User & { passwordHash: string; salt?: string })[] = [
  {
    id: 'user_super_01',
    userId: 'SUPER001',
    passwordHash: 'a2a275fc3d09ad84554c955941c88926288330cae40df52cbc33a0ebf0a15706',
    salt: '6e8866d8d33e70bab265d7f320dbd50a',
    name: 'MoSPI Central Vigilance Directorate',
    role: 'SUPER_ADMIN',
    designation: 'Central Vigilance Director General',
    district: 'New Delhi',
    email: 'vigilance.dg@mospi.gov.in',
    phone: '+91 011 2338 1234'
  },
  {
    id: 'user_pm_01',
    userId: 'PM001',
    passwordHash: 'bb7caca81a10026ebe2e14329e20fcb3108ae6a76e808aab3db972c83f31ec7c',
    salt: '07ea0eddb60c222147ed857928385bb4',
    name: 'Er. S. Venkat Reddy',
    role: 'PROJECT_MANAGER',
    designation: 'Project Manager & Executive Engineer',
    agencyId: 'AGENCY001',
    agencyName: 'TSUDA - Hyderabad Zone',
    district: 'Hyderabad',
    email: 'pm.tsuda@telangana.gov.in',
    phone: '+91 94400 11223'
  },
  {
    id: 'user_viewer_01',
    userId: 'VIEWER001',
    passwordHash: '38333d88fe81585e575ce066fe95ae7dd12dc440f1978c56b7554daf28c096a7',
    salt: '829726ff721757a644f1182bc45d14f3',
    name: 'Citizen Transparency Auditor',
    role: 'VIEWER',
    designation: 'Public Open Data Auditor',
    district: 'Hyderabad',
    email: 'transparency.auditor@citizen.org.in',
    phone: '+91 98480 99887'
  },
  {
    id: 'user_mp_01',
    userId: 'MP001',
    passwordHash: 'bcbcdfcc1bc03b2ea6a6799d5d8df1bd7c688577d23218c8ccc4047cede34947',
    salt: 'c59df90a094fb00fa327072687568c32',
    name: 'Shri Rajesh Kumar',
    role: 'MP',
    designation: 'Member of Parliament (Lok Sabha)',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    email: 'rajesh.kumar.mp@sansad.nic.in',
    phone: '+91 98490 12345'
  },
  {
    id: 'user_mp_02',
    userId: 'MP002',
    passwordHash: 'd27f647a95a3eff628ae4361d65f9283d97dedccfb29beee7414b11619e95437',
    salt: '1cf2e4f4bdb24a348a134aa9b8c0178b',
    name: 'Smt. Kavitha Rao',
    role: 'MP',
    designation: 'Member of Parliament (Lok Sabha)',
    constituency: 'Secunderabad',
    district: 'Hyderabad',
    email: 'kavitha.rao.mp@sansad.nic.in',
    phone: '+91 98490 67890'
  },
  {
    id: 'user_admin_01',
    userId: 'ADMIN001',
    passwordHash: 'e5093086debd160df00c2d45e6828a89789a653bff6987983685689cd3e1f26c',
    salt: 'a316ce6e645ec0732d6d780f10647475',
    name: 'Dr. Ananya Sharma, IAS',
    role: 'ADMIN',
    designation: 'District Magistrate & District Authority',
    district: 'Hyderabad',
    email: 'dm.hyderabad@telangana.gov.in',
    phone: '+91 94400 54321'
  },
  {
    id: 'user_agency_01',
    userId: 'AGENCY001',
    passwordHash: '4494718916bd38b3bc235284ee0229779c83be2ec46562a84761d593c433ddbb',
    salt: '2f7e6a831f89a90dd94459d40e13e7b1',
    name: 'Telangana State Urban Development Authority (TSUDA)',
    role: 'AGENCY',
    designation: 'Executive Engineer (Civil Division-I)',
    agencyId: 'AGENCY001',
    agencyName: 'TSUDA - Hyderabad Zone',
    district: 'Hyderabad',
    email: 'ee1.tsuda@telangana.gov.in',
    phone: '+91 040 2345 6789'
  },
  {
    id: 'user_agency_02',
    userId: 'AGENCY002',
    passwordHash: '182e478a43503ea43eec0e8473f9ead110b2ccb19b622edce30555a42490b549',
    salt: '5b1cd2e4bdfbd4b8d6ef61723988d3d4',
    name: 'Panchayat Raj Engineering Department (PRED)',
    role: 'AGENCY',
    designation: 'Superintending Engineer',
    agencyId: 'AGENCY002',
    agencyName: 'PRED Secunderabad',
    district: 'Hyderabad',
    email: 'se.pred@telangana.gov.in',
    phone: '+91 040 2345 9900'
  }
];

// Pre-seeded 20+ Realistic MPLADS Projects
export const initialProjects: Project[] = [
  {
    id: 'PRJ-2024-001',
    projectCode: 'MPLADS-HYD-2024-001',
    title: 'Construction of Multipurpose Community Hall at Amberpet',
    description: 'Construction of modern G+1 community hall with solar backup, sanitation block, and public utility space for local ward residents.',
    category: 'Community Infrastructure',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Ward No. 14, Near Zilla Parishad School, Amberpet, Hyderabad',
    latitude: 17.3984,
    longitude: 78.5202,
    estimatedCost: 4800000, // 48 Lakh (ANOMALY: Standard benchmark is 18-25 Lakh)
    sanctionedAmount: 4800000,
    fundsUtilized: 2880000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Sri Sai Ram Infra Projects Ltd',
    vendorPanMasked: 'AABCS****K',
    recommendationDate: '2024-01-15',
    sanctionDate: '2024-02-10',
    startDate: '2024-03-01',
    expectedCompletionDate: '2024-11-30',
    status: 'Delayed',
    completionPercentage: 55,
    riskAnalysis: {
      overallScore: 82,
      riskLevel: 'HIGH',
      lastEvaluatedAt: '2025-02-28T10:30:00Z',
      costAnomalyScore: 88,
      duplicateProbability: 40,
      photoAnomalyScore: 15,
      locationMismatch: false,
      delayProbability: 84,
      reasons: [
        'Cost is significantly above similar category projects (₹48.0L vs benchmark ₹22.5L)',
        'Project is delayed beyond original scheduled completion date (11/2024)',
        'Vendor has unusual project concentration in District (42% of civil tenders)'
      ],
      recommendations: [
        'Conduct physical technical audit by District Vigilance Officer',
        'Verify itemized BOQ with state CPWD schedule of rates (SoR)',
        'Issue notice to implementing agency for milestone justification'
      ],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator generated for administrative review. It does not constitute proof of financial malpractice.'
    },
    photos: [
      {
        id: 'p1_1',
        stage: 'before',
        url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&auto=format&fit=crop&q=60',
        caption: 'Vacant plot survey prior to foundation excavation',
        uploadedAt: '2024-02-25',
        uploadedBy: 'AGENCY001',
        latitude: 17.3984,
        longitude: 78.5202,
        isAiVerified: true,
        aiVerificationNotes: 'Geotag matched within 4 meters. Site condition matches project proposal.'
      },
      {
        id: 'p1_2',
        stage: 'during',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=60',
        caption: 'First floor RCC slab shuttering and column casting',
        uploadedAt: '2024-09-12',
        uploadedBy: 'AGENCY001',
        latitude: 17.3983,
        longitude: 78.5201,
        isAiVerified: true,
        aiVerificationNotes: 'RCC progress consistent with 50-60% structural phase.'
      }
    ],
    documents: [
      {
        id: 'doc1_1',
        name: 'MP_Recommendation_Amberpet_Hall.pdf',
        type: 'Recommendation',
        fileSize: '1.4 MB',
        uploadedAt: '2024-01-16',
        uploadedBy: 'MP001',
        downloadUrl: '/docs/recommendation-001.pdf'
      },
      {
        id: 'doc1_2',
        name: 'District_Sanction_Order_HYD_48L.pdf',
        type: 'Sanction Order',
        fileSize: '2.8 MB',
        uploadedAt: '2024-02-10',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-001.pdf'
      }
    ],
    payments: [
      {
        id: 'pay1_1',
        installmentNo: 1,
        amount: 1440000,
        sanctionOrderNo: 'SAN/MPLADS/2024/091',
        paidAt: '2024-03-15',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone',
        remarks: 'Mobilization advance against bank guarantee'
      },
      {
        id: 'pay1_2',
        installmentNo: 2,
        amount: 1440000,
        sanctionOrderNo: 'SAN/MPLADS/2024/188',
        paidAt: '2024-08-04',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone',
        remarks: 'Foundation and plinth completion milestone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-01-15', remarks: 'Recommended by MP Shri Rajesh Kumar' },
      { stage: 'Feasibility Check', completed: true, date: '2024-01-28', remarks: 'Technical clearance by EE TSUDA' },
      { stage: 'Sanction', completed: true, date: '2024-02-10', remarks: 'Administrative sanction accorded by Collector' },
      { stage: 'Agency Assignment', completed: true, date: '2024-02-18', remarks: 'Entrusted to TSUDA' },
      { stage: 'Execution', completed: true, date: '2024-03-01', remarks: 'Civil construction initiated' },
      { stage: 'Payment', completed: false, remarks: 'Stage-II payment released. Milestone III pending' },
      { stage: 'Completion', completed: false, remarks: 'Delayed. Revised target requested.' }
    ]
  },
  {
    id: 'PRJ-2024-002',
    projectCode: 'MPLADS-HYD-2024-002',
    title: 'Community Welfare Center & Library at Amberpet Ward-12',
    description: 'Establishment of neighborhood community facility and student reading room near municipal park.',
    category: 'Community Infrastructure',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Lane 4, Beside Children Park, Amberpet, Hyderabad',
    latitude: 17.3992,
    longitude: 78.5235, // Distance to PRJ-2024-001 is only 430m!
    estimatedCost: 2100000,
    sanctionedAmount: 2100000,
    fundsUtilized: 400000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Bharat Construction Syndicate',
    vendorPanMasked: 'AACFB****M',
    recommendationDate: '2024-04-10',
    sanctionDate: '2024-05-15',
    startDate: '2024-06-01',
    expectedCompletionDate: '2025-03-31',
    status: 'Under Review',
    completionPercentage: 20,
    riskAnalysis: {
      overallScore: 78,
      riskLevel: 'HIGH',
      lastEvaluatedAt: '2025-02-27T14:15:00Z',
      costAnomalyScore: 18,
      duplicateProbability: 87, // High duplicate detection with PRJ-2024-001
      photoAnomalyScore: 10,
      locationMismatch: false,
      delayProbability: 35,
      reasons: [
        'High spatial and functional proximity to sanctioned Project PRJ-2024-001 (Distance: 430m)',
        'Similarity score: 87% based on category, description keywords, and catchment area',
        'Potential overlap in public asset utilization'
      ],
      recommendations: [
        'Administrative review required to verify whether two community halls in 500m radius are justified',
        'Site inspection by District Planning Officer to confirm distinct citizen catchment'
      ],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator generated for administrative review.'
    },
    photos: [
      {
        id: 'p2_1',
        stage: 'before',
        url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=60',
        caption: 'Site demarcation before boundary wall',
        uploadedAt: '2024-05-20',
        uploadedBy: 'AGENCY001',
        latitude: 17.3992,
        longitude: 78.5235,
        isAiVerified: true,
        aiVerificationNotes: 'GPS verified. Proximity alert triggered.'
      }
    ],
    documents: [
      {
        id: 'doc2_1',
        name: 'Feasibility_Report_Ward12.pdf',
        type: 'Recommendation',
        fileSize: '890 KB',
        uploadedAt: '2024-04-12',
        uploadedBy: 'MP001',
        downloadUrl: '/docs/recommendation-002.pdf'
      }
    ],
    payments: [
      {
        id: 'pay2_1',
        installmentNo: 1,
        amount: 400000,
        sanctionOrderNo: 'SAN/MPLADS/2024/115',
        paidAt: '2024-06-15',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-04-10' },
      { stage: 'Feasibility Check', completed: true, date: '2024-05-02' },
      { stage: 'Sanction', completed: true, date: '2024-05-15' },
      { stage: 'Agency Assignment', completed: true, date: '2024-05-25' },
      { stage: 'Execution', completed: false, remarks: 'Paused pending duplicate spatial review' },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-003',
    projectCode: 'MPLADS-HYD-2024-003',
    title: 'Installation of 50 Solar LED High-Mast Street Lights at Musheerabad',
    description: 'Providing energy-efficient standalone solar street lighting in economically weaker colonies and junction points in Musheerabad.',
    category: 'Renewable Energy',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Various Junctions, Bholakpur and Musheerabad Division, Hyderabad',
    latitude: 17.4167,
    longitude: 78.4982,
    estimatedCost: 3500000,
    sanctionedAmount: 3500000,
    fundsUtilized: 3500000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Surya Green Power Solutions Pvt Ltd',
    vendorPanMasked: 'AAGCS****P',
    recommendationDate: '2023-11-05',
    sanctionDate: '2023-12-18',
    startDate: '2024-01-10',
    expectedCompletionDate: '2024-06-30',
    actualCompletionDate: '2024-06-15',
    status: 'Completed',
    completionPercentage: 100,
    riskAnalysis: {
      overallScore: 14,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2024-06-20T09:00:00Z',
      costAnomalyScore: 12,
      duplicateProbability: 8,
      photoAnomalyScore: 5,
      locationMismatch: false,
      delayProbability: 10,
      reasons: [
        'All milestone deliverables completed within sanctioned cost schedule',
        'Physical verification successfully conducted with geotagged asset register'
      ],
      recommendations: ['Asset handed over to Municipal Corporation for routine maintenance'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p3_1',
        stage: 'before',
        url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=60',
        caption: 'Unlit street crossing before installation',
        uploadedAt: '2024-01-12',
        uploadedBy: 'AGENCY001',
        isAiVerified: true
      },
      {
        id: 'p3_2',
        stage: 'after',
        url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60',
        caption: 'Fully operational solar high-mast lighting pole with battery pack',
        uploadedAt: '2024-06-15',
        uploadedBy: 'AGENCY001',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc3_1',
        name: 'Completion_Certificate_Solar_HYD.pdf',
        type: 'Completion Certificate',
        fileSize: '1.8 MB',
        uploadedAt: '2024-06-18',
        uploadedBy: 'AGENCY001',
        downloadUrl: '/docs/completion-003.pdf'
      }
    ],
    payments: [
      {
        id: 'pay3_1',
        installmentNo: 1,
        amount: 3500000,
        sanctionOrderNo: 'SAN/MPLADS/2023/889',
        paidAt: '2024-07-02',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2023-11-05' },
      { stage: 'Feasibility Check', completed: true, date: '2023-12-01' },
      { stage: 'Sanction', completed: true, date: '2023-12-18' },
      { stage: 'Agency Assignment', completed: true, date: '2024-01-05' },
      { stage: 'Execution', completed: true, date: '2024-01-10' },
      { stage: 'Payment', completed: true, date: '2024-07-02' },
      { stage: 'Completion', completed: true, date: '2024-06-15' }
    ]
  },
  {
    id: 'PRJ-2024-004',
    projectCode: 'MPLADS-HYD-2024-004',
    title: 'Purified RO Drinking Water Treatment Plant at Sanathnagar',
    description: 'Setting up of 2,000 LPH commercial-grade reverse osmosis community drinking water station with 24/7 dispenser kiosk.',
    category: 'Drinking Water & Sanitation',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Near Community Health Centre, Czech Colony, Sanathnagar, Hyderabad',
    latitude: 17.4582,
    longitude: 78.4419,
    estimatedCost: 1650000,
    sanctionedAmount: 1650000,
    fundsUtilized: 990000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'AquaPure Infra Technologies',
    vendorPanMasked: 'AAJCA****Q',
    recommendationDate: '2024-03-01',
    sanctionDate: '2024-04-10',
    startDate: '2024-05-01',
    expectedCompletionDate: '2024-10-31',
    status: 'Ongoing',
    completionPercentage: 70,
    riskAnalysis: {
      overallScore: 68,
      riskLevel: 'HIGH',
      lastEvaluatedAt: '2025-02-26T11:00:00Z',
      costAnomalyScore: 15,
      duplicateProbability: 12,
      photoAnomalyScore: 92, // PHOTO ANOMALY ALERT!
      locationMismatch: false,
      delayProbability: 45,
      reasons: [
        'Image perceptual hashing detected 94% visual overlap with an archived photograph from a 2022 project',
        'Potential reuse of generic water treatment plant photograph instead of live on-site progress snapshot',
        'Metadata timestamp does not align with reported casting date'
      ],
      recommendations: [
        'Enforce mandatory on-site re-capture with real-time camera app and timestamp watermark',
        'Direct junior engineer to verify physical installation of membranes and storage tank'
      ],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator generated for administrative review.'
    },
    photos: [
      {
        id: 'p4_1',
        stage: 'before',
        url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=60',
        caption: 'Pump house foundation site',
        uploadedAt: '2024-05-05',
        uploadedBy: 'AGENCY001',
        latitude: 17.4582,
        longitude: 78.4419,
        isAiVerified: true
      },
      {
        id: 'p4_2',
        stage: 'during',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
        caption: 'RO machinery assembly & pipeline connection',
        uploadedAt: '2024-09-20',
        uploadedBy: 'AGENCY001',
        latitude: 17.4582,
        longitude: 78.4419,
        isAiVerified: false,
        similarityAlert: true,
        aiVerificationNotes: 'CRITICAL: High perceptual similarity to stock machinery archive. Physical inspection needed.'
      }
    ],
    documents: [
      {
        id: 'doc4_1',
        name: 'Technical_Estimate_RO_Plant.pdf',
        type: 'Sanction Order',
        fileSize: '3.1 MB',
        uploadedAt: '2024-04-10',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-004.pdf'
      }
    ],
    payments: [
      {
        id: 'pay4_1',
        installmentNo: 1,
        amount: 990000,
        sanctionOrderNo: 'SAN/MPLADS/2024/204',
        paidAt: '2024-05-15',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-03-01' },
      { stage: 'Feasibility Check', completed: true, date: '2024-03-22' },
      { stage: 'Sanction', completed: true, date: '2024-04-10' },
      { stage: 'Agency Assignment', completed: true, date: '2024-04-20' },
      { stage: 'Execution', completed: true, date: '2024-05-01' },
      { stage: 'Payment', completed: false, remarks: 'Next tranche withheld pending photo verification' },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-005',
    projectCode: 'MPLADS-HYD-2024-005',
    title: 'Upgradation of Government Primary School into Model Smart School',
    description: 'Civil repair, interactive smart boards, rooftop waterproofing, digital computer lab, and dual-desk classroom furniture at Secunderabad.',
    category: 'Education & Schools',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Govt High School, Rezimental Bazar, Secunderabad',
    latitude: 17.4411,
    longitude: 78.5015,
    estimatedCost: 2800000,
    sanctionedAmount: 2800000,
    fundsUtilized: 1680000,
    implementingAgencyId: 'AGENCY002',
    implementingAgencyName: 'PRED Secunderabad',
    vendorName: 'Vidya Edutech & Infra Works',
    vendorPanMasked: 'AABVE****R',
    recommendationDate: '2024-02-18',
    sanctionDate: '2024-03-25',
    startDate: '2024-04-15',
    expectedCompletionDate: '2024-12-31',
    status: 'Ongoing',
    completionPercentage: 65,
    riskAnalysis: {
      overallScore: 64,
      riskLevel: 'HIGH',
      lastEvaluatedAt: '2025-02-28T16:00:00Z',
      costAnomalyScore: 20,
      duplicateProbability: 10,
      photoAnomalyScore: 12,
      locationMismatch: true, // LOCATION MISMATCH DETECTED!
      delayProbability: 38,
      reasons: [
        'Geotag mismatch detected: Uploaded progress image coordinates (17.5142 N, 78.4320 E) are 8.4 km away from Sanctioned School location',
        'Camera metadata indicates photo captured in Quthbullapur jurisdiction'
      ],
      recommendations: [
        'Issue inquiry to field engineer regarding incorrect GPS capture',
        'Require immediate re-submission of verified geotagged photograph on school grounds'
      ],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator generated for administrative review.'
    },
    photos: [
      {
        id: 'p5_1',
        stage: 'during',
        url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=60',
        caption: 'Classroom flooring & painting work',
        uploadedAt: '2024-08-14',
        uploadedBy: 'AGENCY002',
        latitude: 17.5142, // GPS mismatch!
        longitude: 78.4320,
        isAiVerified: false,
        aiVerificationNotes: 'LOCATION MISMATCH: Photo coordinates are 8.4 km away from sanctioned project premises!'
      }
    ],
    documents: [
      {
        id: 'doc5_1',
        name: 'Smart_School_Sanction.pdf',
        type: 'Sanction Order',
        fileSize: '2.2 MB',
        uploadedAt: '2024-03-25',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-005.pdf'
      }
    ],
    payments: [
      {
        id: 'pay5_1',
        installmentNo: 1,
        amount: 1680000,
        sanctionOrderNo: 'SAN/MPLADS/2024/162',
        paidAt: '2024-05-10',
        status: 'Disbursed',
        beneficiaryAgency: 'PRED Secunderabad'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-02-18' },
      { stage: 'Feasibility Check', completed: true, date: '2024-03-10' },
      { stage: 'Sanction', completed: true, date: '2024-03-25' },
      { stage: 'Agency Assignment', completed: true, date: '2024-04-05' },
      { stage: 'Execution', completed: true, date: '2024-04-15' },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-006',
    projectCode: 'MPLADS-HYD-2024-006',
    title: 'Construction of Primary Health Sub-Centre at Bowenpally',
    description: 'New two-story health sub-centre with doctor consultation chamber, immunization cold-chain room, diagnostic lab, and pharmacy counter.',
    category: 'Healthcare & Wellness',
    mpId: 'MP002',
    mpName: 'Smt. Kavitha Rao',
    constituency: 'Secunderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Old Bowenpally, Near Market Yard, Secunderabad, Hyderabad',
    latitude: 17.4764,
    longitude: 78.4862,
    estimatedCost: 3800000,
    sanctionedAmount: 3800000,
    fundsUtilized: 1140000,
    implementingAgencyId: 'AGENCY002',
    implementingAgencyName: 'PRED Secunderabad',
    vendorName: 'Apex Healthinfra Corp',
    vendorPanMasked: 'AACAQ****T',
    recommendationDate: '2023-12-01',
    sanctionDate: '2024-01-20',
    startDate: '2024-02-15',
    expectedCompletionDate: '2024-11-15',
    status: 'Delayed',
    completionPercentage: 35,
    riskAnalysis: {
      overallScore: 76,
      riskLevel: 'HIGH',
      lastEvaluatedAt: '2025-02-28T12:00:00Z',
      costAnomalyScore: 24,
      duplicateProbability: 14,
      photoAnomalyScore: 10,
      locationMismatch: false,
      delayProbability: 92, // SEVERE DELAY PREDICTION!
      reasons: [
        'Expected completion date was 15-Nov-2024, but current progress is only 35%',
        'Work velocity is 2.4% per month against required 8.5% per month',
        'High probability of cost overruns due to prolonged civil delay'
      ],
      recommendations: [
        'Issue penalty clause notice to contractor under Section 14 of Standard Agreement',
        'Review labor mobilization schedule and weekly review by Executive Engineer'
      ],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator generated for administrative review.'
    },
    photos: [
      {
        id: 'p6_1',
        stage: 'during',
        url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=60',
        caption: 'Plinth work and foundation columns',
        uploadedAt: '2024-04-10',
        uploadedBy: 'AGENCY001',
        latitude: 17.4764,
        longitude: 78.4862,
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc6_1',
        name: 'PHC_Sanction_Order.pdf',
        type: 'Sanction Order',
        fileSize: '1.9 MB',
        uploadedAt: '2024-01-20',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-006.pdf'
      }
    ],
    payments: [
      {
        id: 'pay6_1',
        installmentNo: 1,
        amount: 1140000,
        sanctionOrderNo: 'SAN/MPLADS/2024/055',
        paidAt: '2024-03-01',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2023-12-01' },
      { stage: 'Feasibility Check', completed: true, date: '2024-01-05' },
      { stage: 'Sanction', completed: true, date: '2024-01-20' },
      { stage: 'Agency Assignment', completed: true, date: '2024-02-01' },
      { stage: 'Execution', completed: true, date: '2024-02-15' },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-007',
    projectCode: 'MPLADS-HYD-2024-007',
    title: 'Laying of CC Road and Underground Stormwater Drain at Malkajgiri',
    description: 'Providing heavy-duty Cement Concrete (CC) road with reinforced cover slabs and roadside drain network to prevent waterlogging.',
    category: 'Roads, Bridges & Pathways',
    mpId: 'MP002',
    mpName: 'Smt. Kavitha Rao',
    constituency: 'Secunderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Geetha Nagar, Ward No. 138, Malkajgiri, Hyderabad',
    latitude: 17.4498,
    longitude: 78.5321,
    estimatedCost: 2200000,
    sanctionedAmount: 2200000,
    fundsUtilized: 2200000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Sri Sai Ram Infra Projects Ltd',
    vendorPanMasked: 'AABCS****K',
    recommendationDate: '2024-01-05',
    sanctionDate: '2024-02-15',
    startDate: '2024-03-01',
    expectedCompletionDate: '2024-07-31',
    actualCompletionDate: '2024-07-20',
    status: 'Completed',
    completionPercentage: 100,
    riskAnalysis: {
      overallScore: 22,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2024-07-25T10:00:00Z',
      costAnomalyScore: 16,
      duplicateProbability: 15,
      photoAnomalyScore: 10,
      locationMismatch: false,
      delayProbability: 15,
      reasons: ['Work completed within schedule and sanctioned expenditure limits'],
      recommendations: ['Maintain quality assurance test report in divisional records'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p7_1',
        stage: 'before',
        url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
        caption: 'Kucha mud road with stagnant monsoon puddles',
        uploadedAt: '2024-02-28',
        uploadedBy: 'AGENCY001',
        isAiVerified: true
      },
      {
        id: 'p7_2',
        stage: 'after',
        url: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=60',
        caption: 'Finished Cement Concrete road with side drains and chamber covers',
        uploadedAt: '2024-07-20',
        uploadedBy: 'AGENCY001',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc7_1',
        name: 'CC_Road_Final_Bill_Utilisation.pdf',
        type: 'Bill',
        fileSize: '3.4 MB',
        uploadedAt: '2024-07-22',
        uploadedBy: 'AGENCY001',
        downloadUrl: '/docs/bill-007.pdf'
      }
    ],
    payments: [
      {
        id: 'pay7_1',
        installmentNo: 1,
        amount: 2200000,
        sanctionOrderNo: 'SAN/MPLADS/2024/098',
        paidAt: '2024-08-01',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-01-05' },
      { stage: 'Feasibility Check', completed: true, date: '2024-01-25' },
      { stage: 'Sanction', completed: true, date: '2024-02-15' },
      { stage: 'Agency Assignment', completed: true, date: '2024-02-22' },
      { stage: 'Execution', completed: true, date: '2024-03-01' },
      { stage: 'Payment', completed: true, date: '2024-08-01' },
      { stage: 'Completion', completed: true, date: '2024-07-20' }
    ]
  },
  {
    id: 'PRJ-2024-008',
    projectCode: 'MPLADS-HYD-2024-008',
    title: 'Modern Anganwadi Building & Nutrition Center at Begumpet',
    description: 'Child-friendly early learning centre with fortified meal kitchen, child-safe toilets, play yard, and nursing room.',
    category: 'Child & Women Welfare',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Prakash Nagar, Near Railway Station, Begumpet, Hyderabad',
    latitude: 17.4435,
    longitude: 78.4721,
    estimatedCost: 1400000,
    sanctionedAmount: 1400000,
    fundsUtilized: 1120000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Bal Vikas Infra Nirman',
    vendorPanMasked: 'AAGCB****B',
    recommendationDate: '2024-03-12',
    sanctionDate: '2024-04-18',
    startDate: '2024-05-10',
    expectedCompletionDate: '2025-01-15',
    status: 'Ongoing',
    completionPercentage: 80,
    riskAnalysis: {
      overallScore: 26,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2025-02-25T15:30:00Z',
      costAnomalyScore: 10,
      duplicateProbability: 12,
      photoAnomalyScore: 8,
      locationMismatch: false,
      delayProbability: 22,
      reasons: ['Progress matches projected timetable', 'No cost or spatial anomalies detected'],
      recommendations: ['Prepare for final handover to Women & Child Development Department'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p8_1',
        stage: 'during',
        url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=60',
        caption: 'Interior plastering and child-themed wall paintings',
        uploadedAt: '2024-11-20',
        uploadedBy: 'AGENCY001',
        latitude: 17.4435,
        longitude: 78.4721,
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc8_1',
        name: 'Anganwadi_Sanction_14L.pdf',
        type: 'Sanction Order',
        fileSize: '1.6 MB',
        uploadedAt: '2024-04-18',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-008.pdf'
      }
    ],
    payments: [
      {
        id: 'pay8_1',
        installmentNo: 1,
        amount: 700000,
        sanctionOrderNo: 'SAN/MPLADS/2024/180',
        paidAt: '2024-06-01',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      },
      {
        id: 'pay8_2',
        installmentNo: 2,
        amount: 420000,
        sanctionOrderNo: 'SAN/MPLADS/2024/295',
        paidAt: '2024-11-05',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-03-12' },
      { stage: 'Feasibility Check', completed: true, date: '2024-04-02' },
      { stage: 'Sanction', completed: true, date: '2024-04-18' },
      { stage: 'Agency Assignment', completed: true, date: '2024-04-28' },
      { stage: 'Execution', completed: true, date: '2024-05-10' },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-009',
    projectCode: 'MPLADS-HYD-2024-009',
    title: 'Advanced Skill Development & Computer Training Lab at Alwal',
    description: 'Establishment of 40-seater vocational IT training lab with high-speed fiber connectivity, UPS, and certified curriculum modules.',
    category: 'Skill Development & IT',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Old Municipal Complex, Alwal Hills, Hyderabad',
    latitude: 17.5029,
    longitude: 78.5084,
    estimatedCost: 1950000,
    sanctionedAmount: 1950000,
    fundsUtilized: 1950000,
    implementingAgencyId: 'AGENCY002',
    implementingAgencyName: 'PRED Secunderabad',
    vendorName: 'Telangana Digital Horizons',
    vendorPanMasked: 'AABTD****Z',
    recommendationDate: '2023-10-15',
    sanctionDate: '2023-11-28',
    startDate: '2023-12-15',
    expectedCompletionDate: '2024-05-31',
    actualCompletionDate: '2024-05-10',
    status: 'Completed',
    completionPercentage: 100,
    riskAnalysis: {
      overallScore: 18,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2024-05-15T11:00:00Z',
      costAnomalyScore: 14,
      duplicateProbability: 8,
      photoAnomalyScore: 6,
      locationMismatch: false,
      delayProbability: 8,
      reasons: ['Successfully inspected by Joint Collector; asset tracking RFID registered'],
      recommendations: ['Conduct quarterly operational review with SETWIN coordinators'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p9_1',
        stage: 'after',
        url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=60',
        caption: 'Operational computer training batch with registered students',
        uploadedAt: '2024-05-10',
        uploadedBy: 'AGENCY002',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc9_1',
        name: 'Skill_Lab_Handover_Receipt.pdf',
        type: 'Completion Certificate',
        fileSize: '2.1 MB',
        uploadedAt: '2024-05-12',
        uploadedBy: 'AGENCY002',
        downloadUrl: '/docs/completion-009.pdf'
      }
    ],
    payments: [
      {
        id: 'pay9_1',
        installmentNo: 1,
        amount: 1950000,
        sanctionOrderNo: 'SAN/MPLADS/2023/771',
        paidAt: '2024-05-25',
        status: 'Disbursed',
        beneficiaryAgency: 'PRED Secunderabad'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2023-10-15' },
      { stage: 'Feasibility Check', completed: true, date: '2023-11-10' },
      { stage: 'Sanction', completed: true, date: '2023-11-28' },
      { stage: 'Agency Assignment', completed: true, date: '2023-12-05' },
      { stage: 'Execution', completed: true, date: '2023-12-15' },
      { stage: 'Payment', completed: true, date: '2024-05-25' },
      { stage: 'Completion', completed: true, date: '2024-05-10' }
    ]
  },
  {
    id: 'PRJ-2024-010',
    projectCode: 'MPLADS-HYD-2024-010',
    title: 'Public Crematorium & Vaikunta Dhamam Modernization at Tirumalagiri',
    description: 'Eco-friendly electric/gas furnace retrofit, covered waiting sheds, immersion pond filtration, and paved pathways.',
    category: 'Community Infrastructure',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Survey No. 42, Lal Bazaar Road, Tirumalagiri, Secunderabad',
    latitude: 17.4719,
    longitude: 78.5089,
    estimatedCost: 3200000,
    sanctionedAmount: 3200000,
    fundsUtilized: 1280000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Sri Sai Ram Infra Projects Ltd',
    vendorPanMasked: 'AABCS****K',
    recommendationDate: '2024-04-02',
    sanctionDate: '2024-05-20',
    startDate: '2024-06-15',
    expectedCompletionDate: '2025-02-28',
    status: 'Ongoing',
    completionPercentage: 40,
    riskAnalysis: {
      overallScore: 58,
      riskLevel: 'MEDIUM',
      lastEvaluatedAt: '2025-02-24T10:00:00Z',
      costAnomalyScore: 32,
      duplicateProbability: 18,
      photoAnomalyScore: 12,
      locationMismatch: false,
      delayProbability: 62,
      reasons: [
        'Progress lagging behind revised winter target (40% vs expected 65%)',
        'Single vendor undertaking multiple active civil projects simultaneously'
      ],
      recommendations: ['Review civil execution pace with agency project director'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p10_1',
        stage: 'during',
        url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=60',
        caption: 'Civil masonry of furnace shelter structure',
        uploadedAt: '2024-10-15',
        uploadedBy: 'AGENCY001',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc10_1',
        name: 'Vaikunta_Dhamam_Sanction.pdf',
        type: 'Sanction Order',
        fileSize: '2.5 MB',
        uploadedAt: '2024-05-20',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-010.pdf'
      }
    ],
    payments: [
      {
        id: 'pay10_1',
        installmentNo: 1,
        amount: 1280000,
        sanctionOrderNo: 'SAN/MPLADS/2024/220',
        paidAt: '2024-06-30',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-04-02' },
      { stage: 'Feasibility Check', completed: true, date: '2024-05-05' },
      { stage: 'Sanction', completed: true, date: '2024-05-20' },
      { stage: 'Agency Assignment', completed: true, date: '2024-06-01' },
      { stage: 'Execution', completed: true, date: '2024-06-15' },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-011',
    projectCode: 'MPLADS-HYD-2024-011',
    title: 'Rainwater Harvesting Pit & Ground Water Recharging System at Jubilee Hills',
    description: 'Construction of 25 localized injection wells and scientific silt filtration traps across public parks and government buildings.',
    category: 'Drinking Water & Sanitation',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Sector-3 Public Park, Jubilee Hills, Hyderabad',
    latitude: 17.4319,
    longitude: 78.4073,
    estimatedCost: 1250000,
    sanctionedAmount: 1250000,
    fundsUtilized: 1250000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Jal Shakti Ecological Works',
    vendorPanMasked: 'AAEJW****J',
    recommendationDate: '2023-09-01',
    sanctionDate: '2023-10-15',
    startDate: '2023-11-01',
    expectedCompletionDate: '2024-03-31',
    actualCompletionDate: '2024-03-25',
    status: 'Completed',
    completionPercentage: 100,
    riskAnalysis: {
      overallScore: 12,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2024-04-01T10:00:00Z',
      costAnomalyScore: 10,
      duplicateProbability: 5,
      photoAnomalyScore: 8,
      locationMismatch: false,
      delayProbability: 5,
      reasons: ['Completed on time with hydrogeologist certification'],
      recommendations: ['Periodic silt clearance prior to monsoon'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p11_1',
        stage: 'after',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=60',
        caption: 'Recharging pit with filtration layers and safety cover',
        uploadedAt: '2024-03-25',
        uploadedBy: 'AGENCY001',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc11_1',
        name: 'Hydrogeology_Certification.pdf',
        type: 'Completion Certificate',
        fileSize: '1.2 MB',
        uploadedAt: '2024-03-28',
        uploadedBy: 'AGENCY001',
        downloadUrl: '/docs/cert-011.pdf'
      }
    ],
    payments: [
      {
        id: 'pay11_1',
        installmentNo: 1,
        amount: 1250000,
        sanctionOrderNo: 'SAN/MPLADS/2023/612',
        paidAt: '2024-04-10',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2023-09-01' },
      { stage: 'Feasibility Check', completed: true, date: '2023-09-25' },
      { stage: 'Sanction', completed: true, date: '2023-10-15' },
      { stage: 'Agency Assignment', completed: true, date: '2023-10-25' },
      { stage: 'Execution', completed: true, date: '2023-11-01' },
      { stage: 'Payment', completed: true, date: '2024-04-10' },
      { stage: 'Completion', completed: true, date: '2024-03-25' }
    ]
  },
  {
    id: 'PRJ-2024-012',
    projectCode: 'MPLADS-HYD-2024-012',
    title: 'Open Gymnasium & Senior Citizen Walking Track at Marredpally',
    description: 'Installation of 12 outdoor gym equipment units, synthetic reflexology walking track, LED post lamps, and park benches.',
    category: 'Sports & Recreation',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Nehru Municipal Park, East Marredpally, Secunderabad',
    latitude: 17.4475,
    longitude: 78.5144,
    estimatedCost: 1800000,
    sanctionedAmount: 1800000,
    fundsUtilized: 900000,
    implementingAgencyId: 'AGENCY002',
    implementingAgencyName: 'PRED Secunderabad',
    vendorName: 'FitIndia Outdoor Equipments',
    vendorPanMasked: 'AAFFI****L',
    recommendationDate: '2024-05-10',
    sanctionDate: '2024-06-25',
    startDate: '2024-07-15',
    expectedCompletionDate: '2024-12-15',
    status: 'Ongoing',
    completionPercentage: 50,
    riskAnalysis: {
      overallScore: 30,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2025-02-20T14:00:00Z',
      costAnomalyScore: 18,
      duplicateProbability: 10,
      photoAnomalyScore: 8,
      locationMismatch: false,
      delayProbability: 32,
      reasons: ['Equipment delivery arrived at site; civil grouting ongoing'],
      recommendations: ['Verify weather-proof coating before final billing'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p12_1',
        stage: 'during',
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60',
        caption: 'Equipment concrete pedestals installation',
        uploadedAt: '2024-10-05',
        uploadedBy: 'AGENCY002',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc12_1',
        name: 'Gym_Equipments_Sanction.pdf',
        type: 'Sanction Order',
        fileSize: '1.5 MB',
        uploadedAt: '2024-06-25',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-012.pdf'
      }
    ],
    payments: [
      {
        id: 'pay12_1',
        installmentNo: 1,
        amount: 900000,
        sanctionOrderNo: 'SAN/MPLADS/2024/256',
        paidAt: '2024-07-30',
        status: 'Disbursed',
        beneficiaryAgency: 'PRED Secunderabad'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-05-10' },
      { stage: 'Feasibility Check', completed: true, date: '2024-06-05' },
      { stage: 'Sanction', completed: true, date: '2024-06-25' },
      { stage: 'Agency Assignment', completed: true, date: '2024-07-05' },
      { stage: 'Execution', completed: true, date: '2024-07-15' },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-013',
    projectCode: 'MPLADS-HYD-2024-013',
    title: 'Procurement of Advanced Life Support (ALS) Ambulance for Area Hospital',
    description: 'Fully equipped critical care mobile ambulance with defibrillator, portable ventilator, multipara patient monitor, and GPS emergency tracker.',
    category: 'Healthcare & Wellness',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Area Hospital, Bolarum, Secunderabad Cantonment',
    latitude: 17.5123,
    longitude: 78.5218,
    estimatedCost: 4200000,
    sanctionedAmount: 4200000,
    fundsUtilized: 4200000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'MedLife Emergency Vehicles India',
    vendorPanMasked: 'AABME****H',
    recommendationDate: '2023-08-10',
    sanctionDate: '2023-09-20',
    startDate: '2023-10-05',
    expectedCompletionDate: '2024-01-31',
    actualCompletionDate: '2024-01-20',
    status: 'Completed',
    completionPercentage: 100,
    riskAnalysis: {
      overallScore: 15,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2024-02-05T10:00:00Z',
      costAnomalyScore: 12,
      duplicateProbability: 5,
      photoAnomalyScore: 5,
      locationMismatch: false,
      delayProbability: 5,
      reasons: ['GeM portal tender compliance verified; vehicle registered with RTA'],
      recommendations: ['Annual comprehensive maintenance contract (CMC) logbook setup'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p13_1',
        stage: 'after',
        url: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=800&auto=format&fit=crop&q=60',
        caption: 'ALS ambulance handover ceremony to Hospital Superintendent',
        uploadedAt: '2024-01-20',
        uploadedBy: 'AGENCY001',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc13_1',
        name: 'RTA_Vehicle_Registration_Ambulance.pdf',
        type: 'Completion Certificate',
        fileSize: '1.7 MB',
        uploadedAt: '2024-01-22',
        uploadedBy: 'AGENCY001',
        downloadUrl: '/docs/rta-013.pdf'
      }
    ],
    payments: [
      {
        id: 'pay13_1',
        installmentNo: 1,
        amount: 4200000,
        sanctionOrderNo: 'SAN/MPLADS/2023/540',
        paidAt: '2024-02-10',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2023-08-10' },
      { stage: 'Feasibility Check', completed: true, date: '2023-09-05' },
      { stage: 'Sanction', completed: true, date: '2023-09-20' },
      { stage: 'Agency Assignment', completed: true, date: '2023-09-28' },
      { stage: 'Execution', completed: true, date: '2023-10-05' },
      { stage: 'Payment', completed: true, date: '2024-02-10' },
      { stage: 'Completion', completed: true, date: '2024-01-20' }
    ]
  },
  {
    id: 'PRJ-2024-014',
    projectCode: 'MPLADS-HYD-2024-014',
    title: 'Solarization of District Collectorate & Administrative Block',
    description: 'Rooftop grid-tied 100 kWp solar photovoltaic power plant with bi-directional net metering and remote cloud monitoring console.',
    category: 'Renewable Energy',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'District Collectorate Complex, Chirag Ali Lane, Abids, Hyderabad',
    latitude: 17.3916,
    longitude: 78.4735,
    estimatedCost: 5500000,
    sanctionedAmount: 5500000,
    fundsUtilized: 2750000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Surya Green Power Solutions Pvt Ltd',
    vendorPanMasked: 'AAGCS****P',
    recommendationDate: '2024-06-01',
    sanctionDate: '2024-07-15',
    startDate: '2024-08-10',
    expectedCompletionDate: '2025-01-31',
    status: 'Ongoing',
    completionPercentage: 55,
    riskAnalysis: {
      overallScore: 28,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2025-02-22T10:30:00Z',
      costAnomalyScore: 18,
      duplicateProbability: 10,
      photoAnomalyScore: 8,
      locationMismatch: false,
      delayProbability: 25,
      reasons: ['Mounting structure erection completed; panel wiring in progress'],
      recommendations: ['Coordinate with TSSPDCL for net-metering synchronization'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p14_1',
        stage: 'during',
        url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=60',
        caption: 'Galvanized iron solar module mounting frames on rooftop',
        uploadedAt: '2024-11-10',
        uploadedBy: 'AGENCY001',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc14_1',
        name: 'Collectorate_Solar_Sanction.pdf',
        type: 'Sanction Order',
        fileSize: '3.2 MB',
        uploadedAt: '2024-07-15',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-014.pdf'
      }
    ],
    payments: [
      {
        id: 'pay14_1',
        installmentNo: 1,
        amount: 2750000,
        sanctionOrderNo: 'SAN/MPLADS/2024/310',
        paidAt: '2024-08-25',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-06-01' },
      { stage: 'Feasibility Check', completed: true, date: '2024-06-28' },
      { stage: 'Sanction', completed: true, date: '2024-07-15' },
      { stage: 'Agency Assignment', completed: true, date: '2024-07-30' },
      { stage: 'Execution', completed: true, date: '2024-08-10' },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-015',
    projectCode: 'MPLADS-HYD-2024-015',
    title: 'Women Self-Help Group (SHG) Livelihood & Processing Center at Bowenpally',
    description: 'Construction of dedicated training, packaging, and micro-enterprise processing facility for female artisans and food entrepreneurs.',
    category: 'Child & Women Welfare',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Near Subhash Nagar Community Hall, Bowenpally, Hyderabad',
    latitude: 17.4789,
    longitude: 78.4891,
    estimatedCost: 2600000,
    sanctionedAmount: 2600000,
    fundsUtilized: 0,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Pending Tender Finalization',
    vendorPanMasked: 'PENDING',
    recommendationDate: '2024-07-02',
    sanctionDate: '2024-08-14',
    startDate: '2024-09-01',
    expectedCompletionDate: '2025-06-30',
    status: 'Assigned',
    completionPercentage: 0,
    riskAnalysis: {
      overallScore: 20,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2024-08-20T10:00:00Z',
      costAnomalyScore: 12,
      duplicateProbability: 14,
      photoAnomalyScore: 0,
      locationMismatch: false,
      delayProbability: 15,
      reasons: ['Tender documents under review by procurement wing'],
      recommendations: ['Finalize vendor award within standard notice period'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [],
    documents: [
      {
        id: 'doc15_1',
        name: 'SHG_Center_Sanction.pdf',
        type: 'Sanction Order',
        fileSize: '1.9 MB',
        uploadedAt: '2024-08-14',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-015.pdf'
      }
    ],
    payments: [],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-07-02' },
      { stage: 'Feasibility Check', completed: true, date: '2024-07-25' },
      { stage: 'Sanction', completed: true, date: '2024-08-14' },
      { stage: 'Agency Assignment', completed: true, date: '2024-08-28' },
      { stage: 'Execution', completed: false },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-016',
    projectCode: 'MPLADS-HYD-2024-016',
    title: 'Construction of Over-Head Water Reservoir (OHSR) at Medchal Borders',
    description: '1.5 Lakh Litre capacity RCC overhead service reservoir with distribution pipelines to supply drinking water to newly developed urban wards.',
    category: 'Drinking Water & Sanitation',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Kompally Border Road, Ward 142, Hyderabad North',
    latitude: 17.5385,
    longitude: 78.4901,
    estimatedCost: 4500000,
    sanctionedAmount: 4500000,
    fundsUtilized: 1350000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Sri Sai Ram Infra Projects Ltd',
    vendorPanMasked: 'AABCS****K',
    recommendationDate: '2024-02-05',
    sanctionDate: '2024-03-15',
    startDate: '2024-04-01',
    expectedCompletionDate: '2024-12-15',
    status: 'Delayed',
    completionPercentage: 30,
    riskAnalysis: {
      overallScore: 74,
      riskLevel: 'HIGH',
      lastEvaluatedAt: '2025-02-27T10:00:00Z',
      costAnomalyScore: 35,
      duplicateProbability: 15,
      photoAnomalyScore: 12,
      locationMismatch: false,
      delayProbability: 88,
      reasons: [
        'Expected completion date passed with only staging stage complete (30%)',
        'Staging shuttering collapsed partially due to monsoon downpour in July',
        'Contractor response to cure notice pending'
      ],
      recommendations: ['Structural safety assessment by Osmania University Civil Dept'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p16_1',
        stage: 'during',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=60',
        caption: 'RCC staging column casting for reservoir base',
        uploadedAt: '2024-06-20',
        uploadedBy: 'AGENCY001',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc16_1',
        name: 'OHSR_Structural_Sanction.pdf',
        type: 'Sanction Order',
        fileSize: '3.6 MB',
        uploadedAt: '2024-03-15',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-016.pdf'
      }
    ],
    payments: [
      {
        id: 'pay16_1',
        installmentNo: 1,
        amount: 1350000,
        sanctionOrderNo: 'SAN/MPLADS/2024/150',
        paidAt: '2024-04-20',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-02-05' },
      { stage: 'Feasibility Check', completed: true, date: '2024-02-28' },
      { stage: 'Sanction', completed: true, date: '2024-03-15' },
      { stage: 'Agency Assignment', completed: true, date: '2024-03-25' },
      { stage: 'Execution', completed: true, date: '2024-04-01' },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-017',
    projectCode: 'MPLADS-HYD-2024-017',
    title: 'Installation of CCTV Surveillance Network for Women Safety',
    description: 'Deployment of 120 IP-based high-definition night-vision cameras with optical fiber ring and command control integration with Hyderabad Police.',
    category: 'Public Safety & Security',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Commercial Hubs & Bus Shelters, Secunderabad Station Area',
    latitude: 17.4344,
    longitude: 78.5011,
    estimatedCost: 4800000,
    sanctionedAmount: 4800000,
    fundsUtilized: 4800000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'SecureCity Telecom Systems',
    vendorPanMasked: 'AABSC****N',
    recommendationDate: '2023-11-12',
    sanctionDate: '2023-12-20',
    startDate: '2024-01-15',
    expectedCompletionDate: '2024-07-31',
    actualCompletionDate: '2024-07-15',
    status: 'Completed',
    completionPercentage: 100,
    riskAnalysis: {
      overallScore: 16,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2024-08-01T10:00:00Z',
      costAnomalyScore: 14,
      duplicateProbability: 5,
      photoAnomalyScore: 5,
      locationMismatch: false,
      delayProbability: 5,
      reasons: ['Integrated into Commissionerate Command Centre; UCs verified'],
      recommendations: ['Routine camera lens cleaning schedule managed by Traffic Wing'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p17_1',
        stage: 'after',
        url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=60',
        caption: 'CCTV camera pole with optical junction box and solar backup',
        uploadedAt: '2024-07-15',
        uploadedBy: 'AGENCY001',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc17_1',
        name: 'Police_Integration_Acceptance.pdf',
        type: 'Completion Certificate',
        fileSize: '2.4 MB',
        uploadedAt: '2024-07-18',
        uploadedBy: 'AGENCY001',
        downloadUrl: '/docs/cert-017.pdf'
      }
    ],
    payments: [
      {
        id: 'pay17_1',
        installmentNo: 1,
        amount: 4800000,
        sanctionOrderNo: 'SAN/MPLADS/2023/899',
        paidAt: '2024-08-10',
        status: 'Disbursed',
        beneficiaryAgency: 'TSUDA - Hyderabad Zone'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2023-11-12' },
      { stage: 'Feasibility Check', completed: true, date: '2023-12-05' },
      { stage: 'Sanction', completed: true, date: '2023-12-20' },
      { stage: 'Agency Assignment', completed: true, date: '2024-01-05' },
      { stage: 'Execution', completed: true, date: '2024-01-15' },
      { stage: 'Payment', completed: true, date: '2024-08-10' },
      { stage: 'Completion', completed: true, date: '2024-07-15' }
    ]
  },
  {
    id: 'PRJ-2024-018',
    projectCode: 'MPLADS-HYD-2024-018',
    title: 'Modern Science & Innovation Tinkering Lab at Govt Junior College',
    description: 'Setup of robotics kits, 3D printers, physics & chemistry simulation workstations, and high-speed research terminal.',
    category: 'Education & Schools',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Govt Junior College, Marredpally Main Road, Secunderabad',
    latitude: 17.4489,
    longitude: 78.5098,
    estimatedCost: 2400000,
    sanctionedAmount: 2400000,
    fundsUtilized: 1200000,
    implementingAgencyId: 'AGENCY002',
    implementingAgencyName: 'PRED Secunderabad',
    vendorName: 'Vidya Edutech & Infra Works',
    vendorPanMasked: 'AABVE****R',
    recommendationDate: '2024-04-20',
    sanctionDate: '2024-05-30',
    startDate: '2024-06-25',
    expectedCompletionDate: '2025-01-31',
    status: 'Ongoing',
    completionPercentage: 50,
    riskAnalysis: {
      overallScore: 25,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2025-02-23T11:00:00Z',
      costAnomalyScore: 15,
      duplicateProbability: 10,
      photoAnomalyScore: 8,
      locationMismatch: false,
      delayProbability: 20,
      reasons: ['Hardware delivery confirmed by college principal'],
      recommendations: ['Conduct faculty training prior to inauguration'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [
      {
        id: 'p18_1',
        stage: 'during',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
        caption: 'Lab electrical work and acoustic false ceiling installation',
        uploadedAt: '2024-10-18',
        uploadedBy: 'AGENCY002',
        isAiVerified: true
      }
    ],
    documents: [
      {
        id: 'doc18_1',
        name: 'Science_Lab_Sanction_24L.pdf',
        type: 'Sanction Order',
        fileSize: '1.8 MB',
        uploadedAt: '2024-05-30',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-018.pdf'
      }
    ],
    payments: [
      {
        id: 'pay18_1',
        installmentNo: 1,
        amount: 1200000,
        sanctionOrderNo: 'SAN/MPLADS/2024/275',
        paidAt: '2024-07-15',
        status: 'Disbursed',
        beneficiaryAgency: 'PRED Secunderabad'
      }
    ],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-04-20' },
      { stage: 'Feasibility Check', completed: true, date: '2024-05-15' },
      { stage: 'Sanction', completed: true, date: '2024-05-30' },
      { stage: 'Agency Assignment', completed: true, date: '2024-06-10' },
      { stage: 'Execution', completed: true, date: '2024-06-25' },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-019',
    projectCode: 'MPLADS-HYD-2024-019',
    title: 'Establishment of Pediatric Dialysis Unit at Area Hospital',
    description: 'Procurement of 4 pediatric automated hemodialysis machines with dedicated RO water unit and negative pressure isolation.',
    category: 'Healthcare & Wellness',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Area Hospital, Golconda Fort Road, Hyderabad',
    latitude: 17.3833,
    longitude: 78.4011,
    estimatedCost: 6500000,
    sanctionedAmount: 0,
    fundsUtilized: 0,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Under Technical Feasibility',
    vendorPanMasked: 'PENDING',
    recommendationDate: '2024-08-01',
    sanctionDate: '',
    startDate: '',
    expectedCompletionDate: '',
    status: 'Recommended',
    completionPercentage: 0,
    riskAnalysis: {
      overallScore: 22,
      riskLevel: 'LOW',
      lastEvaluatedAt: '2024-08-05T10:00:00Z',
      costAnomalyScore: 18,
      duplicateProbability: 8,
      photoAnomalyScore: 0,
      locationMismatch: false,
      delayProbability: 0,
      reasons: ['Recommendation received; Joint Director of Health inspecting space feasibility'],
      recommendations: ['Verify medical technician staffing availability before formal sanction'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [],
    documents: [
      {
        id: 'doc19_1',
        name: 'MP_Recommendation_Dialysis.pdf',
        type: 'Recommendation',
        fileSize: '1.1 MB',
        uploadedAt: '2024-08-01',
        uploadedBy: 'MP001',
        downloadUrl: '/docs/rec-019.pdf'
      }
    ],
    payments: [],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-08-01' },
      { stage: 'Feasibility Check', completed: false, remarks: 'Technical committee inspecting site' },
      { stage: 'Sanction', completed: false },
      { stage: 'Agency Assignment', completed: false },
      { stage: 'Execution', completed: false },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  },
  {
    id: 'PRJ-2024-020',
    projectCode: 'MPLADS-HYD-2024-020',
    title: 'Underground Sewerage Pipeline & Interceptor Network at Old City',
    description: 'Replacing century-old choked stoneware pipes with 600mm RCC NP3 sewer pipes to prevent raw sewage overflow.',
    category: 'Drinking Water & Sanitation',
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Near Shah Ali Banda, Charminar Division, Hyderabad',
    latitude: 17.3564,
    longitude: 78.4719,
    estimatedCost: 3600000,
    sanctionedAmount: 3600000,
    fundsUtilized: 0,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Deccan Civil Trenchless Works',
    vendorPanMasked: 'AABDC****F',
    recommendationDate: '2024-06-15',
    sanctionDate: '2024-07-28',
    startDate: '2024-08-20',
    expectedCompletionDate: '2025-04-30',
    status: 'Sanctioned',
    completionPercentage: 0,
    riskAnalysis: {
      overallScore: 35,
      riskLevel: 'MEDIUM',
      lastEvaluatedAt: '2024-08-01T10:00:00Z',
      costAnomalyScore: 22,
      duplicateProbability: 18,
      photoAnomalyScore: 0,
      locationMismatch: false,
      delayProbability: 40,
      reasons: ['Traffic police permission for deep trench excavation in high-density lane is required'],
      recommendations: ['Obtain nighttime road cutting permission from Commissioner of Police'],
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator.'
    },
    photos: [],
    documents: [
      {
        id: 'doc20_1',
        name: 'Sewerage_Sanction_Order.pdf',
        type: 'Sanction Order',
        fileSize: '2.9 MB',
        uploadedAt: '2024-07-28',
        uploadedBy: 'ADMIN001',
        downloadUrl: '/docs/sanction-020.pdf'
      }
    ],
    payments: [],
    timeline: [
      { stage: 'Recommendation', completed: true, date: '2024-06-15' },
      { stage: 'Feasibility Check', completed: true, date: '2024-07-10' },
      { stage: 'Sanction', completed: true, date: '2024-07-28' },
      { stage: 'Agency Assignment', completed: true, date: '2024-08-10' },
      { stage: 'Execution', completed: false, remarks: 'Awaiting traffic police night diversion permit' },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  }
];

// File-Backed Atomic Persistent Database Store with Cryptographic Integrity

export const initialInspections: any[] = [
      {
        id: 'INSP-2024-001',
        projectId: 'PRJ-2024-001',
        projectTitle: 'Construction of Multipurpose Community Hall at Amberpet',
        scheduledDate: '2024-09-15',
        completedDate: '2024-09-15',
        inspectorName: 'Er. S. Venkat Reddy',
        inspectorDesignation: 'Executive Engineer, TSUDA',
        status: 'Completed',
        findings: 'Plinth level completed. Brick masonry in progress. Material testing report verified.',
        riskObservations: 'Work pace is slightly behind milestone schedule due to supply of TMT steel.',
        photos: [
          {
            id: 'insp_ph_01',
            url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=60',
            caption: 'Site inspection - column framework'
          }
        ]
      },
      {
        id: 'INSP-2024-002',
        projectId: 'PRJ-2024-006',
        projectTitle: 'Construction of Primary Health Sub-Centre at Bowenpally',
        scheduledDate: '2024-11-10',
        completedDate: '2024-11-12',
        inspectorName: 'Dr. Ananya Sharma, IAS',
        inspectorDesignation: 'District Magistrate',
        status: 'Completed',
        findings: 'High risk detected. Ground floor slab curing incomplete. Contractor issued show-cause notice.',
        riskObservations: 'Critical delay probability identified at 92%. Joint audit with PRED initiated.',
        photos: []
      }
    ];

export const initialNotifications: any[] = [
      {
        id: 'NOTIF-001',
        userId: 'ADMIN001',
        targetRole: 'ADMIN',
        title: 'New High-Risk Project Alert',
        message: 'Cost anomaly alert ALT-101 generated on Amberpet Community Hall requires your review.',
        type: 'ALERT',
        read: false,
        readBy: [],
        createdAt: '2025-01-10T09:00:00Z',
        link: '/alerts'
      },
      {
        id: 'NOTIF-002',
        userId: 'MP001',
        targetRole: 'MP',
        title: 'Milestone Disbursal Approved',
        message: 'First installment of ₹14.4 Lakh disbursed for Solar LED High-Mast Street Lights.',
        type: 'FINANCE',
        read: false,
        readBy: [],
        createdAt: '2025-01-15T14:30:00Z',
        link: '/projects/PRJ-2024-003'
      },
      {
        id: 'NOTIF-003',
        userId: 'AGENCY001',
        targetRole: 'AGENCY',
        title: 'Inspection Directive Issued',
        message: 'District Authority directed site inspection for Amberpet civil works.',
        type: 'INSPECTION',
        read: false,
        readBy: [],
        createdAt: '2025-01-18T11:20:00Z',
        link: '/inspections'
      },
      {
        id: 'NOTIF-004',
        targetRole: 'ALL',
        title: 'Statutory MoSPI Circular 2025',
        message: 'Mandatory geofence coordinates audit and revised quarterly utilization certificates issued.',
        type: 'SYSTEM',
        read: false,
        readBy: [],
        createdAt: '2025-01-20T10:00:00Z',
        link: '/guidelines'
      }
    ];

export const initialVendors: any[] = [
      {
        id: 'VEND-001',
        name: 'Deccan Infrastructure & Builders Ltd',
        panMasked: 'AABCD****F',
        gstinMasked: '36AABCD****F1Z5',
        activeProjectsCount: 3,
        totalSanctionedValue: 7200000,
        riskScore: 24,
        complianceRating: 'A',
        blacklisted: false
      },
      {
        id: 'VEND-002',
        name: 'Surya Green Power Enterprises',
        panMasked: 'AAGCS****E',
        gstinMasked: '36AAGCS****E1Z8',
        activeProjectsCount: 2,
        totalSanctionedValue: 4800000,
        riskScore: 12,
        complianceRating: 'A+',
        blacklisted: false
      },
      {
        id: 'VEND-003',
        name: 'Apex Healthinfra Corp',
        panMasked: 'AACAQ****T',
        gstinMasked: '36AACAQ****T1Z2',
        activeProjectsCount: 4,
        totalSanctionedValue: 12400000,
        riskScore: 68,
        complianceRating: 'B-',
        blacklisted: false
      }
    ];

export const initialAlerts: RiskAlert[] = [
      {
        id: 'ALT-101',
        projectId: 'PRJ-2024-001',
        projectCode: 'MPLADS-HYD-2024-001',
        projectTitle: 'Construction of Multipurpose Community Hall at Amberpet',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'TSUDA - Hyderabad Zone',
        alertType: 'Cost Anomaly',
        riskLevel: 'HIGH',
        reason: 'Project cost (₹48.0L) is 113% higher than standard category benchmark (₹18-25L) for identical plinth area.',
        technicalDetails: 'Standard CPWD Schedule of Rates plinth rate is ₹2,200/sqft. Billed rate indicates ₹4,700/sqft.',
        createdAt: '2024-03-05T10:00:00Z',
        status: 'Under Review',
        assignedOfficer: 'Dr. Ananya Sharma, IAS'
      },
      {
        id: 'ALT-102',
        projectId: 'PRJ-2024-002',
        projectCode: 'MPLADS-HYD-2024-002',
        projectTitle: 'Community Welfare Center & Library at Amberpet Ward-12',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'TSUDA - Hyderabad Zone',
        alertType: 'Possible Duplicate',
        riskLevel: 'HIGH',
        reason: 'High spatial and functional proximity to sanctioned Project PRJ-2024-001. Distance: 430m, Similarity: 87%.',
        technicalDetails: 'Both assets serve identical Ward 14 catchment. Recommendation dates are separated by 85 days.',
        createdAt: '2024-05-18T14:30:00Z',
        status: 'New',
        assignedOfficer: 'District Planning Officer'
      },
      {
        id: 'ALT-103',
        projectId: 'PRJ-2024-004',
        projectCode: 'MPLADS-HYD-2024-004',
        projectTitle: 'Purified RO Drinking Water Treatment Plant at Sanathnagar',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'TSUDA - Hyderabad Zone',
        alertType: 'Photo Anomaly',
        riskLevel: 'HIGH',
        reason: 'Image perceptual hashing detected 94% visual overlap with archived project photo from 2022.',
        technicalDetails: 'Image hash matches PRJ-ARCHIVE-2022-881. EXIF original timestamp stripped.',
        createdAt: '2024-09-22T09:15:00Z',
        status: 'Escalated',
        assignedOfficer: 'Vigilance Officer, Hyderabad'
      },
      {
        id: 'ALT-104',
        projectId: 'PRJ-2024-005',
        projectCode: 'MPLADS-HYD-2024-005',
        projectTitle: 'Upgradation of Government Primary School into Model Smart School',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'PRED Secunderabad',
        alertType: 'Location Mismatch',
        riskLevel: 'HIGH',
        reason: 'Uploaded progress photo geotag is 8.4 km away from sanctioned project location coordinates.',
        technicalDetails: 'Target coordinates: 17.4411 N, 78.5015 E. EXIF photo coordinates: 17.5142 N, 78.4320 E (Quthbullapur).',
        createdAt: '2024-08-15T16:00:00Z',
        status: 'Under Review',
        assignedOfficer: 'Superintending Engineer PRED'
      },
      {
        id: 'ALT-105',
        projectId: 'PRJ-2024-006',
        projectCode: 'MPLADS-HYD-2024-006',
        projectTitle: 'Construction of Primary Health Sub-Centre at Bowenpally',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'TSUDA - Hyderabad Zone',
        alertType: 'Delay Risk',
        riskLevel: 'HIGH',
        reason: 'Project overdue by 105 days with only 35% physical completion. Delay probability calculated at 92%.',
        technicalDetails: 'Execution velocity is 2.4%/month. At current run-rate, completion projected for November 2026.',
        createdAt: '2024-11-20T11:45:00Z',
        status: 'New',
        assignedOfficer: 'District Planning Officer'
      },
      {
        id: 'ALT-106',
        projectId: 'PRJ-2024-016',
        projectCode: 'MPLADS-HYD-2024-016',
        projectTitle: 'Construction of Over-Head Water Reservoir (OHSR) at Medchal Borders',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'TSUDA - Hyderabad Zone',
        alertType: 'High Risk',
        riskLevel: 'CRITICAL',
        reason: 'Severe milestone stall and vendor capacity saturation. Contractor managing 5 active works simultaneously.',
        technicalDetails: 'Cumulative risk index calculated at 74/100.',
        createdAt: '2025-01-10T12:00:00Z',
        status: 'Under Review',
        assignedOfficer: 'Dr. Ananya Sharma, IAS'
      }
    ];

export const initialCitizenFeedback: CitizenFeedback[] = [
      {
        id: 'FB-001',
        projectId: 'PRJ-2024-001',
        projectTitle: 'Construction of Multipurpose Community Hall at Amberpet',
        projectCode: 'MPLADS-HYD-2024-001',
        district: 'Hyderabad',
        citizenName: 'K. Venkateshwar Rao',
        citizenContactMasked: '+91 98480*****',
        issueType: 'Incomplete Work',
        description: 'Civil construction has been completely halted for the past 2 months. Building material is lying exposed in rain.',
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=60',
        latitude: 17.3984,
        longitude: 78.5202,
        submittedAt: '2025-01-14T11:20:00Z',
        status: 'Under Review',
        adminNotes: 'Field Engineer directed to inspect reason for work stoppage.'
      },
      {
        id: 'FB-002',
        projectId: 'PRJ-2024-003',
        projectTitle: 'Installation of 50 Solar LED High-Mast Street Lights at Musheerabad',
        projectCode: 'MPLADS-HYD-2024-003',
        district: 'Hyderabad',
        citizenName: 'Syed Moizuddin',
        citizenContactMasked: '+91 99890*****',
        issueType: 'Damaged Asset',
        description: 'Two solar street lights near Bholakpur crossroads are flickering after recent heavy winds.',
        submittedAt: '2025-02-02T16:40:00Z',
        status: 'Verified',
        adminNotes: 'Vendor Surya Green Power dispatched maintenance electrician.'
      }
    ];

export const initialAuditLogs: AuditLogEntry[] = [
      {
        id: 'LOG-001',
        userId: 'MP001',
        userName: 'Shri Rajesh Kumar (MP)',
        userRole: 'MP',
        action: 'SUBMIT_RECOMMENDATION',
        targetEntity: 'Project',
        targetId: 'PRJ-2024-019',
        timestamp: '2024-08-01T10:00:00Z',
        previousValue: 'None',
        newValue: 'Recommended: Pediatric Dialysis Unit (₹65.0 Lakh)',
        ipAddressMasked: '10.24.18.***'
      },
      {
        id: 'LOG-002',
        userId: 'ADMIN001',
        userName: 'Dr. Ananya Sharma, IAS (DM)',
        userRole: 'ADMIN',
        action: 'SANCTION_PROJECT',
        targetEntity: 'Project',
        targetId: 'PRJ-2024-020',
        timestamp: '2024-07-28T15:30:00Z',
        previousValue: 'Status: Recommended',
        newValue: 'Status: Sanctioned (Amount: ₹36,00,000)',
        ipAddressMasked: '10.14.02.***'
      },
      {
        id: 'LOG-003',
        userId: 'AGENCY001',
        userName: 'TSUDA - Hyderabad Zone',
        userRole: 'AGENCY',
        action: 'UPDATE_PROGRESS',
        targetEntity: 'Project',
        targetId: 'PRJ-2024-001',
        timestamp: '2024-09-12T14:20:00Z',
        previousValue: 'Completion: 45%',
        newValue: 'Completion: 55%',
        ipAddressMasked: '10.50.88.***'
      },
      {
        id: 'LOG-004',
        userId: 'ADMIN001',
        userName: 'Dr. Ananya Sharma, IAS (DM)',
        userRole: 'ADMIN',
        action: 'ALERT_STATUS_UPDATE',
        targetEntity: 'RiskAlert',
        targetId: 'ALT-101',
        timestamp: '2024-10-01T09:40:00Z',
        previousValue: 'Status: New',
        newValue: 'Status: Under Review (Cost inquiry initiated)',
        ipAddressMasked: '10.14.02.***'
      }
    ];
