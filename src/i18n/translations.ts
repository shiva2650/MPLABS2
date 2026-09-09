export type Language = 'en' | 'hi';

export interface TranslationDictionary {
  // Brand / Portal
  portalName: string;
  portalTagline: string;
  govIndia: string;
  mospiTitle: string;
  mpladsFullName: string;
  officialBadge: string;
  nicGov: string;
  footerCompliance: string;

  // Navigation Tabs & Headers
  home: string;
  projects: string;
  funds: string;
  alerts: string;
  verification: string;
  reports: string;
  feedback: string;
  gisMap: string;
  recommendWork: string;
  agencyBilling: string;
  contractorDirectory: string;
  contractorGraph: string;
  auditTrail: string;
  dataIngestion: string;
  help: string;
  officerLogin: string;
  publicView: string;
  citizenPortal: string;
  signOut: string;
  authenticatedOfficial: string;
  roleAuthority: string;
  districtJurisdiction: string;
  officialSessionActive: string;
  officerOperations: string;
  mappingLocation: string;
  restrictedTools: string;
  activeOfficerSession: string;
  returnToHome: string;
  switchToOfficer: string;
  publicCitizenModeActive: string;

  // Common UI Actions & Words
  search: string;
  filter: string;
  reset: string;
  clearFilters: string;
  export: string;
  exportCsv: string;
  exportExcel: string;
  printReport: string;
  loading: string;
  saving: string;
  submitting: string;
  save: string;
  cancel: string;
  close: string;
  submit: string;
  update: string;
  confirm: string;
  delete: string;
  viewDetails: string;
  backTo: string;
  backToOverview: string;
  backToDashboard: string;
  all: string;
  noData: string;
  actions: string;
  status: string;
  progress: string;
  date: string;
  category: string;
  district: string;
  state: string;
  constituency: string;
  mpName: string;
  agency: string;
  vendor: string;
  estimatedCost: string;
  sanctionedAmount: string;
  fundsUtilized: string;
  riskLevel: string;
  riskScore: string;
  requiredField: string;
  invalidValue: string;
  saveSuccess: string;
  saveFailed: string;
  official: string;
  whatDoesThisMean: string;
  plainGuidance: string;
  clickToExplain: string;
  previous: string;
  next: string;
  showingResults: string;
  pageOf: string;
  total: string;
  srNo: string;

  // Dashboard Specific
  totalProjects: string;
  completedProjects: string;
  activeProjects: string;
  delayedProjects: string;
  underReviewProjects: string;
  recommendedProjects: string;
  highRiskWorks: string;
  sanctionedAllocation: string;
  expenditureVeracity: string;
  utilizationRate: string;
  worksRequiringAttention: string;
  recentAlerts: string;
  noPendingAlerts: string;
  reviewAlerts: string;
  constituencyTrend: string;
  integrityVectors: string;
  interactiveMapView: string;
  recommendNewWork: string;
  citizenViewTag: string;
  officerConsoleTag: string;
  dashboardSubheading: string;
  mpOverviewTitle: string;
  adminOverviewTitle: string;
  agencyOverviewTitle: string;
  publicOverviewTitle: string;

  // Projects Specific
  projectsPageTitle: string;
  projectsPageSubtitle: string;
  searchProjectsPlaceholder: string;
  allCategories: string;
  allDistricts: string;
  allStatuses: string;
  allRiskLevels: string;
  sortBy: string;
  sortRisk: string;
  sortCost: string;
  sortProgress: string;
  sortCode: string;
  projectDetails: string;
  tabOverview: string;
  tabAiRisk: string;
  tabPhotos: string;
  tabFinancials: string;
  tabDocuments: string;
  tabAuditReport: string;
  noProjectsFound: string;
  physicalProgress: string;
  completionPercentage: string;
  vendorAssigned: string;
  implementingAgency: string;
  sanctionDate: string;
  targetCompletion: string;
  actualCompletion: string;
  startDate: string;
  workId: string;
  locationAddress: string;

  // Financials & Funds Ledger
  fundsPageTitle: string;
  fundsPageSubtitle: string;
  annualEntitlement: string;
  perConstituency: string;
  sanctionedWorks: string;
  allocatedPct: string;
  disbursedUtilized: string;
  utilizedPct: string;
  uncommittedBalance: string;
  availableForSanction: string;
  transactionLedger: string;
  categoryBreakdown: string;
  installmentNo: string;
  disbursedOn: string;
  sanctionOrder: string;
  beneficiaryAgency: string;

  // Alerts & Vigilance Review
  alertsPageTitle: string;
  alertsPageSubtitle: string;
  pendingAdjudication: string;
  alertTypeLabel: string;
  reviewStatusLabel: string;
  takeAction: string;
  noAlertsFound: string;
  reasonFindings: string;
  technicalDetails: string;
  assignedOfficer: string;
  reviewNotes: string;
  actionModalTitle: string;
  actionResolve: string;
  actionEscalate: string;
  actionFalsePositive: string;
  actionNotesPlaceholder: string;

  // Evidence & Verification
  verificationPageTitle: string;
  verificationPageSubtitle: string;
  integrityIndex: string;
  tamperAnalysis: string;
  gpsGeofenceDistance: string;
  cameraMetadata: string;
  perceptualDuplicateHash: string;
  withinSite: string;
  locationMismatch: string;
  verifiedAuthentic: string;
  aiSynthesized: string;
  verified: string;
  underReview: string;
  flagged: string;
  sanctioned: string;
  utilized: string;

  // Reports
  reportsPageTitle: string;
  reportsPageSubtitle: string;
  generatePdf: string;
  downloadExcel: string;
  auditCompliance: string;
  constituencyPerformance: string;

