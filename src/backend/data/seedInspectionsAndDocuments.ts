import { ProjectInspection, ProjectDocument, SystemNotification } from '../../types/index.ts';

export const INITIAL_INSPECTIONS: ProjectInspection[] = [
  {
    id: 'insp_001',
    projectId: 'proj_001',
    workId: 'MPLADS/2023-24/TS/KRM/0101',
    projectTitle: 'Construction of 50,000 Ltr Over-Head Water Tank & Distribution Lines',
    district: 'Karimnagar',
    state: 'Telangana',
    inspectingOfficer: 'Shri V. R. Madhav, Superintending Engineer (PR)',
    officerDesignation: 'District Quality Control Monitor',
    scheduledDate: '2024-02-10',
    inspectionDate: '2024-02-12',
    status: 'Completed',
    result: 'Satisfactory',
    checklist: [
      { item: 'Site location verification against approved DPR geo-coordinates', status: 'Pass', notes: 'Coordinates match within 45m buffer' },
      { item: 'Foundation depth and RCC column curing quality', status: 'Pass', notes: 'M25 grade concrete cube test passed' },
      { item: 'Material quality (Cement, Fe500 TMT Steel, Sand)', status: 'Pass', notes: 'Test certificates verified on site' },
      { item: 'Safety barricading and worker PPE compliance', status: 'Pass', notes: 'Adequate scaffolding and safety nets present' },
      { item: 'Measurement Book (MB) physical entries alignment', status: 'Pass', notes: 'Stage payment 2 matches physical execution' }
    ],
    observations: 'RCC staging completed to 12m height. Tank shell casting is structurally sound without honeycombing. Distribution line trenching is in progress.',
    recommendations: 'Permit release of 3rd installment upon hydrostatic testing of the overhead tank.',
    complianceNotes: 'Agency advised to restore trench excavations along village internal lanes within 7 days.',
    photos: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800'
    ],
    recordedAt: '2024-02-12T16:30:00Z'
  },
  {
    id: 'insp_002',
    projectId: 'proj_002',
    workId: 'MPLADS/2023-24/TS/KRM/0102',
    projectTitle: 'Upgradation & Black-Topping of 1.8km Rural Arterial Road from Choppadandi to Kondapur',
    district: 'Karimnagar',
    state: 'Telangana',
    inspectingOfficer: 'Dr. Anand K. Verma, IAS',
    officerDesignation: 'District Magistrate & District Authority',
    scheduledDate: '2024-03-22',
    inspectionDate: '2024-03-24',
    status: 'Completed',
    result: 'Major Issues',
    checklist: [
      { item: 'Site location verification against approved DPR geo-coordinates', status: 'Pass', notes: 'Alignment matches approved route' },
      { item: 'Sub-base WBM compaction and gravel grading', status: 'Fail', notes: 'Loose gravel dumped without rolling or water compaction' },
      { item: 'Bituminous carpet layer execution', status: 'Fail', notes: 'Bitumen layering not initiated despite 60% funds drawn' },
      { item: 'Camber and roadside drainage provision', status: 'Fail', notes: 'Side earthen drains completely missing, causing waterlogging' },
      { item: 'Safety barricading and citizen cautionary signages', status: 'Partial', notes: 'Minimal signage erected' }
    ],
    observations: 'Field verification confirmed citizen grievance. Contractor dumped coarse metal gravel 4 months ago and demobilized equipment. High financial expenditure (₹52 Lakhs) is inconsistent with physical road quality.',
    recommendations: 'Withhold further installment payments. Issue show-cause notice to contractor and Executive Engineer PWD. Demand time-bound blacktopping within 21 days.',
    complianceNotes: 'Notice issued under Section 3.12 of MPLADS Guidelines.',
    photos: [
      'https://images.unsplash.com/photo-1584463699039-444738596644?w=800'
    ],
    recordedAt: '2024-03-24T18:00:00Z'
  },
  {
    id: 'insp_003',
    projectId: 'proj_005',
    workId: 'MPLADS/2023-24/TS/KRM/0105',
    projectTitle: 'Installation of Solar Powered Mini Water Supply Pumpsets across 6 Thandas',
    district: 'Karimnagar',
    state: 'Telangana',
    inspectingOfficer: 'Shri T. Ramesh, Deputy Executive Engineer (Vigilance)',
    officerDesignation: 'Special Vigilance Cell Officer',
    scheduledDate: '2024-04-06',
    inspectionDate: '2024-04-07',
    status: 'Completed',
    result: 'Critical Issues',
    checklist: [
      { item: 'Site location verification against approved DPR geo-coordinates', status: 'Fail', notes: 'Registered GPS coordinates point to vacant field 3.4km away' },
      { item: 'Solar PV modules and dual-axis tracking structure', status: 'Fail', notes: 'No solar panels or inverter structure installed' },
      { item: 'Submersible motor pump and borewell piping', status: 'Fail', notes: 'Only old non-functional handpump found at site' },
      { item: 'Overhead Sintex storage tank and tap stands', status: 'Fail', notes: 'Asset completely absent on ground' }
    ],
    observations: 'CRITICAL INTEGRITY FAILURE. The uploaded inspection photo was digitally tampered and taken 3.4km away from the registered site. Zero infrastructure exists at Ramachandrapur Thanda.',
    recommendations: 'Immediate registration of Vigilance Inquiry. Recovery of ₹24.0 Lakhs disbursed funds. Blacklisting proceedings against vendor GreenSolar Urja Solutions.',
    complianceNotes: 'FIR recommendation forwarded to District Collector.',
    photos: [
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800'
    ],
    recordedAt: '2024-04-07T14:15:00Z'
  },
  {
    id: 'insp_004',
    projectId: 'proj_008',
    workId: 'MPLADS/2022-23/MH/PUN/0301',
    projectTitle: 'Construction of Sub-District Trauma Care Center Extension Wing at Baramati',
    district: 'Pune',
    state: 'Maharashtra',
    inspectingOfficer: 'Dr. S. K. Kulkarni, Civil Surgeon & Medical Inspector',
    officerDesignation: 'State Health Quality Monitor',
    scheduledDate: '2024-02-18',
    inspectionDate: '2024-02-20',
    status: 'Completed',
    result: 'Major Issues',
    checklist: [
      { item: 'Physical civil construction progress', status: 'Partial', notes: 'Brickwork stalled at 62%, roof slab shuttering abandoned' },
      { item: 'Medical gas pipeline installation', status: 'Fail', notes: 'Conduiting not started' },
      { item: 'Adherence to timeline', status: 'Fail', notes: 'Delayed by 340+ days beyond target completion date' }
    ],
    observations: 'Work is currently at a standstill due to contractual dispute between the executing agency and sub-contractor. Material lying exposed to weather.',
    recommendations: 'Enforce liquidated damages clause and issue 14-day notice for contract termination if work is not resumed.',
    photos: [],
    recordedAt: '2024-02-20T17:00:00Z'
  },
  {
    id: 'insp_005',
    projectId: 'proj_006',
    workId: 'MPLADS/2023-24/UP/VAR/0201',
    projectTitle: 'Establishment of 12 Smart Digital Classrooms in Government Composite Schools',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    inspectingOfficer: 'Basic Shiksha Adhikari (BSA), Varanasi',
    officerDesignation: 'District Education Officer',
    scheduledDate: '2024-01-08',
    inspectionDate: '2024-01-10',
    status: 'Completed',
    result: 'Satisfactory',
    checklist: [
      { item: 'Interactive 75-inch touch panels functionality', status: 'Pass', notes: 'All 12 panels verified with NCERT e-content' },
      { item: 'Dedicated 3kVA online UPS with 2-hour battery backup', status: 'Pass', notes: 'Installed and tested during power cut' },
      { item: 'Teacher training and user sign-off', status: 'Pass', notes: '36 teachers completed 3-day digital pedagogy training' },
      { item: 'Asset stock entry and physical tagging', status: 'Pass', notes: 'Unique QR asset tags affixed on each smartboard' }
    ],
    observations: 'Exemplary project execution. Smart classrooms are fully utilized during daily school periods. High student enthusiasm noted.',
    recommendations: 'Project completed successfully; approve final handover certificate.',
    photos: [
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800'
    ],
    recordedAt: '2024-01-10T16:00:00Z'
  }
];

