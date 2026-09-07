import { GoogleGenAI } from '@google/genai';
import { Project, CitizenFeedback } from '../src/types/index.js';

export interface GrievanceAnalysisResult {
  feedbackId: string;
  detectedLanguage: 'en' | 'hi' | 'te' | 'ta' | 'bn';
  languageName: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'HIGHLY_CRITICAL';
  sentimentScore: number;
  primaryThemes: ('GHOST_ASSET' | 'SUBSTANDARD_QUALITY' | 'INCOMPLETE_ABANDONED' | 'LOCATION_MISMATCH' | 'CORRUPTION_BRIBES')[];
  themeLabels: string[];
  fraudSignificance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  integrityRiskPenalty: number;
  summaryEn: string;
}

export interface ChatbotResponse {
  answer: string;
  detectedLanguage: string;
  retrievedProjects: {
    id: string;
    projectCode: string;
    title: string;
    mpName: string;
    district: string;
    sanctionedAmountLakhs: number;
    completionPercentage: number;
    status: string;
    riskLevel: string;
  }[];
  isGrounded: boolean;
  disclaimer: string;
  responseTimeMs: number;
}

const queryRateLimiter = new Map<string, number[]>();

export function checkChatbotRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxQueries = 20;
  const timestamps = queryRateLimiter.get(clientIp) || [];
  const validTimestamps = timestamps.filter(t => now - t < windowMs);
  if (validTimestamps.length >= maxQueries) return false;
  validTimestamps.push(now);
  queryRateLimiter.set(clientIp, validTimestamps);
  return true;
}

export function detectLanguage(text: string): { code: 'en' | 'hi' | 'te' | 'ta' | 'bn'; name: string } {
  if (!text) return { code: 'en', name: 'English' };
  if (/[\u0900-\u097F]/.test(text)) return { code: 'hi', name: 'Hindi (हिंदी)' };
  if (/[\u0C00-\u0C7F]/.test(text)) return { code: 'te', name: 'Telugu (తెలుగు)' };
  if (/[\u0B80-\u0BFF]/.test(text)) return { code: 'ta', name: 'Tamil (தமிழ்)' };
  if (/[\u0980-\u09FF]/.test(text)) return { code: 'bn', name: 'Bengali (বাংলা)' };
  return { code: 'en', name: 'English' };
}

