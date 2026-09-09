import { Language } from './translations.js';

export const projectStatusTranslations: Record<Language, Record<string, string>> = {
  en: {
    'Recommended': 'Recommended',
    'Under Review': 'Under Review',
    'Sanctioned': 'Sanctioned',
    'Assigned': 'Assigned',
    'Ongoing': 'Ongoing',
    'Delayed': 'Delayed',
    'Completed': 'Completed',
    'Rejected': 'Rejected'
  },
  hi: {
    'Recommended': 'अनुशंसित',
    'Under Review': 'समीक्षाधीन',
    'Sanctioned': 'स्वीकृत',
    'Assigned': 'आवंटित',
    'Ongoing': 'प्रगति पर',
    'Delayed': 'विलंबित',
    'Completed': 'पूर्ण',
    'Rejected': 'अस्वीकृत'
  }
};

export const riskLevelTranslations: Record<Language, Record<string, string>> = {
  en: {
    'LOW': 'Routine / On Track',
    'MEDIUM': 'May Need Review',
    'HIGH': 'Flagged for Inspection',
    'CRITICAL': 'Action Required'
  },
  hi: {
    'LOW': 'संतोषजनक / प्रगति पर',
    'MEDIUM': 'समीक्षा आवश्यक',
    'HIGH': 'जांच हेतु चिह्नित',
    'CRITICAL': 'तत्काल कार्रवाई आवश्यक'
  }
};

export const alertStatusTranslations: Record<Language, Record<string, string>> = {
  en: {
    'New': 'New',
    'Under Review': 'Under Review',
    'Escalated': 'Escalated',
    'Resolved': 'Resolved',
    'False Positive': 'False Positive'
  },
  hi: {
    'New': 'नया',
    'Under Review': 'समीक्षाधीन',
    'Escalated': 'अग्रसारित',
    'Resolved': 'समाधानित',
    'False Positive': 'गलत संकेत'
  }
};

export const alertTypeTranslations: Record<Language, Record<string, string>> = {
  en: {
    'High Risk': 'High Risk',
    'Cost Anomaly': 'Cost Anomaly',
    'Delay Risk': 'Delay Risk',
    'Possible Duplicate': 'Possible Duplicate',
    'Photo Anomaly': 'Photo Anomaly',
    'Location Mismatch': 'Location Mismatch'
  },
  hi: {
    'High Risk': 'उच्च जोखिम',
    'Cost Anomaly': 'लागत विसंगति',
    'Delay Risk': 'विलंब जोखिम',
    'Possible Duplicate': 'संभावित डुप्लिकेट',
    'Photo Anomaly': 'फोटो विसंगति',
    'Location Mismatch': 'स्थान बेमेल'
  }
};

export const verificationStateTranslations: Record<Language, Record<string, string>> = {
  en: {
    'Verified': 'Verified',
    'Under Review': 'Under Review',
    'Flagged': 'Flagged'
  },
  hi: {
    'Verified': 'सत्यापित',
    'Under Review': 'समीक्षाधीन',
    'Flagged': 'जांच हेतु चिह्नित'
  }
};

export const categoryTranslations: Record<Language, Record<string, string>> = {
  en: {
    'Community Infrastructure': 'Community Infrastructure',
    'Drinking Water & Sanitation': 'Drinking Water & Sanitation',
    'Education & Schools': 'Education & Schools',
    'Renewable Energy': 'Renewable Energy',
    'Healthcare & Wellness': 'Healthcare & Wellness',
    'Roads, Bridges & Pathways': 'Roads, Bridges & Pathways',
    'Child & Women Welfare': 'Child & Women Welfare',
    'Skill Development & IT': 'Skill Development & IT',
    'Public Safety & Security': 'Public Safety & Security',
    'Sports & Recreation': 'Sports & Recreation'
  },
  hi: {
    'Community Infrastructure': 'सामुदायिक अवसंरचना',
    'Drinking Water & Sanitation': 'पेयजल एवं स्वच्छता',
    'Education & Schools': 'शिक्षा एवं विद्यालय',
    'Renewable Energy': 'नवीकरणीय ऊर्जा',
    'Healthcare & Wellness': 'स्वास्थ्य एवं चिकित्सा',
    'Roads, Bridges & Pathways': 'सड़कें, पुल एवं मार्ग',
    'Child & Women Welfare': 'महिला एवं बाल कल्याण',
    'Skill Development & IT': 'कौशल विकास एवं आईटी',
    'Public Safety & Security': 'सार्वजनिक सुरक्षा',
    'Sports & Recreation': 'खेल एवं मनोरंजन'
  }
};

export const issueTypeTranslations: Record<Language, Record<string, string>> = {
  en: {
    'Incomplete Work': 'Incomplete Work',
    'Incorrect Location': 'Incorrect Location',
    'Project Not Found': 'Project Not Found',
    'Damaged Asset': 'Damaged Asset',
    'Poor Quality': 'Poor Quality',
    'Other': 'Other'
  },
  hi: {
    'Incomplete Work': 'अधूरा कार्य',
    'Incorrect Location': 'गलत स्थान',
    'Project Not Found': 'कार्य स्थल पर नहीं मिला',
    'Damaged Asset': 'क्षतिग्रस्त संपत्ति',
    'Poor Quality': 'घटिया निर्माण सामग्री / गुणवत्ता',
    'Other': 'अन्य'
  }
};

export const roleTranslations: Record<Language, Record<string, string>> = {
  en: {
    'MP': 'Member of Parliament',
    'ADMIN': 'District Authority / Collector',
    'AGENCY': 'Implementing Agency',
    'PUBLIC': 'Citizen Transparency Portal',
    'SUPER_ADMIN': 'Super Administrator',
    'PROJECT_MANAGER': 'Project Manager',
    'VIEWER': 'Public Viewer'
  },
  hi: {
    'MP': 'संसद सदस्य (सांसद)',
    'ADMIN': 'ज़िला प्राधिकारी / कलेक्टर',
    'AGENCY': 'कार्यान्वयन एजेंसी',
    'PUBLIC': 'नागरिक पारदर्शिता पोर्टल',
    'SUPER_ADMIN': 'वरिष्ठ प्रशासक',
    'PROJECT_MANAGER': 'परियोजना प्रबंधक',
    'VIEWER': 'सार्वजनिक दर्शक'
  }
};
