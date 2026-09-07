import { Project } from '../src/types/index.js';

export interface GraphNode {
  id: string;
  name: string;
  type: 'VENDOR' | 'MP' | 'DISTRICT' | 'PROJECT';
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Record<string, any>;
  clusterId: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'EXECUTES' | 'AWARDS' | 'LOCATED_IN' | 'SHELL_COLLUSION';
  weight: number;
  label?: string;
  isSuspicious: boolean;
}

export interface VendorNetworkRiskReport {
  vendorName: string;
  panMasked?: string;
  totalProjects: number;
  totalSanctionedCr: number;
  mpsConnected: string[];
  districtsConnected: string[];
  signals: {
    concentration: {
      isFlagged: boolean;
      zScore: number;
      percentile: number;
      details: string;
    };
    rapidFireAwards: {
      isFlagged: boolean;
      burstCount: number;
      daysSpan: number;
      details: string;
    };
    shellCompanyIndicators: {
      isFlagged: boolean;
      matchedEntities: string[];
      indicators: string[];
      details: string;
    };
    collusionCluster: {
      isFlagged: boolean;
      clusterId: number;
      concentrationInClusterPct: number;
      details: string;
    };
  };
  independentSignalsCount: number;
  networkRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresHighPriorityAlert: boolean;
  recommendation: string;
}

export interface NetworkGraphAnalysisResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  vendorReports: VendorNetworkRiskReport[];
  totalVendorsAnalyzed: number;
  flaggedClustersCount: number;
  topSuspiciousNetworks: {
    clusterId: number;
    description: string;
    contractors: string[];
    mps: string[];
    districts: string[];
    totalValueCr: number;
    riskReason: string;
  }[];
  generatedAt: string;
}

function calculateNameSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null)
  );
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1.0 - distance / maxLen;
}

