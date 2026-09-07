import {
  Project,
  RiskAlert,
  CitizenFeedback,
  AuditLogEntry,
  User,
} from '../types/index.js';

// Demo-only browser seed data. It intentionally contains synthetic records.
export const demoUsers: (User & { passwordHash: string })[] = [
  { id: 'demo-super', userId: 'SUPER001', passwordHash: 'Super@123', name: 'Demo Central Vigilance Officer', role: 'SUPER_ADMIN', designation: 'Demo Administrator', district: 'New Delhi', state: 'Delhi' },
  { id: 'demo-ministry', userId: 'MINISTRY001', passwordHash: 'Ministry@123', name: 'Demo Ministry Officer', role: 'MINISTRY', designation: 'Demo Ministry Officer', district: 'New Delhi', state: 'National' },
  { id: 'demo-state', userId: 'STATE001', passwordHash: 'State@123', name: 'Demo State Nodal Officer', role: 'STATE_NODAL', designation: 'Demo State Nodal Officer', district: 'Hyderabad', state: 'Telangana' },
  { id: 'demo-admin', userId: 'ADMIN001', passwordHash: 'Admin@123', name: 'Demo District Administrator', role: 'ADMIN', designation: 'Demo District Authority', district: 'Hyderabad', state: 'Telangana' },
  { id: 'demo-mp', userId: 'MP001', passwordHash: 'MP@123', name: 'Demo Member of Parliament', role: 'MP', designation: 'Demo MP', constituency: 'Hyderabad North', district: 'Hyderabad', state: 'Telangana' },
  { id: 'demo-agency', userId: 'AGENCY001', passwordHash: 'Agency@123', name: 'Demo Implementing Agency', role: 'AGENCY', designation: 'Demo Executive Officer', agencyId: 'AGENCY001', agencyName: 'Demo Implementing Agency', district: 'Hyderabad', state: 'Telangana' },
  { id: 'demo-viewer', userId: 'VIEWER001', passwordHash: 'Viewer@123', name: 'Demo Public Auditor', role: 'VIEWER', designation: 'Demo Public Viewer', district: 'Hyderabad', state: 'Telangana' },
];

export const demoProjects: Project[] =  [
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
    estimatedCost: 4800000,
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
      disclaimer: 'Notice: Risk score is an advisory algorithmic indicator generated for administrative review.'
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
    longitude: 78.5235,
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
      duplicateProbability: 87,
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
      photoAnomalyScore: 92,
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
      locationMismatch: true,
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
        latitude: 17.5142,
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
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
    district: 'Hyderabad',
    state: 'Telangana',
    locationAddress: 'Old Bowenpally, Near Market Yard, Secunderabad, Hyderabad',
    latitude: 17.4764,
    longitude: 78.4862,
    estimatedCost: 3800000,
    sanctionedAmount: 3800000,
    fundsUtilized: 1140000,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
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
      delayProbability: 92,
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
    mpId: 'MP001',
    mpName: 'Shri Rajesh Kumar',
    constituency: 'Hyderabad North',
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
  }
];

export const demoAlerts: RiskAlert[] =  [
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
    assignedOfficer: 'Dr. Ananya Sharma, IAS',
    notificationDispatched: true,
    notificationChannels: ['EMAIL', 'SMS']
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
    assignedOfficer: 'District Planning Officer',
    notificationDispatched: true,
    notificationChannels: ['EMAIL']
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
    assignedOfficer: 'Vigilance Officer, Hyderabad',
    notificationDispatched: true,
    notificationChannels: ['EMAIL', 'PUSH']
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
  }
];