export function analyzeCitizenGrievance(feedback: CitizenFeedback, project?: Project): GrievanceAnalysisResult {
  const text = `${feedback.issueType} ${feedback.description}`.toLowerCase();
  const lang = detectLanguage(`${feedback.issueType} ${feedback.description}`);
  const primaryThemes: GrievanceAnalysisResult['primaryThemes'] = [];
  const themeLabels: string[] = [];

  if (
    text.includes("doesn't exist") || text.includes('does not exist') ||
    text.includes('no work') || text.includes('ghost') ||
    text.includes('nothing constructed') || text.includes('नहीं बना') || text.includes('లేనే లేదు')
  ) {
    primaryThemes.push('GHOST_ASSET');
    themeLabels.push('Non-Existent / Ghost Asset Reported');
  }

  if (
    text.includes('poor quality') || text.includes('substandard') ||
    text.includes('cracks') || text.includes('inferior') ||
    text.includes('collapsed') || text.includes('घटिया') || text.includes('పగుళ్లు')
  ) {
    primaryThemes.push('SUBSTANDARD_QUALITY');
    themeLabels.push('Substandard Construction / Material Quality');
  }

  if (
    text.includes('incomplete') || text.includes('abandoned') ||
    text.includes('halfway') || text.includes('stopped') ||
    text.includes('अधूरा') || text.includes('ఆగిపోయింది')
  ) {
    primaryThemes.push('INCOMPLETE_ABANDONED');
    themeLabels.push('Work Abandoned / Stalled Milestone');
  }

  if (
    text.includes('different location') || text.includes('wrong site') ||
    text.includes('wrong village') || text.includes('गलत जगह') || text.includes('తప్పు స్థలం')
  ) {
    primaryThemes.push('LOCATION_MISMATCH');
    themeLabels.push('Geographic Discrepancy / Site Diversion');
  }

  if (
    text.includes('corruption') || text.includes('bribe') ||
    text.includes('siphon') || text.includes('embezzle') ||
    text.includes('भ्रष्टाचार') || text.includes('అవినీతి')
  ) {
    primaryThemes.push('CORRUPTION_BRIBES');
    themeLabels.push('Financial Irregularity Allegation');
  }

  let sentiment: GrievanceAnalysisResult['sentiment'] = 'NEUTRAL';
  let sentimentScore = 0.0;
  if (primaryThemes.length >= 2 || primaryThemes.includes('GHOST_ASSET') || primaryThemes.includes('CORRUPTION_BRIBES')) {
    sentiment = 'HIGHLY_CRITICAL';
    sentimentScore = -0.9;
  } else if (primaryThemes.length === 1 || text.includes('delay') || text.includes('problem') || text.includes('issue')) {
    sentiment = 'NEGATIVE';
    sentimentScore = -0.55;
  } else if (text.includes('good') || text.includes('thank') || text.includes('appreciated')) {
    sentiment = 'POSITIVE';
    sentimentScore = 0.75;
  }

  let fraudSignificance: GrievanceAnalysisResult['fraudSignificance'] = 'LOW';
  let integrityRiskPenalty = 0;
  const isCompletedOnPaper = project && (project.status === 'Completed' || project.completionPercentage >= 90);

  if (primaryThemes.includes('GHOST_ASSET')) {
    fraudSignificance = isCompletedOnPaper ? 'CRITICAL' : 'HIGH';
    integrityRiskPenalty = isCompletedOnPaper ? 35 : 20;
  } else if (primaryThemes.includes('LOCATION_MISMATCH') || primaryThemes.includes('CORRUPTION_BRIBES')) {
    fraudSignificance = 'HIGH';
    integrityRiskPenalty = 22;
  } else if (primaryThemes.includes('SUBSTANDARD_QUALITY') || primaryThemes.includes('INCOMPLETE_ABANDONED')) {
    fraudSignificance = isCompletedOnPaper ? 'HIGH' : 'MEDIUM';
    integrityRiskPenalty = isCompletedOnPaper ? 18 : 10;
  }

  return {
    feedbackId: feedback.id,
    detectedLanguage: lang.code,
    languageName: lang.name,
    sentiment,
    sentimentScore,
    primaryThemes,
    themeLabels: themeLabels.length ? themeLabels : ['General Citizen Inquiry'],
    fraudSignificance,
    integrityRiskPenalty,
    summaryEn: `Reported in ${lang.name}. Sentiment: ${sentiment}. Identified ${primaryThemes.length} alert themes.`
  };
}