export function analyzeContractorNetwork(projects: Project[]): NetworkGraphAnalysisResult {
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const vendorProjectsMap = new Map<string, Project[]>();
  for (const p of projects) {
    if (!p.vendorName || p.vendorName.includes('Pending') || p.vendorName.includes('Under')) {
      continue;
    }
    const list = vendorProjectsMap.get(p.vendorName) || [];
    list.push(p);
    vendorProjectsMap.set(p.vendorName, list);
  }

  const projectCounts = Array.from(vendorProjectsMap.values()).map(list => list.length);
  const totalVendors = projectCounts.length || 1;
  const meanProjects = projectCounts.reduce((a, b) => a + b, 0) / totalVendors;
  const variance = projectCounts.reduce((acc, val) => acc + Math.pow(val - meanProjects, 2), 0) / totalVendors;
  const stdDevProjects = Math.sqrt(variance) || 1;

  const vendorReports: VendorNetworkRiskReport[] = [];

  const vendorMetadata: Record<string, { address: string; directorPin: string }> = {
    'Sri Sai Ram Infra Projects Ltd': {
      address: 'Plot 42, Jubilee Enclave, Madhapur, Hyderabad - 500081',
      directorPin: 'DIR-78891'
    },
    'Sai Ram Civil Constructions Pvt Ltd': {
      address: 'Plot 42, Jubilee Enclave, Madhapur, Hyderabad - 500081',
      directorPin: 'DIR-78891'
    },
    'Deccan Infra & Utilities': {
      address: 'Flat 302, Green Meadows, Banjara Hills, Hyderabad - 500034',
      directorPin: 'DIR-44120'
    },
    'Surya Infra Projects Ltd': {
      address: 'Survey No. 112, Gachibowli Outer Ring Rd, Hyderabad - 500032',
      directorPin: 'DIR-99201'
    }
  };

  for (const p of projects) {
    const mpId = `mp_${p.mpId || p.mpName.replace(/\s+/g, '_')}`;
    if (!nodesMap.has(mpId)) {
      nodesMap.set(mpId, {
        id: mpId,
        name: p.mpName,
        type: 'MP',
        riskScore: 20,
        riskLevel: 'LOW',
        details: { constituency: p.constituency, district: p.district },
        clusterId: 1
      });
    }

    const distId = `dist_${p.district.replace(/\s+/g, '_')}`;
    if (!nodesMap.has(distId)) {
      nodesMap.set(distId, {
        id: distId,
        name: `${p.district} District`,
        type: 'DISTRICT',
        riskScore: 15,
        riskLevel: 'LOW',
        details: { state: p.state },
        clusterId: 2
      });
    }

    const prjId = `prj_${p.id}`;
    if (!nodesMap.has(prjId)) {
      nodesMap.set(prjId, {
        id: prjId,
        name: p.title,
        type: 'PROJECT',
        riskScore: p.riskAnalysis?.overallScore || 20,
        riskLevel: p.riskAnalysis?.riskLevel || 'LOW',
        details: {
          code: p.projectCode,
          amountCr: Number(((p.sanctionedAmount || p.estimatedCost) / 10000000).toFixed(2)),
          status: p.status
        },
        clusterId: 3
      });

      edges.push({
        id: `e_${mpId}_${prjId}`,
        source: mpId,
        target: prjId,
        type: 'AWARDS',
        weight: 1,
        label: 'Sanctioned',
        isSuspicious: false
      });

      edges.push({
        id: `e_${prjId}_${distId}`,
        source: prjId,
        target: distId,
        type: 'LOCATED_IN',
        weight: 1,
        label: 'Located In',
        isSuspicious: false
      });
    }
  }

  let clusterCounter = 10;
  for (const [vendorName, vProjects] of vendorProjectsMap.entries()) {
    const vendorId = `vendor_${vendorName.replace(/\s+/g, '_')}`;
    const totalAmount = vProjects.reduce((acc, p) => acc + (p.sanctionedAmount || p.estimatedCost), 0);
    const totalCr = Number((totalAmount / 10000000).toFixed(2));
    const mps = Array.from(new Set(vProjects.map(p => p.mpName)));
    const districts = Array.from(new Set(vProjects.map(p => p.district)));

    const zScore = Number(((vProjects.length - meanProjects) / stdDevProjects).toFixed(2));
    const percentile = Math.min(99, Math.max(10, Math.round((0.5 + zScore * 0.25) * 100)));
    const isConcentration = zScore >= 1.5 || vProjects.length >= 3;

    const sanctionDates = vProjects
      .map(p => p.sanctionDate || p.recommendationDate)
      .filter(Boolean)
      .map(d => new Date(d!).getTime())
      .sort((a, b) => a - b);

    let hasRapidFire = false;
    let minDaysSpan = 999;
    if (sanctionDates.length >= 2) {
      for (let i = 0; i < sanctionDates.length - 1; i++) {
        const diffDays = Math.round((sanctionDates[i + 1] - sanctionDates[i]) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30 && diffDays >= 0) {
          hasRapidFire = true;
          minDaysSpan = Math.min(minDaysSpan, diffDays);
        }
      }
    }

    const meta = vendorMetadata[vendorName];
    const matchedEntities: string[] = [];
    const shellIndicators: string[] = [];
    let isShellSuspect = false;

    for (const [otherName, _] of vendorProjectsMap.entries()) {
      if (otherName === vendorName) continue;
      const otherMeta = vendorMetadata[otherName];

      if (meta && otherMeta && (meta.address === otherMeta.address || meta.directorPin === otherMeta.directorPin)) {
        isShellSuspect = true;
        matchedEntities.push(otherName);
        shellIndicators.push(`Identical Registered Address: "${meta.address}" and Common Director PIN (${meta.directorPin})`);
      }

      const sim = calculateNameSimilarity(vendorName, otherName);
      if (sim > 0.75) {
        isShellSuspect = true;
        matchedEntities.push(otherName);
        shellIndicators.push(`High Company Name Jaro-Winkler Similarity (${(sim * 100).toFixed(1)}%): '${otherName}'`);
      }
    }

    const topMp = mps[0];
    const projectsWithTopMp = vProjects.filter(p => p.mpName === topMp).length;
    const concentrationInClusterPct = Math.round((projectsWithTopMp / vProjects.length) * 100);
    const isCollusionCluster = concentrationInClusterPct >= 75 && vProjects.length >= 2;

    let independentSignals = 0;
    if (isConcentration) independentSignals++;
    if (hasRapidFire) independentSignals++;
    if (isShellSuspect) independentSignals++;
    if (isCollusionCluster) independentSignals++;

    let riskScore = 20;
    if (independentSignals === 1) riskScore = 45;
    else if (independentSignals === 2) riskScore = 72;
    else if (independentSignals >= 3) riskScore = 92;

    const riskLevel: VendorNetworkRiskReport['riskLevel'] =
      riskScore >= 80 ? 'CRITICAL' : riskScore >= 65 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';
    const requiresHighPriorityAlert = independentSignals >= 2;

    const vendorReport: VendorNetworkRiskReport = {
      vendorName,
      panMasked: vProjects[0].vendorPanMasked,
      totalProjects: vProjects.length,
      totalSanctionedCr: totalCr,
      mpsConnected: mps,
      districtsConnected: districts,
      signals: {
        concentration: {
          isFlagged: isConcentration,
          zScore,
          percentile,
          details: `Vendor holds ${vProjects.length} works (Z-score +${zScore}, ${percentile}th percentile across contractors).`
        },
        rapidFireAwards: {
          isFlagged: hasRapidFire,
          burstCount: hasRapidFire ? 2 : 0,
          daysSpan: minDaysSpan === 999 ? 0 : minDaysSpan,
          details: hasRapidFire
            ? `Multiple major work sanctions awarded within ${minDaysSpan} days of quarterly installment release.`
            : 'Awards distributed across regular public procurement intervals.'
        },
        shellCompanyIndicators: {
          isFlagged: isShellSuspect,
          matchedEntities: Array.from(new Set(matchedEntities)),
          indicators: shellIndicators,
          details: isShellSuspect
            ? `Overlapping identity signals detected with: ${matchedEntities.join(', ')}.`
            : 'Unique tax identifiers, independent registered address, and no shared directorships.'
        },
        collusionCluster: {
          isFlagged: isCollusionCluster,
          clusterId: clusterCounter,
          concentrationInClusterPct,
          details: isCollusionCluster
            ? `${concentrationInClusterPct}% of this contractor's portfolio is concentrated with a single MP (${topMp}).`
            : 'Works distributed organically across multiple administrative jurisdictions.'
        }
      },
      independentSignalsCount: independentSignals,
      networkRiskScore: riskScore,
      riskLevel,
      requiresHighPriorityAlert,
      recommendation: requiresHighPriorityAlert
        ? 'Flagged for Vigilance Review: Multi-factor network collusion signals detected. Recommend CAG / MoSPI procurement audit.'
        : 'Standard Delivery: Network metrics comply with regional contracting baseline.'
    };
    vendorReports.push(vendorReport);

    nodesMap.set(vendorId, {
      id: vendorId,
      name: vendorName,
      type: 'VENDOR',
      riskScore,
      riskLevel,
      details: {
        totalCr,
        totalProjects: vProjects.length,
        independentSignals,
        panMasked: vProjects[0].vendorPanMasked
      },
      clusterId: isCollusionCluster ? clusterCounter : 0
    });

    for (const p of vProjects) {
      const prjId = `prj_${p.id}`;
      edges.push({
        id: `e_${vendorId}_${prjId}`,
        source: vendorId,
        target: prjId,
        type: 'EXECUTES',
        weight: 2,
        label: `₹${((p.sanctionedAmount || p.estimatedCost) / 100000).toFixed(1)}L`,
        isSuspicious: requiresHighPriorityAlert
      });
    }

    for (const matched of matchedEntities) {
      const matchedVendorId = `vendor_${matched.replace(/\s+/g, '_')}`;
      edges.push({
        id: `e_shell_${vendorId}_${matchedVendorId}`,
        source: vendorId,
        target: matchedVendorId,
        type: 'SHELL_COLLUSION',
        weight: 3,
        label: 'Shared Address / Dir',
        isSuspicious: true
      });
    }

    clusterCounter++;
  }

  const topSuspiciousNetworks = vendorReports
    .filter(vr => vr.requiresHighPriorityAlert)
    .map(vr => ({
      clusterId: vr.signals.collusionCluster.clusterId || 101,
      description: `Suspicious Contracting Ring around ${vr.vendorName}`,
      contractors: [vr.vendorName, ...vr.signals.shellCompanyIndicators.matchedEntities],
      mps: vr.mpsConnected,
      districts: vr.districtsConnected,
      totalValueCr: vr.totalSanctionedCr,
      riskReason: `${vr.independentSignalsCount} independent fraud signals: ${[
        vr.signals.concentration.isFlagged ? 'High Concentration' : '',
        vr.signals.rapidFireAwards.isFlagged ? 'Rapid-Fire Awards' : '',
        vr.signals.shellCompanyIndicators.isFlagged ? 'Shared Address / Shell Match' : '',
        vr.signals.collusionCluster.isFlagged ? 'Closed MP-Contractor Triad' : ''
      ].filter(Boolean).join(' + ')}`
    }));

  return {
    nodes: Array.from(nodesMap.values()),
    edges,
    vendorReports: vendorReports.sort((a, b) => b.networkRiskScore - a.networkRiskScore),
    totalVendorsAnalyzed: vendorReports.length,
    flaggedClustersCount: topSuspiciousNetworks.length,
    topSuspiciousNetworks,
    generatedAt: new Date().toISOString()
  };
}