  // Citizen Feedback & Ground Observations
  feedbackPageTitle: string;
  feedbackPageSubtitle: string;
  reportObservation: string;
  issueType: string;
  citizenName: string;
  citizenContact: string;
  description: string;
  selectProject: string;
  submitFeedback: string;
  feedbackSubmittedSuccess: string;
  publicGrievances: string;
  noFeedbackYet: string;

  // Citizen Chatbot
  chatbotTitle: string;
  chatbotGroundedBadge: string;
  chatbotSubheading: string;
  chatbotWelcomeMessage: string;
  chatbotInputPlaceholder: string;
  askMpladsAi: string;
  sendQuery: string;
  retrievingRecords: string;
  rateLimitNotice: string;
  chatbotDisclaimer: string;
  quickPrompt1: string;
  quickPrompt2: string;
  quickPrompt3: string;
  quickPrompt4: string;

  // Authentication & Login
  loginTitle: string;
  loginSubtitle: string;
  userIdLabel: string;
  passwordLabel: string;
  signInBtn: string;
  enterPublicPortal: string;
  backToSchemeHome: string;
  invalidCredentialsTitle: string;
  invalidCredentialsMsg: string;
  invalidCredentialsSug: string;
  serverUnreachableTitle: string;
  serverUnreachableMsg: string;
  serverUnreachableSug: string;
  authFailedTitle: string;
  authFailedSug: string;
  demoCredentialsHelp: string;
  mpLogin: string;
  adminLogin: string;
  agencyLogin: string;
  verifyingSession: string;

  // Notification Center
  notificationsTitle: string;
  unreadCountText: string;
  allCaughtUpText: string;
  markAllReadText: string;
  resetBaselineText: string;
  loadingNotificationsText: string;
  emptyNotificationsTitle: string;
  emptyNotificationsDesc: string;
  markAsReadText: string;
  viewProjectText: string;
  viewAlertText: string;

  // Landing Page Specific
  landingHeroTitle: string;
  landingHeroSubtitle: string;
  lokSabha: string;
  rajyaSabha: string;
  mpLedgerTab: string;
  worksListTab: string;
  searchLandingPlaceholder: string;
  advancedFilters: string;
  tenureLabel: string;
  sectorLabel: string;
  financialYearLabel: string;
  allocatedCrLabel: string;
  recommendedCrLabel: string;
  sanctionedCrLabel: string;
  utilizedCrLabel: string;
  worksRecommendedLabel: string;
  worksSanctionedLabel: string;
  worksCompletedLabel: string;
  viewWorksLabel: string;
  noMpsFound: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Brand / Portal
    portalName: 'MPLADS Transparency Portal',
    portalTagline: 'Members of Parliament Local Area Development Scheme',
    govIndia: 'Government of India',
    mospiTitle: 'Ministry of Statistics & Programme Implementation (MoSPI)',
    mpladsFullName: 'Members of Parliament Local Area Development Scheme (MPLADS) — Central plan scheme for local developmental assets',
    officialBadge: 'Official',
    nicGov: 'National Informatics Centre (NIC) • MoSPI, New Delhi',
    footerCompliance: 'Official Government Institutional Design • Compliant with MoSPI 2023 Guidelines & SIH Standards',

    // Navigation Tabs & Headers
    home: 'Home / Overview',
    projects: 'Projects',
    funds: 'Fund Tracking',
    alerts: 'Alerts & Reviews',
    verification: 'Verification Status',
    reports: 'Reports',
    feedback: 'Citizen Feedback',
    gisMap: 'Geographic GIS Map',
    recommendWork: 'Recommend Work',
    agencyBilling: 'Agency Billing Desk',
    contractorDirectory: 'Contractor Directory',
    contractorGraph: 'Contractor Link Graph',
    auditTrail: 'Ledger Audit Trail',
    dataIngestion: 'Data Ingestion & Impact',
    help: 'Help & Assistant',
    officerLogin: 'Officer Login',
    publicView: 'Citizen View',
    citizenPortal: 'Citizen Transparency Portal',
    signOut: 'Sign Out / Switch',
    authenticatedOfficial: 'Authenticated Official',
    roleAuthority: 'Role Authority',
    districtJurisdiction: 'District Jurisdiction',
    officialSessionActive: 'Official Session Active',
    officerOperations: 'Officer Operations',
    mappingLocation: 'Mapping & Location',
    restrictedTools: 'Restricted Forensic Tools',
    activeOfficerSession: 'Active Officer Session',
    returnToHome: 'Return to Scheme Portal Home',
    switchToOfficer: 'Switch to Officer Workspace',
    publicCitizenModeActive: 'Public Citizen Mode Active',

    // Common UI Actions & Words
    search: 'Search',
    filter: 'Filter',
    reset: 'Reset',
    clearFilters: 'Clear Filters',
    export: 'Export',
    exportCsv: 'Export to CSV',
    exportExcel: 'Export to Excel',
    printReport: 'Print Official Gazette Sheet',
    loading: 'Loading...',
    saving: 'Saving...',
    submitting: 'Submitting...',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    submit: 'Submit',
    update: 'Update',
    confirm: 'Confirm',
    delete: 'Delete',
    viewDetails: 'View Details',
    backTo: 'Back to',
    backToOverview: '← Back to Overview',
    backToDashboard: '← Back to Dashboard',
    all: 'All',
    noData: 'No records found',
    actions: 'Actions',
    status: 'Status',
    progress: 'Progress',
    date: 'Date',
    category: 'Category',
    district: 'District',
    state: 'State',
    constituency: 'Constituency',
    mpName: 'Member of Parliament',
    agency: 'Implementing Agency',
    vendor: 'Contractor / Vendor',
    estimatedCost: 'Estimated Cost',
    sanctionedAmount: 'Sanctioned Amount',
    fundsUtilized: 'Funds Utilized',
    riskLevel: 'Risk Level',
    riskScore: 'Integrity / Risk Index',
    requiredField: 'This field is required',
    invalidValue: 'Invalid value entered',
    saveSuccess: 'Successfully saved',
    saveFailed: 'Failed to save changes',
    official: 'Official',
    whatDoesThisMean: 'What does this mean?',
    plainGuidance: 'Plain language guidance',
    clickToExplain: 'Click to view explanation',
    previous: 'Previous',
    next: 'Next',
    showingResults: 'Showing {start} to {end} of {total} records',
    pageOf: 'Page {current} of {total}',
    total: 'Total',
    srNo: 'Sr No',

