import { Project, DuplicateProjectCandidate } from '../src/types/index.js';

export function calculateHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function calculateTextSimilarity(text1: string, text2: string): number {
  const tokenize = (str: string) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );
  };
  const setA = tokenize(text1);
  const setB = tokenize(text2);
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return Math.round((intersection.size / union.size) * 100);
}

/**
 * Real Duplicate Work Detection Engine
 * Multi-variable constraint matching:
 * 1. Geospatial proximity corridor (< 500m high alert, < 1500m moderate)
 * 2. Work specification lexical similarity (title + description keywords)
 * 3. Overlapping sanction windows (sanctioned within 365 days of each other)
 * 4. Cross-MP & Cross-Constituency double-dipping detection
 */
export function findRealDuplicateCandidates(project: Project, allProjects: Project[]): DuplicateProjectCandidate[] {
  const duplicates: DuplicateProjectCandidate[] = [];

  for (const other of allProjects) {
    if (other.id === project.id) continue;

    // Haversine distance
    const distance = calculateHaversineDistanceMeters(
      project.latitude,
      project.longitude,
      other.latitude,
      other.longitude
    );

    // Specification similarity
    const titleSim = calculateTextSimilarity(project.title, other.title);
    const descSim = calculateTextSimilarity(project.description, other.description);
    const textSim = Math.round(titleSim * 0.7 + descSim * 0.3);

    // Overlapping sanction windows
    let sanctionDateDeltaDays = 999;
    const date1Str = project.sanctionDate || project.recommendationDate;
    const date2Str = other.sanctionDate || other.recommendationDate;
    if (date1Str && date2Str) {
      const t1 = new Date(date1Str).getTime();
      const t2 = new Date(date2Str).getTime();
      if (!isNaN(t1) && !isNaN(t2)) {
        sanctionDateDeltaDays = Math.round(Math.abs(t1 - t2) / 86400000);
      }
    }
    const overlappingWindow = sanctionDateDeltaDays <= 365;

    // Cross-MP / Cross-Constituency check
    const isCrossMp = Boolean(project.mpName && other.mpName && project.mpName !== other.mpName);
    const isCrossConstituency = Boolean(project.constituency && other.constituency && project.constituency !== other.constituency);

    // Combined Score Formulation
    let combinedScore = textSim;
    if (distance < 250) {
      combinedScore = Math.min(99, combinedScore + 40);
    } else if (distance < 600) {
      combinedScore = Math.min(96, combinedScore + 28);
    } else if (distance < 1200) {
      combinedScore = Math.min(92, combinedScore + 18);
    } else if (distance < 2500) {
      combinedScore = Math.min(85, combinedScore + 10);
    }

    // Boost score if within overlapping sanction window
    if (overlappingWindow && distance < 1500) {
      combinedScore = Math.min(99, combinedScore + 12);
    }

    // Match threshold: combinedScore >= 55 OR (very close < 450m and textSim >= 35)
    if (combinedScore >= 55 || (distance <= 450 && textSim >= 35)) {
      const matchingFactors: string[] = [];

      if (distance < 1500) {
        matchingFactors.push(`Proximity corridor: ${distance}m from registered site (${distance < 500 ? 'High Proximity Alert' : 'Moderate Buffer'})`);
      }
      if (textSim >= 40) {
        matchingFactors.push(`Specification title/description overlap: ${textSim}% match`);
      }
      if (overlappingWindow) {
        matchingFactors.push(`Overlapping sanction window: Sanction dates separated by ${sanctionDateDeltaDays} days (< 1 year)`);
      }
      if (isCrossMp) {
        matchingFactors.push(`Cross-MP Allocation: Different MPs (${project.mpName} vs ${other.mpName})`);
      }
      if (isCrossConstituency) {
        matchingFactors.push(`Cross-Constituency Boundary: ${project.constituency} vs ${other.constituency}`);
      }
      if (project.category === other.category) {
        matchingFactors.push(`Identical Work Category: ${project.category}`);
      }

      duplicates.push({
        primaryProject: project,
        candidateProject: other,
        similarityScore: combinedScore,
        distanceMeters: distance,
        matchingFactors,
        sanctionDateDeltaDays,
        isCrossConstituency,
        isCrossMp,
        overlappingSanctionWindow: overlappingWindow
      });
    }
  }

  return duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
}