export const INITIAL_DOCUMENTS: ProjectDocument[] = [
  // Gangadhara Water Tank (proj_001)
  {
    id: 'doc_001_1',
    projectId: 'proj_001',
    workId: 'MPLADS/2023-24/TS/KRM/0101',
    documentType: 'Administrative Approval',
    title: 'Administrative Approval Order by District Collector',
    fileUrl: '/documents/AA_KRM_2023_0101.pdf',
    fileName: 'AA_KRM_2023_0101.pdf',
    fileSize: '1.4 MB',
    uploadedBy: 'ADMIN001',
    uploadedRole: 'admin',
    uploadedAt: '2023-07-10T10:00:00Z',
    verificationStatus: 'Verified',
    verifiedBy: 'ADMIN001',
    verifiedAt: '2023-07-10T10:00:00Z',
    notes: 'Approved under MPLADS Guidelines 2010 Section 2.4.'
  },
  {
    id: 'doc_001_2',
    projectId: 'proj_001',
    workId: 'MPLADS/2023-24/TS/KRM/0101',
    documentType: 'Technical Approval',
    title: 'Technical Sanction & Structural Vetting Report',
    fileUrl: '/documents/TS_PWD_KRM_0101.pdf',
    fileName: 'TS_PWD_KRM_0101.pdf',
    fileSize: '3.8 MB',
    uploadedBy: 'AGENCY001',
    uploadedRole: 'agency',
    uploadedAt: '2023-08-05T14:30:00Z',
    verificationStatus: 'Verified',
    verifiedBy: 'ADMIN001',
    verifiedAt: '2023-08-08T11:00:00Z',
    notes: 'Structural safety vetted by Govt Engineering College.'
  },
  {
    id: 'doc_001_3',
    projectId: 'proj_001',
    workId: 'MPLADS/2023-24/TS/KRM/0101',
    documentType: 'Sanction Order',
    title: 'Formal Financial Sanction Order (₹34.50 Lakhs)',
    fileUrl: '/documents/Sanction_Order_KRM_0101.pdf',
    fileName: 'Sanction_Order_KRM_0101.pdf',
    fileSize: '890 KB',
    uploadedBy: 'ADMIN001',
    uploadedRole: 'admin',
    uploadedAt: '2023-08-20T10:00:00Z',
    verificationStatus: 'Verified',
    verifiedBy: 'ADMIN001',
    verifiedAt: '2023-08-20T10:00:00Z'
  },
  {
    id: 'doc_001_4',
    projectId: 'proj_001',
    workId: 'MPLADS/2023-24/TS/KRM/0101',
    documentType: 'Work Order',
    title: 'Contract Agreement & Work Order to Sri Balaji Civil Infra',
    fileUrl: '/documents/WO_AG_PWD_0101.pdf',
    fileName: 'WO_AG_PWD_0101.pdf',
    fileSize: '2.1 MB',
    uploadedBy: 'AGENCY001',
    uploadedRole: 'agency',
    uploadedAt: '2023-09-05T15:00:00Z',
    verificationStatus: 'Verified'
  },
  {
    id: 'doc_001_5',
    projectId: 'proj_001',
    workId: 'MPLADS/2023-24/TS/KRM/0101',
    documentType: 'Utilization Certificate',
    title: 'Form GFR 12-C Utilization Certificate (Installments 1 & 2)',
    fileUrl: '/documents/UC_KRM_0101_Inst1_2.pdf',
    fileName: 'UC_KRM_0101_Inst1_2.pdf',
    fileSize: '1.1 MB',
    uploadedBy: 'AGENCY001',
    uploadedRole: 'agency',
    uploadedAt: '2024-02-15T12:00:00Z',
    verificationStatus: 'Verified',
    verifiedBy: 'ADMIN001',
    verifiedAt: '2024-02-16T10:00:00Z',
    notes: 'Countersigned by Divisional Accounts Officer.'
  },

  // Choppadandi Road (proj_002) - Missing UC & Anomaly
  {
    id: 'doc_002_1',
    projectId: 'proj_002',
    workId: 'MPLADS/2023-24/TS/KRM/0102',
    documentType: 'Administrative Approval',
    title: 'Administrative Approval Order (Road Upgradation)',
    fileUrl: '/documents/AA_KRM_0102.pdf',
    fileName: 'AA_KRM_0102.pdf',
    fileSize: '1.2 MB',
    uploadedBy: 'ADMIN001',
    uploadedRole: 'admin',
    uploadedAt: '2023-08-10T10:00:00Z',
    verificationStatus: 'Verified'
  },
  {
    id: 'doc_002_2',
    projectId: 'proj_002',
    workId: 'MPLADS/2023-24/TS/KRM/0102',
    documentType: 'Sanction Order',
    title: 'Sanction Order (₹88.00 Lakhs)',
    fileUrl: '/documents/Sanction_0102.pdf',
    fileName: 'Sanction_0102.pdf',
    fileSize: '950 KB',
    uploadedBy: 'ADMIN001',
    uploadedRole: 'admin',
    uploadedAt: '2023-09-01T10:00:00Z',
    verificationStatus: 'Verified'
  },
  {
    id: 'doc_002_3',
    projectId: 'proj_002',
    workId: 'MPLADS/2023-24/TS/KRM/0102',
    documentType: 'Inspection Report',
    title: 'Vigilance Inspection Report on Sub-base Non-compliance',
    fileUrl: '/documents/IR_Vigilance_0102.pdf',
    fileName: 'IR_Vigilance_0102.pdf',
    fileSize: '2.4 MB',
    uploadedBy: 'ADMIN001',
    uploadedRole: 'admin',
    uploadedAt: '2024-03-24T18:30:00Z',
    verificationStatus: 'Flagged',
    notes: 'Flagged: Major defects in gravel compaction; bitumen missing.'
  },

  // Smart Classrooms Varanasi (proj_006) - Completed
  {
    id: 'doc_006_1',
    projectId: 'proj_006',
    workId: 'MPLADS/2023-24/UP/VAR/0201',
    documentType: 'Completion Certificate',
    title: 'Joint Inspection & Asset Handover Completion Certificate',
    fileUrl: '/documents/CC_VAR_0201.pdf',
    fileName: 'CC_VAR_0201.pdf',
    fileSize: '1.8 MB',
    uploadedBy: 'ADMIN001',
    uploadedRole: 'admin',
    uploadedAt: '2024-01-12T14:00:00Z',
    verificationStatus: 'Verified'
  },
  {
    id: 'doc_006_2',
    projectId: 'proj_006',
    workId: 'MPLADS/2023-24/UP/VAR/0201',
    documentType: 'Utilization Certificate',
    title: 'Final 100% Fund Utilization Certificate (₹42.50 Lakhs)',
    fileUrl: '/documents/UC_Final_VAR_0201.pdf',
    fileName: 'UC_Final_VAR_0201.pdf',
    fileSize: '920 KB',
    uploadedBy: 'AGENCY001',
    uploadedRole: 'agency',
    uploadedAt: '2024-01-20T11:00:00Z',
    verificationStatus: 'Verified'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif_001',
    title: 'High-Risk Integrity Alert: Location Mismatch Flagged',
    message: 'Work ID MPLADS/2023-24/TS/KRM/0105 failed photo geo-verification. EXIF coordinates are 3.4km away from registered site.',
    type: 'photo_failure',
    priority: 'high',
    projectId: 'proj_005',
    workId: 'MPLADS/2023-24/TS/KRM/0105',
    isRead: false,
    timestamp: '2024-04-02T11:46:00Z'
  },
  {
    id: 'notif_002',
    title: 'Severe Financial Discrepancy Detected',
    message: 'Work ID MPLADS/2023-24/TS/KRM/0102 has recorded 60% expenditure (₹52.8L) with only 38% physical road progress.',
    type: 'financial_anomaly',
    priority: 'high',
    projectId: 'proj_002',
    workId: 'MPLADS/2023-24/TS/KRM/0102',
    isRead: false,
    timestamp: '2024-03-24T18:05:00Z'
  },
  {
    id: 'notif_003',
    title: 'Citizen Grievance Assigned for Field Inquiry',
    message: 'New grievance MPLADS-GRV-2024-001001 filed by K. Venkateshwar Rao regarding unrolled gravel and incomplete tarring.',
    type: 'grievance',
    priority: 'medium',
    projectId: 'proj_002',
    workId: 'MPLADS/2023-24/TS/KRM/0102',
    isRead: false,
    timestamp: '2024-03-20T09:20:00Z'
  },
  {
    id: 'notif_004',
    title: 'Critical Project Overdue by 340+ Days',
    message: 'Baramati Trauma Care Center (MPLADS/2022-23/MH/PUN/0301) overdue past sanctioned completion deadline. Show-cause issued.',
    type: 'delay',
    priority: 'high',
    projectId: 'proj_008',
    workId: 'MPLADS/2022-23/MH/PUN/0301',
    isRead: true,
    timestamp: '2024-02-10T11:15:00Z'
  },
  {
    id: 'notif_005',
    title: 'Site Inspection Report Submitted with Satisfactory Rating',
    message: 'Gangadhara RCC Water Tank (MPLADS/2023-24/TS/KRM/0101) passed stage 2 quality check. Release of 3rd installment approved.',
    type: 'inspection_due',
    priority: 'info',
    projectId: 'proj_001',
    workId: 'MPLADS/2023-24/TS/KRM/0101',
    isRead: true,
    timestamp: '2024-02-12T16:45:00Z'
  }
];