    // Dashboard Specific
    totalProjects: 'Total Works',
    completedProjects: 'Completed Works',
    activeProjects: 'Ongoing Works',
    delayedProjects: 'Delayed Works',
    underReviewProjects: 'Under Review',
    recommendedProjects: 'Recommended',
    highRiskWorks: 'Flagged for Inspection',
    sanctionedAllocation: 'Sanctioned Allocation',
    expenditureVeracity: 'Funds Utilized',
    utilizationRate: 'Utilization Rate',
    worksRequiringAttention: 'Works Requiring Attention',
    recentAlerts: 'Recent Alerts & Anomalies',
    noPendingAlerts: 'No pending anomalies detected across active jurisdiction',
    reviewAlerts: 'Review Alerts',
    constituencyTrend: 'Constituency Progress & Expenditure Trend',
    integrityVectors: 'Integrity & Compliance Vectors',
    interactiveMapView: 'Interactive Map View',
    recommendNewWork: 'Recommend New Work',
    citizenViewTag: 'Citizen Transparency View',
    officerConsoleTag: '{role} Console',
    dashboardSubheading: 'Public transparency tracking of sanctioned community infrastructure, expenditure veracity, and on-ground completion.',
    mpOverviewTitle: 'Constituency Development & Allocation Overview',
    adminOverviewTitle: 'District Authority Oversight & Verification Dashboard',
    agencyOverviewTitle: 'Implementing Agency Workdesk & Progress Log',
    publicOverviewTitle: 'MPLADS National Transparency & Project Oversight',

    // Projects Specific
    projectsPageTitle: 'Constituency Development Works Directory',
    projectsPageSubtitle: 'Official register of sanctioned and ongoing community assets under MPLADS',
    searchProjectsPlaceholder: 'Search by project code, title, address, vendor...',
    allCategories: 'All Categories',
    allDistricts: 'All Districts',
    allStatuses: 'All Statuses',
    allRiskLevels: 'All Risk Levels',
    sortBy: 'Sort By',
    sortRisk: 'Integrity Risk',
    sortCost: 'Sanctioned Cost',
    sortProgress: 'Physical Progress',
    sortCode: 'Project Code',
    projectDetails: 'Project Details',
    tabOverview: 'Overview & Specs',
    tabAiRisk: 'AI Integrity Analysis',
    tabPhotos: 'Ground Photos & EXIF',
    tabFinancials: 'Financial Disbursals',
    tabDocuments: 'Sanctions & Orders',
    tabAuditReport: 'Automated Audit Report',
    noProjectsFound: 'No matching projects found. Adjust your search query or filters.',
    physicalProgress: 'Physical Progress',
    completionPercentage: 'Completion',
    vendorAssigned: 'Contractor / Vendor',
    implementingAgency: 'Implementing Agency',
    sanctionDate: 'Sanction Date',
    targetCompletion: 'Target Completion',
    actualCompletion: 'Actual Completion',
    startDate: 'Commencement Date',
    workId: 'Work ID / Project Code',
    locationAddress: 'Location Address',

    // Financials & Funds Ledger
    fundsPageTitle: 'MPLADS Financial Ledger & Fund Disbursals',
    fundsPageSubtitle: 'Statutory annual entitlement tracking (₹5.00 Crore per fiscal year) under MoSPI Guidelines',
    annualEntitlement: 'Annual Entitlement',
    perConstituency: 'Per Parliamentary Constituency',
    sanctionedWorks: 'Sanctioned Works',
    allocatedPct: '{pct}% of annual cap allocated',
    disbursedUtilized: 'Disbursed & Utilized',
    utilizedPct: '{pct}% of sanctioned funds disbursed',
    uncommittedBalance: 'Uncommitted Balance',
    availableForSanction: 'Available for fresh recommendations',
    transactionLedger: 'Installment Disbursal Ledger',
    categoryBreakdown: 'Sectoral Fund Allocation',
    installmentNo: 'Installment #{no}',
    disbursedOn: 'Disbursed on {date}',
    sanctionOrder: 'Sanction Order: {order}',
    beneficiaryAgency: 'Beneficiary Agency',

    // Alerts & Vigilance Review
    alertsPageTitle: 'AI Alert Management & Vigilance Review Desk',
    alertsPageSubtitle: 'District Authority human adjudication queue for AI-detected discrepancies',
    pendingAdjudication: '{count} Pending Adjudication',
    alertTypeLabel: 'Alert Type:',
    reviewStatusLabel: 'Review Status:',
    takeAction: 'Take Adjudication Action',
    noAlertsFound: 'No alerts matching the selected filter criteria.',
    reasonFindings: 'Reason / Findings',
    technicalDetails: 'Technical Evidence',
    assignedOfficer: 'Assigned Officer',
    reviewNotes: 'Review Notes',
    actionModalTitle: 'Adjudicate Alert: {code}',
    actionResolve: 'Mark Resolved & Validate',
    actionEscalate: 'Escalate for Ground Inspection',
    actionFalsePositive: 'Mark as False Positive',
    actionNotesPlaceholder: 'Enter official reasoning and adjudication notes...',