export const demoFeedback: CitizenFeedback[] =  [
  {
    id: 'FB-001',
    trackingNumber: 'MPLADS-GRV-2025-DIST-001',
    projectId: 'PRJ-2024-001',
    projectTitle: 'Construction of Multipurpose Community Hall at Amberpet',
    projectCode: 'MPLADS-HYD-2024-001',
    district: 'Hyderabad',
    state: 'Telangana',
    citizenName: 'K. Venkateshwar Rao',
    citizenContactMasked: '+91 98480*****',
    issueType: 'Incomplete Work',
    description: 'Civil construction has been completely halted for the past 2 months. Building material is lying exposed in rain.',
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=60',
    latitude: 17.3984,
    longitude: 78.5202,
    submittedAt: '2025-01-14T11:20:00Z',
    status: 'Under Review',
    routedQueue: 'DISTRICT_QUEUE',
    priorityLevel: 'NORMAL',
    slaDeadlineDays: 15,
    adminNotes: 'Field Engineer directed to inspect reason for work stoppage.'
  },
  {
    id: 'FB-002',
    trackingNumber: 'MPLADS-GRV-2025-DIST-002',
    projectId: 'PRJ-2024-003',
    projectTitle: 'Installation of 50 Solar LED High-Mast Street Lights at Musheerabad',
    projectCode: 'MPLADS-HYD-2024-003',
    district: 'Hyderabad',
    state: 'Telangana',
    citizenName: 'Syed Moizuddin',
    citizenContactMasked: '+91 99890*****',
    issueType: 'Damaged Asset',
    description: 'Two solar street lights near Bholakpur crossroads are flickering after recent heavy winds.',
    submittedAt: '2025-02-02T16:40:00Z',
    status: 'Verified',
    routedQueue: 'DISTRICT_QUEUE',
    priorityLevel: 'NORMAL',
    slaDeadlineDays: 15,
    adminNotes: 'Vendor Surya Green Power dispatched maintenance electrician.'
  },
  {
    id: 'FB-003',
    trackingNumber: 'MPLADS-GRV-2025-MIN-001',
    projectId: 'PRJ-2024-004',
    projectTitle: 'Purified RO Drinking Water Treatment Plant at Sanathnagar',
    projectCode: 'MPLADS-HYD-2024-004',
    district: 'Hyderabad',
    state: 'Telangana',
    citizenName: 'S. Ramachandra Murthy',
    citizenContactMasked: '+91 94401*****',
    issueType: 'Suspected Financial Misappropriation / Incomplete Work',
    description: 'Borewell pump house is claimed as completed and funds billed, but no water filtration membrane or electricity connection exists on site. Ghost asset suspected.',
    submittedAt: '2025-02-18T09:30:00Z',
    status: 'Under Review',
    routedQueue: 'MINISTRY_VIGILANCE_QUEUE',
    priorityLevel: 'VIGILANCE_URGENT',
    slaDeadlineDays: 7,
    adminNotes: 'Escalated to Ministry Vigilance & Joint Collector for physical forensic audit.'
  }
];

export const demoAuditLogs: AuditLogEntry[] =  [
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
    ipAddressMasked: '10.24.18.***',
    prevHash: 'GENESIS_MPLADS_AUDIT_BLOCK_000000',
    entryHash: sha256Hex('GENESIS_MPLADS_AUDIT_BLOCK_000000|LOG-001|2024-08-01T10:00:00Z|MP001|MP|SUBMIT_RECOMMENDATION|Project|PRJ-2024-019|None|Recommended: Pediatric Dialysis Unit (₹65.0 Lakh)|10.24.18.***')
  },
  {
    id: 'LOG-002',
    userId: 'ADMIN001',
    userName: 'Dr. Ananya Sharma, IAS (DM)',
    userRole: 'ADMIN',
    action: 'SANCTION_PROJECT',
    targetEntity: 'Project',
    targetId: 'PRJ-2024-001',
    timestamp: '2024-02-10T15:30:00Z',
    previousValue: 'Status: Recommended',
    newValue: 'Status: Sanctioned (Amount: ₹48,00,000)',
    ipAddressMasked: '10.14.02.***',
    prevHash: 'GENESIS_MPLADS_AUDIT_BLOCK_000000',
    entryHash: sha256Hex('GENESIS_MPLADS_AUDIT_BLOCK_000000|LOG-002|2024-02-10T15:30:00Z|ADMIN001|ADMIN|SANCTION_PROJECT|Project|PRJ-2024-001|Status: Recommended|Status: Sanctioned (Amount: ₹48,00,000)|10.14.02.***')
  }
];