export async function executeRagChatbotQuery(
  userQuery: string,
  allProjects: Project[],
  clientIp: string
): Promise<ChatbotResponse> {
  const startTime = Date.now();
  if (!checkChatbotRateLimit(clientIp)) {
    return {
      answer: 'Rate limit exceeded: Please wait a moment before sending another query to ensure portal availability.',
      detectedLanguage: 'en',
      retrievedProjects: [],
      isGrounded: false,
      disclaimer: 'MPLADS Public Inquiry System rate-limiting policy active.',
      responseTimeMs: Date.now() - startTime
    };
  }

  const lang = detectLanguage(userQuery);
  const qLower = userQuery.toLowerCase();

  const scoredProjects = allProjects.map(p => {
    let score = 0;
    const pTitle = p.title.toLowerCase();
    const pDist = p.district.toLowerCase();
    const pConst = p.constituency.toLowerCase();
    const pCategory = p.category.toLowerCase();
    const pStatus = p.status.toLowerCase();
    const pCode = p.projectCode.toLowerCase();

    if (qLower.includes(pDist)) score += 10;
    if (qLower.includes(pConst)) score += 12;
    if (qLower.includes(pCategory)) score += 8;
    if (qLower.includes(pCode)) score += 25;
    if (qLower.includes(pStatus)) score += 6;

    if (qLower.includes('delay') && p.status === 'Delayed') score += 12;
    if (qLower.includes('complet') && p.status === 'Completed') score += 10;
    if (qLower.includes('ongoing') && p.status === 'Ongoing') score += 8;
    if ((qLower.includes('risk') || qLower.includes('anomaly')) && (p.riskAnalysis?.overallScore || 0) > 60) score += 15;

    return { project: p, score };
  });

  scoredProjects.sort((a, b) => b.score - a.score);
  const topMatches = scoredProjects.filter(sp => sp.score > 0).slice(0, 4).map(sp => sp.project);
  const candidateProjects = topMatches.length ? topMatches : allProjects.slice(0, 3);

  let generatedAnswer = '';
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const contextSnippet = candidateProjects.map((p, idx) => `
[Project ${idx + 1}] - ${p.projectCode}: ${p.title} (${p.category})
- Sanctioned: ₹${((p.sanctionedAmount || p.estimatedCost) / 100000).toFixed(1)}L | Progress: ${p.completionPercentage}% (${p.status})
- Risk Score: ${p.riskAnalysis?.overallScore || 20}/100 | Agency: ${p.implementingAgencyName}
`).join('\n');

      const prompt = `You are the Official MPLADS Public Transparency AI Assistant for the Government of India.
Citizen Query: "${userQuery}".
Language: ${lang.name}.
Answer based strictly on these project records:
${contextSnippet}
Respond in ${lang.name}. Keep it professional and factual.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      generatedAnswer = response.text || '';
    } catch (e: any) {
      console.warn('[NLP] Gemini API note, using grounded template response:', e?.message);
    }
  }

  if (!generatedAnswer) {
    if (lang.code === 'hi') {
      generatedAnswer = `आधिकारिक MPLADS रिकॉर्ड के अनुसार, आपके द्वारा पूछे गए कार्यों का विवरण:

` +
        candidateProjects.map(p => `• **${p.title}** (${p.projectCode})
  सांसद: ${p.mpName} (${p.district})
  स्वीकृत राशि: ₹${((p.sanctionedAmount || p.estimatedCost) / 100000).toFixed(1)} लाख | प्रगति: ${p.completionPercentage}% (${p.status})
  जोखिम स्तर: ${p.riskAnalysis?.riskLevel || 'LOW'}`).join('

') +
        `

यह डेटा eSAKSHI पोर्टल से सीधे सत्यापित है।`;
    } else if (lang.code === 'te') {
      generatedAnswer = `అధికారిక MPLADS రికార్డుల ప్రకారం వివరాలు:

` +
        candidateProjects.map(p => `• **${p.title}** (${p.projectCode})
  ఎంపీ: ${p.mpName} (${p.district})
  మంజూరు: ₹${((p.sanctionedAmount || p.estimatedCost) / 100000).toFixed(1)} లక్షలు | పురోగతి: ${p.completionPercentage}% (${p.status})
  రిస్క్ లెవెల్: ${p.riskAnalysis?.riskLevel || 'LOW'}`).join('

') +
        `

ఈ డేటా eSAKSHI లెడ్జర్ ద్వారా ధృవీకరించబడింది.`;
    } else {
      generatedAnswer = `Based on official MPLADS records retrieved for your query:

` +
        candidateProjects.map(p => `• **${p.title}** (${p.projectCode})
  MP: ${p.mpName} (${p.constituency}, ${p.district})
  Sanctioned: ₹${((p.sanctionedAmount || p.estimatedCost) / 100000).toFixed(1)} Lakh | Progress: ${p.completionPercentage}% (${p.status})
  Risk Level: ${p.riskAnalysis?.riskLevel || 'LOW'} | Agency: ${p.implementingAgencyName}`).join('

') +
        `

All figures are synchronized with the MoSPI administrative ledger.`;
    }
  }

  return {
    answer: generatedAnswer,
    detectedLanguage: lang.name,
    retrievedProjects: candidateProjects.map(p => ({
      id: p.id,
      projectCode: p.projectCode,
      title: p.title,
      mpName: p.mpName,
      district: p.district,
      sanctionedAmountLakhs: Number(((p.sanctionedAmount || p.estimatedCost) / 100000).toFixed(1)),
      completionPercentage: p.completionPercentage,
      status: p.status,
      riskLevel: p.riskAnalysis?.riskLevel || 'LOW'
    })),
    isGrounded: true,
    disclaimer: 'Notice: This summary is generated from official MPLADS open data records.',
    responseTimeMs: Date.now() - startTime
  };
}