    // Evidence & Verification
    verificationPageTitle: 'Cryptographic Evidence & Multi-Modal Verification',
    verificationPageSubtitle: 'Anti-tampering analysis: GPS geofencing, EXIF timestamp verification, and perceptual image hashing',
    integrityIndex: 'Evidence Integrity Index',
    tamperAnalysis: 'Error Level & Tamper Analysis',
    gpsGeofenceDistance: 'GPS Geofence Distance',
    cameraMetadata: 'Camera & Timestamp Metadata',
    perceptualDuplicateHash: 'Perceptual Duplicate Hash',
    withinSite: 'Within 100m site threshold',
    locationMismatch: 'Exceeds permissible distance threshold',
    verifiedAuthentic: 'Verified Authentic',
    aiSynthesized: 'Possible AI Generated / Filtered',
    verified: 'Verified',
    underReview: 'Under Review',
    flagged: 'Flagged for Inspection',
    sanctioned: 'Sanctioned Allocation',
    utilized: 'Funds Utilized',

    // Reports
    reportsPageTitle: 'Official Scheme Reports & Statutory Audits',
    reportsPageSubtitle: 'Download verified compliance reports, financial summaries, and constituency progress sheets',
    generatePdf: 'Generate Official Gazette PDF',
    downloadExcel: 'Download Master Excel Sheet',
    auditCompliance: 'MoSPI 2023 Guidelines Compliance',
    constituencyPerformance: 'Constituency Execution Scorecard',

    // Citizen Feedback & Ground Observations
    feedbackPageTitle: 'Citizen Feedback & Ground Observation Desk',
    feedbackPageSubtitle: 'Direct public monitoring and grievance reporting from local constituency residents',
    reportObservation: 'Report Ground Observation / Feedback',
    issueType: 'Nature of Issue',
    citizenName: 'Citizen Name',
    citizenContact: 'Contact Number (Optional)',
    description: 'Ground Observation Details',
    selectProject: 'Select Developmental Project',
    submitFeedback: 'Submit Citizen Observation',
    feedbackSubmittedSuccess: 'Observation registered successfully! Tracking ID: {id}',
    publicGrievances: 'Recent Ground Observations',
    noFeedbackYet: 'No public grievances registered yet. Be the first to share ground observation!',

    // Citizen Chatbot
    chatbotTitle: 'MPLADS Citizen Inquiry AI',
    chatbotGroundedBadge: 'RAG Grounded',
    chatbotSubheading: 'Official Assistant • MoSPI Public Portal',
    chatbotWelcomeMessage: 'Namaste! I am the Official MPLADS Public Transparency AI Assistant. You can ask me in English or Hindi (हिन्दी) about any developmental project, sanction status, or expenditure in your constituency.',
    chatbotInputPlaceholder: 'Ask about projects, budgets, delays in English or Hindi...',
    askMpladsAi: 'Ask MPLADS AI',
    sendQuery: 'Send',
    retrievingRecords: 'Retrieving verified official records...',
    rateLimitNotice: 'Notice: Rate-limited for system availability',
    chatbotDisclaimer: 'Grounded exclusively in official MoSPI MPLADS project records. Quoting exact figures.',
    quickPrompt1: 'हैदराबाद में स्कूल निर्माण परियोजनाओं की क्या स्थिति है?',
    quickPrompt2: 'Which projects are flagged as delayed or high risk?',
    quickPrompt3: 'What is the sanctioned budget for Community Hall in Ward 14?',
    quickPrompt4: 'संसदीय क्षेत्र में कुल कितनी धनराशि स्वीकृत हुई है?',

    // Authentication & Login
    loginTitle: 'Official Authentication Gateway',
    loginSubtitle: 'Members of Parliament & District Authorities Portal',
    userIdLabel: 'Departmental User ID',
    passwordLabel: 'Password',
    signInBtn: 'Secure Sign In',
    enterPublicPortal: 'Enter Citizen Transparency Portal',
    backToSchemeHome: 'Back to Scheme Home',
    invalidCredentialsTitle: 'Invalid credentials',
    invalidCredentialsMsg: 'The User ID or password you entered does not match authorized records.',
    invalidCredentialsSug: 'Please verify your departmental User ID and password.',
    serverUnreachableTitle: 'Server unreachable',
    serverUnreachableMsg: 'Unable to establish a secure connection with the central authentication service.',
    serverUnreachableSug: 'Please check your network connection or verify that the server is online.',
    authFailedTitle: 'Authentication Failed',
    authFailedSug: 'Please verify your credentials and try again.',
    demoCredentialsHelp: 'Demo Credentials Reference',
    mpLogin: 'Member of Parliament',
    adminLogin: 'District Collector / Admin',
    agencyLogin: 'Implementing Agency',
    verifyingSession: 'Verifying authorized session...',

    // Notification Center
    notificationsTitle: 'Official Notifications',
    unreadCountText: '{count} new',
    allCaughtUpText: 'All caught up',
    markAllReadText: 'Mark all notifications as read',
    resetBaselineText: 'Reset notifications to baseline initial state',
    loadingNotificationsText: 'Loading notifications...',
    emptyNotificationsTitle: 'No notifications',
    emptyNotificationsDesc: "You're all caught up with recent updates",
    markAsReadText: 'Mark as read',
    viewProjectText: 'View project',
    viewAlertText: 'View alert',

    // Landing Page Specific
    landingHeroTitle: 'Citizen Transparency Portal for MPLADS Developmental Assets',
    landingHeroSubtitle: 'Public oversight platform tracking sanctioned community infrastructure, expenditure veracity, and on-ground completion across Indian parliamentary constituencies.',
    lokSabha: 'Lok Sabha',
    rajyaSabha: 'Rajya Sabha',
    mpLedgerTab: 'MP-wise Ledger Summary',
    worksListTab: 'Constituency Works Directory',
    searchLandingPlaceholder: 'Search by MP name, constituency, district, state, or project...',
    advancedFilters: 'Advanced Filters',
    tenureLabel: 'Tenure',
    sectorLabel: 'Sector',
    financialYearLabel: 'Financial Year',
    allocatedCrLabel: 'Allocated (₹ Cr)',
    recommendedCrLabel: 'Recommended (₹ Cr)',
    sanctionedCrLabel: 'Sanctioned (₹ Cr)',
    utilizedCrLabel: 'Utilized (₹ Cr)',
    worksRecommendedLabel: 'Works Recommended',
    worksSanctionedLabel: 'Works Sanctioned',
    worksCompletedLabel: 'Works Completed',
    viewWorksLabel: 'View Works',
    noMpsFound: 'No MP records match the current filter selection.'
  },
  hi: {
    // Brand / Portal
    portalName: 'सांसद निधि पारदर्शिता पोर्टल',
    portalTagline: 'सांसद स्थानीय क्षेत्र विकास योजना (MPLADS)',
    govIndia: 'भारत सरकार',
    mospiTitle: 'सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय (MoSPI)',
    mpladsFullName: 'सांसद स्थानीय क्षेत्र विकास योजना (MPLADS) — स्थानीय विकास कार्यों हेतु केंद्रीय योजना',
    officialBadge: 'आधिकारिक',
    nicGov: 'राष्ट्रीय सूचना विज्ञान केंद्र (NIC) • MoSPI, नई दिल्ली',
    footerCompliance: 'आधिकारिक सरकारी संस्थागत पोर्टल • MoSPI 2023 दिशानिर्देश एवं SIH मानकों के अनुरूप',

    // Navigation Tabs & Headers
    home: 'होम / डैशबोर्ड',
    projects: 'परियोजनाएं',
    funds: 'निधि ट्रैकिंग',
    alerts: 'समीक्षा व अलर्ट',
    verification: 'सत्यापन स्थिति',
    reports: 'रिपोर्ट एवं विवरण',
    feedback: 'नागरिक प्रतिपुष्टि',
    gisMap: 'भौगोलिक जीआईएस मानचित्र',
    recommendWork: 'नया कार्य अनुशंसित करें',
    agencyBilling: 'एजेंसी कार्यडेस्क',
    contractorDirectory: 'ठेकेदार निर्देशिका',
    contractorGraph: 'ठेकेदार नेटवर्क विश्लेषण',
    auditTrail: 'लेखापरीक्षा लॉग',
    dataIngestion: 'डेटा अंतर्ग्रहण व प्रभाव',
    help: 'सहायता व चैटबॉट',
    officerLogin: 'अधिकारी लॉगिन',
    publicView: 'नागरिक पोर्टल',
    citizenPortal: 'नागरिक पारदर्शिता पोर्टल',
    signOut: 'लॉगआउट / बदलें',
    authenticatedOfficial: 'प्रमाणित अधिकारी',
    roleAuthority: 'पद प्राधिकार',
    districtJurisdiction: 'ज़िला क्षेत्राधिकार',
    officialSessionActive: 'सक्रिय आधिकारिक सत्र',
    officerOperations: 'अधिकारी संचालन',
    mappingLocation: 'मानचित्रण और स्थान',
    restrictedTools: 'प्रतिबंधित फोरेंसिक उपकरण',
    activeOfficerSession: 'सक्रिय अधिकारी सत्र',
    returnToHome: 'योजना पोर्टल होम पर वापस जाएं',
    switchToOfficer: 'अधिकारी कार्यक्षेत्र पर जाएं',
    publicCitizenModeActive: 'नागरिक पारदर्शिता मोड सक्रिय',

    // Common UI Actions & Words
    search: 'खोजें',
    filter: 'फ़िल्टर',
    reset: 'रीसेट',
    clearFilters: 'फ़िल्टर हटाएं',
    export: 'निर्यात',
    exportCsv: 'CSV में निर्यात करें',
    exportExcel: 'एक्सेल में निर्यात करें',
    printReport: 'आधिकारिक राजपत्र प्रिंट करें',
    loading: 'लोड हो रहा है...',
    saving: 'सहेजा जा रहा है...',
    submitting: 'जमा किया जा रहा है...',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    close: 'बंद करें',
    submit: 'जमा करें',
    update: 'अपडेट करें',
    confirm: 'पुष्टि करें',
    delete: 'हटाएं',
    viewDetails: 'विवरण देखें',
    backTo: 'वापस जाएं',
    backToOverview: '← अवलोकन पर वापस जाएं',
    backToDashboard: '← डैशबोर्ड पर वापस जाएं',
    all: 'सभी',
    noData: 'कोई रिकॉर्ड नहीं मिला',
    actions: 'कार्रवाई',
    status: 'स्थिति',
    progress: 'प्रगति',
    date: 'तारीख',
    category: 'श्रेणी',
    district: 'ज़िला',
    state: 'राज्य',
    constituency: 'संसदीय क्षेत्र',
    mpName: 'सांसद का नाम',
    agency: 'कार्यान्वयन एजेंसी',
    vendor: 'ठेकेदार / विक्रेता',
    estimatedCost: 'अनुमानित लागत',
    sanctionedAmount: 'स्वीकृत राशि',
    fundsUtilized: 'उपयोग की गई राशि',
    riskLevel: 'जोखिम स्तर',
    riskScore: 'सत्यनिष्ठा / जोखिम सूचकांक',
    requiredField: 'यह फ़ील्ड अनिवार्य है',
    invalidValue: 'अमान्य मान दर्ज किया गया',
    saveSuccess: 'सफलतापूर्वक सहेजा गया',
    saveFailed: 'परिवर्तन सहेजने में विफल',
    official: 'आधिकारिक',
    whatDoesThisMean: 'इसका क्या अर्थ है?',
    plainGuidance: 'सरल भाषा मार्गदर्शन',
    clickToExplain: 'विवरण देखने के लिए क्लिक करें',
    previous: 'पिछला',
    next: 'अगला',
    showingResults: '{total} में से {start} से {end} रिकॉर्ड प्रदर्शित',
    pageOf: 'पृष्ठ {current} का {total}',
    total: 'कुल',
    srNo: 'क्र.सं.',

    // Dashboard Specific
    totalProjects: 'कुल कार्य',
    completedProjects: 'पूर्ण कार्य',
    activeProjects: 'प्रगतिरत कार्य',
    delayedProjects: 'विलंबित कार्य',
    underReviewProjects: 'समीक्षाधीन',
    recommendedProjects: 'अनुशंसित',
    highRiskWorks: 'जांच हेतु चिह्नित',
    sanctionedAllocation: 'स्वीकृत आवंटन',
    expenditureVeracity: 'व्यय की गई राशि',
    utilizationRate: 'उपयोग दर',
    worksRequiringAttention: 'ध्यान देने योग्य कार्य',
    recentAlerts: 'हालिया अलर्ट और विसंगतियां',
    noPendingAlerts: 'सक्रिय क्षेत्राधिकार में कोई लंबित विसंगति नहीं पाई गई',
    reviewAlerts: 'अलर्ट की समीक्षा करें',
    constituencyTrend: 'संसदीय क्षेत्र प्रगति व व्यय रुझान',
    integrityVectors: 'सत्यनिष्ठा व अनुपालन मानक',
    interactiveMapView: 'इंटरैक्टिव मानचित्र',
    recommendNewWork: 'नया कार्य अनुशंसित करें',
    citizenViewTag: 'नागरिक पारदर्शिता दृश्य',
    officerConsoleTag: '{role} कंसोल',
    dashboardSubheading: 'स्वीकृत सामुदायिक अवसंरचना, व्यय प्रमाणिकता और धरातलीय कार्य की सार्वजनिक पारदर्शिता निगरानी।',
    mpOverviewTitle: 'संसदीय क्षेत्र विकास एवं आवंटन अवलोकन',
    adminOverviewTitle: 'ज़िला प्राधिकारी निगरानी एवं सत्यापन डैशबोर्ड',
    agencyOverviewTitle: 'कार्यान्वयन एजेंसी कार्यडेस्क एवं प्रगति लॉग',
    publicOverviewTitle: 'सांसद निधि राष्ट्रीय पारदर्शिता एवं परियोजना निगरानी',

    // Projects Specific
    projectsPageTitle: 'संसदीय क्षेत्र विकास कार्य निर्देशिका',
    projectsPageSubtitle: 'सांसद निधि के तहत स्वीकृत और प्रगतिरत सामुदायिक संपत्तियों का आधिकारिक रजिस्टर',
    searchProjectsPlaceholder: 'परियोजना कोड, शीर्षक, स्थान, विक्रेता द्वारा खोजें...',
    allCategories: 'सभी श्रेणियां',
    allDistricts: 'सभी ज़िले',
    allStatuses: 'सभी स्थितियां',
    allRiskLevels: 'सभी जोखिम स्तर',
    sortBy: 'क्रमबद्ध करें',
    sortRisk: 'जोखिम सूचकांक',
    sortCost: 'स्वीकृत लागत',
    sortProgress: 'भौतिक प्रगति',
    sortCode: 'परियोजना कोड',
    projectDetails: 'परियोजना विवरण',
    tabOverview: 'अवलोकन व विवरण',
    tabAiRisk: 'एआई सत्यनिष्ठा विश्लेषण',
    tabPhotos: 'धरातलीय फोटो व डेटा',
    tabFinancials: 'वित्तीय संवितरण',
    tabDocuments: 'स्वीकृति व आदेश',
    tabAuditReport: 'स्वचालित लेखापरीक्षा रिपोर्ट',
    noProjectsFound: 'कोई संबंधित परियोजना नहीं मिली। कृपया खोज या फ़िल्टर बदलें।',
    physicalProgress: 'भौतिक प्रगति',
    completionPercentage: 'पूर्णता',
    vendorAssigned: 'आवंटित ठेकेदार',
    implementingAgency: 'कार्यान्वयन एजेंसी',
    sanctionDate: 'स्वीकृति तिथि',
    targetCompletion: 'लक्ष्य समापन तिथि',
    actualCompletion: 'वास्तविक समापन तिथि',
    startDate: 'कार्य प्रारंभ तिथि',
    workId: 'कार्य आईडी / परियोजना कोड',
    locationAddress: 'स्थान का पता',

    // Financials & Funds Ledger
    fundsPageTitle: 'सांसद निधि वित्तीय बहीखाता और संवितरण',
    fundsPageSubtitle: 'MoSPI दिशानिर्देशों के तहत वैधानिक वार्षिक पात्रता (₹5.00 करोड़ प्रति वित्तीय वर्ष) की ट्रैकिंग',
    annualEntitlement: 'वार्षिक पात्रता',
    perConstituency: 'प्रति संसदीय निर्वाचन क्षेत्र',
    sanctionedWorks: 'स्वीकृत कार्य',
    allocatedPct: 'वार्षिक सीमा का {pct}% आवंटित',
    disbursedUtilized: 'संवितरित व उपयोग की गई राशि',
    utilizedPct: 'स्वीकृत निधि का {pct}% संवितरित',
    uncommittedBalance: 'अनावंटित शेष राशि',
    availableForSanction: 'नई अनुशंसाओं हेतु उपलब्ध',
    transactionLedger: 'किस्त संवितरण बहीखाता',
    categoryBreakdown: 'क्षेत्रवार निधि आवंटन',
    installmentNo: 'किस्त #{no}',
    disbursedOn: '{date} को संवितरित',
    sanctionOrder: 'स्वीकृति आदेश: {order}',
    beneficiaryAgency: 'लाभार्थी एजेंसी',

    // Alerts & Vigilance Review
    alertsPageTitle: 'एआई अलर्ट प्रबंधन एवं सतर्कता समीक्षा डेस्क',
    alertsPageSubtitle: 'एआई द्वारा पाई गई विसंगतियों के लिए ज़िला प्राधिकारी निर्णय कतार',
    pendingAdjudication: '{count} निर्णय लंबित',
    alertTypeLabel: 'अलर्ट प्रकार:',
    reviewStatusLabel: 'समीक्षा स्थिति:',
    takeAction: 'निर्णय कार्रवाई करें',
    noAlertsFound: 'चयनित फ़िल्टर के अनुसार कोई अलर्ट नहीं मिला।',
    reasonFindings: 'कारण / निष्कर्ष',
    technicalDetails: 'तकनीकी साक्ष्य',
    assignedOfficer: 'नियुक्त अधिकारी',
    reviewNotes: 'समीक्षा टिप्पणी',
    actionModalTitle: 'अलर्ट निर्णय: {code}',
    actionResolve: 'समाधानित चिह्नित करें',
    actionEscalate: 'धरातलीय निरीक्षण हेतु अग्रसारित करें',
    actionFalsePositive: 'गलत संकेत चिह्नित करें',
    actionNotesPlaceholder: 'आधिकारिक कारण और समीक्षा टिप्पणी दर्ज करें...',

    // Evidence & Verification
    verificationPageTitle: 'क्रिप्टोग्राफिक साक्ष्य एवं बहु-आयामी सत्यापन',
    verificationPageSubtitle: 'छेड़छाड़ रोधी विश्लेषण: जीपीएस जियोफेंसिंग, EXIF समय-मुहर सत्यापन, और इमेज हैशिंग',
    integrityIndex: 'साक्ष्य सत्यनिष्ठा सूचकांक',
    tamperAnalysis: 'छेड़छाड़ व संपादन विश्लेषण',
    gpsGeofenceDistance: 'जीपीएस जियोफेंस दूरी',
    cameraMetadata: 'कैमरा एवं समय-मुहर मेटाडेटा',
    perceptualDuplicateHash: 'प्रतिरूप/डुप्लिकेट फोटो पहचान',
    withinSite: 'साइट सीमा (100 मी) के भीतर',
    locationMismatch: 'स्वीकार्य दूरी सीमा से अधिक',
    verifiedAuthentic: 'प्रमाणित व प्रामाणिक',
    aiSynthesized: 'संभावित एआई निर्मित / फ़िल्टर की गई फोटो',
    verified: 'सत्यापित',
    underReview: 'समीक्षाधीन',
    flagged: 'जांच हेतु चिह्नित',
    sanctioned: 'स्वीकृत राशि',
    utilized: 'उपयोग की गई राशि',

    // Reports
    reportsPageTitle: 'आधिकारिक योजना रिपोर्ट एवं वैधानिक लेखापरीक्षा',
    reportsPageSubtitle: 'सत्यापित अनुपालन रिपोर्ट, वित्तीय सारांश और प्रगति पत्रक डाउनलोड करें',
    generatePdf: 'आधिकारिक राजपत्र पीडीएफ बनाएं',
    downloadExcel: 'मास्टर एक्सेल शीट डाउनलोड करें',
    auditCompliance: 'MoSPI 2023 दिशानिर्देश अनुपालन',
    constituencyPerformance: 'संसदीय क्षेत्र निष्पादन स्कोरकार्ड',

    // Citizen Feedback & Ground Observations
    feedbackPageTitle: 'नागरिक प्रतिपुष्टि एवं धरातलीय अवलोकन डेस्क',
    feedbackPageSubtitle: 'स्थानीय संसदीय क्षेत्र के नागरिकों द्वारा प्रत्यक्ष निगरानी एवं शिकायत दर्ज करने की सुविधा',
    reportObservation: 'धरातलीय अवलोकन / शिकायत दर्ज करें',
    issueType: 'समस्या का प्रकार',
    citizenName: 'नागरिक का नाम',
    citizenContact: 'संपर्क नंबर (वैकल्पिक)',
    description: 'धरातलीय अवलोकन विवरण',
    selectProject: 'विकास परियोजना चुनें',
    submitFeedback: 'नागरिक अवलोकन जमा करें',
    feedbackSubmittedSuccess: 'अवलोकन सफलतापूर्वक दर्ज किया गया! ट्रैकिंग आईडी: {id}',
    publicGrievances: 'हालिया धरातलीय अवलोकन',
    noFeedbackYet: 'अभी तक कोई नागरिक शिकायत दर्ज नहीं की गई है। पहला अवलोकन आप साझा करें!',

    // Citizen Chatbot
    chatbotTitle: 'सांसद निधि नागरिक सहायता एआई',
    chatbotGroundedBadge: 'RAG सत्यापित',
    chatbotSubheading: 'आधिकारिक सहायक • MoSPI सार्वजनिक पोर्टल',
    chatbotWelcomeMessage: 'नमस्ते! मैं आधिकारिक सांसद निधि सार्वजनिक पारदर्शिता एआई सहायक हूँ। आप मुझसे अपने संसदीय क्षेत्र की किसी भी विकास परियोजना, स्वीकृति स्थिति या व्यय के बारे में अंग्रेजी या हिन्दी में पूछ सकते हैं।',
    chatbotInputPlaceholder: 'परियोजनाओं, बजट, प्रगति के बारे में अंग्रेजी या हिन्दी में पूछें...',
    askMpladsAi: 'सांसद निधि एआई से पूछें',
    sendQuery: 'भेजें',
    retrievingRecords: 'सत्यापित आधिकारिक रिकॉर्ड प्राप्त किए जा रहे हैं...',
    rateLimitNotice: 'सूचना: प्रणाली उपलब्धता बनाए रखने हेतु दर सीमित',
    chatbotDisclaimer: 'विशेष रूप से आधिकारिक MoSPI सांसद निधि रिकॉर्ड पर आधारित। सटीक आंकड़े उद्धृत।',
    quickPrompt1: 'हैदराबाद में स्कूल निर्माण परियोजनाओं की क्या स्थिति है?',
    quickPrompt2: 'Which projects are flagged as delayed or high risk?',
    quickPrompt3: 'What is the sanctioned budget for Community Hall in Ward 14?',
    quickPrompt4: 'संसदीय क्षेत्र में कुल कितनी धनराशि स्वीकृत हुई है?',

    // Authentication & Login
    loginTitle: 'आधिकारिक प्रमाणीकरण प्रवेश द्वार',
    loginSubtitle: 'सांसद एवं ज़िला प्राधिकारी पोर्टल',
    userIdLabel: 'विभागीय यूज़र आईडी',
    passwordLabel: 'पासवर्ड',
    signInBtn: 'सुरक्षित लॉगिन',
    enterPublicPortal: 'नागरिक पारदर्शिता पोर्टल पर जाएं',
    backToSchemeHome: 'योजना होम पर वापस जाएं',
    invalidCredentialsTitle: 'अमान्य क्रेडेंशियल्स',
    invalidCredentialsMsg: 'आपके द्वारा दर्ज किया गया यूज़र आईडी या पासवर्ड रिकॉर्ड से मेल नहीं खाता है।',
    invalidCredentialsSug: 'कृपया अपना विभागीय यूज़र आईडी और पासवर्ड सत्यापित करें।',
    serverUnreachableTitle: 'सर्वर अनुपलब्ध',
    serverUnreachableMsg: 'केंद्रीय प्रमाणीकरण सेवा के साथ सुरक्षित कनेक्शन स्थापित करने में असमर्थ।',
    serverUnreachableSug: 'कृपया अपना नेटवर्क कनेक्शन जांचें या सर्वर ऑनलाइन होने की पुष्टि करें।',
    authFailedTitle: 'प्रमाणीकरण विफल',
    authFailedSug: 'कृपया अपने क्रेडेंशियल्स सत्यापित करें और पुनः प्रयास करें।',
    demoCredentialsHelp: 'डेमो क्रेडेंशियल्स संदर्भ',
    mpLogin: 'संसद सदस्य (MP)',
    adminLogin: 'ज़िला कलेक्टर / एडमिन',
    agencyLogin: 'कार्यान्वयन एजेंसी',
    verifyingSession: 'प्राधिकृत सत्र सत्यापित किया जा रहा है...',

    // Notification Center
    notificationsTitle: 'आधिकारिक सूचनाएं',
    unreadCountText: '{count} नई',
    allCaughtUpText: 'सभी सूचनाएं देखी जा चुकी हैं',
    markAllReadText: 'सभी को पढ़ा हुआ चिह्नित करें',
    resetBaselineText: 'सूचनाओं को प्रारंभिक स्थिति में रीसेट करें',
    loadingNotificationsText: 'सूचनाएं लोड हो रही हैं...',
    emptyNotificationsTitle: 'कोई सूचना नहीं',
    emptyNotificationsDesc: 'आप हाल के सभी अपडेट देख चुके हैं',
    markAsReadText: 'पढ़ा हुआ चिह्नित करें',
    viewProjectText: 'परियोजना देखें',
    viewAlertText: 'अलर्ट देखें',

    // Landing Page Specific
    landingHeroTitle: 'सांसद निधि विकास संपत्तियों हेतु नागरिक पारदर्शिता पोर्टल',
    landingHeroSubtitle: 'भारतीय संसदीय क्षेत्रों में स्वीकृत सामुदायिक अवसंरचना, व्यय प्रमाणिकता और धरातलीय कार्य की सार्वजनिक निगरानी मंच।',
    lokSabha: 'लोकसभा',
    rajyaSabha: 'राज्यसभा',
    mpLedgerTab: 'सांसद-वार बहीखाता सारांश',
    worksListTab: 'संसदीय क्षेत्र कार्य निर्देशिका',
    searchLandingPlaceholder: 'सांसद का नाम, संसदीय क्षेत्र, ज़िला, राज्य या कार्य द्वारा खोजें...',
    advancedFilters: 'उन्नत फ़िल्टर',
    tenureLabel: 'कार्यकाल',
    sectorLabel: 'क्षेत्र/विभाग',
    financialYearLabel: 'वित्तीय वर्ष',
    allocatedCrLabel: 'आवंटित (₹ करोड़)',
    recommendedCrLabel: 'अनुशंसित (₹ करोड़)',
    sanctionedCrLabel: 'स्वीकृत (₹ करोड़)',
    utilizedCrLabel: 'व्यय (₹ करोड़)',
    worksRecommendedLabel: 'अनुशंसित कार्य',
    worksSanctionedLabel: 'स्वीकृत कार्य',
    worksCompletedLabel: 'पूर्ण कार्य',
    viewWorksLabel: 'कार्य देखें',
    noMpsFound: 'चयनित फ़िल्टर के अनुसार कोई सांसद रिकॉर्ड नहीं मिला।'
  }
};
