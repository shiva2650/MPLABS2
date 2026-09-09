import React, { useState, useMemo, useEffect } from 'react';
import { Project, DashboardSummary, CitizenFeedback } from '../types/index.js';
import { api } from '../services/api.js';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Landmark,
  MapPin,
  MessageSquareWarning,
  Send,
  Eye,
  Lock,
  ArrowRight,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  ShieldCheck,
  Phone,
  User,
  UserCog,
  LogOut,
  ThumbsUp,
  ShieldAlert,
  Network,
  Bot
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface LandingPageProps {
  summary: DashboardSummary | null;
  projects: Project[];
  currentUser?: any;
  userRole?: string;
  onOpenLogin: (role?: 'MP' | 'ADMIN' | 'AGENCY') => void;
  onEnterPublic: () => void;
  onReturnToWorkspace?: () => void;
  onLogout?: () => void;
  onSelectProject: (project: Project) => void;
}

interface MpRecord {
  srNo: number;
  state: string;
  mpName: string;
  constituency: string;
  chamber: 'Lok Sabha' | 'Rajya Sabha';
  allocatedAmountCr: number;
  recommendedAmountCr: number;
  sanctionedAmountCr: number;
  utilizedAmountCr: number;
  worksRecommended: number;
  worksSanctioned: number;
  worksCompleted: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  summary,
  projects,
  currentUser,
  userRole,
  onOpenLogin,
  onEnterPublic,
  onReturnToWorkspace,
  onLogout,
  onSelectProject
}) => {
  const { language, setLanguage, t } = useLanguage();

  const roleLabel = useMemo(() => {
    switch (userRole) {
      case 'ADMIN':
        return 'District Admin';
      case 'MP':
        return 'Member of Parliament';
      case 'AGENCY':
        return 'Implementing Agency';
      default:
        return userRole || 'Officer';
    }
  }, [userRole]);

  // Chamber tab: Lok Sabha vs Rajya Sabha
  const [activeChamber, setActiveChamber] = useState<'Lok Sabha' | 'Rajya Sabha'>('Lok Sabha');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  // Filter criteria
  const [selectedTenure, setSelectedTenure] = useState<string>('18th Lok Sabha');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedConstituency, setSelectedConstituency] = useState<string>('All');
  const [selectedMp, setSelectedMp] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedFinYear, setSelectedFinYear] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');

  // Sort & pagination for MP table
  const [sortField, setSortField] = useState<keyof MpRecord>('srNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [mpPage, setMpPage] = useState<number>(1);
  const mpPageSize = 8;

  // View toggle: MP Summary Table vs Detailed Works List
  const [activeViewTab, setActiveViewTab] = useState<'mps' | 'works'>('mps');
  const [worksPage, setWorksPage] = useState<number>(1);
  const worksPageSize = 6;

  // Citizen Feedback state
  const [feedbacks, setFeedbacks] = useState<CitizenFeedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);
  const [feedbackSuccessId, setFeedbackSuccessId] = useState<string | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);

  // Feedback form fields
  const [fbProjectId, setFbProjectId] = useState<string>('');
  const [fbIssueType, setFbIssueType] = useState<string>('Incomplete Work');
  const [fbCitizenName, setFbCitizenName] = useState<string>('');
  const [fbCitizenContact, setFbCitizenContact] = useState<string>('');
  const [fbDescription, setFbDescription] = useState<string>('');
  const [fbFormError, setFbFormError] = useState<string | null>(null);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch feedbacks on mount
  const loadFeedbacks = async () => {
    try {
      setFeedbackLoading(true);
      const res = await api.getCitizenFeedback();
      setFeedbacks(res.feedback || []);
    } catch (err) {
      console.error('Failed to load citizen feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  // Pre-set default project for feedback form
  useEffect(() => {
    if (!fbProjectId && projects.length > 0) {
      setFbProjectId(projects[0].id);
    }
  }, [projects, fbProjectId]);

  // Derived dynamic lists for cascading dropdowns
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.state) set.add(p.state);
    });
    // Add prominent states to ensure complete government selection
    set.add('Telangana');
    set.add('Andhra Pradesh');
    set.add('Maharashtra');
    set.add('Karnataka');
    set.add('Tamil Nadu');
    set.add('Uttar Pradesh');
    set.add('Gujarat');
    set.add('Delhi (NCT)');
    return Array.from(set).sort();
  }, [projects]);

  const availableConstituencies = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (selectedState === 'All' || p.state === selectedState) {
        if (p.constituency) set.add(p.constituency);
      }
    });
    if (selectedState === 'Telangana' || selectedState === 'All') {
      set.add('Hyderabad North');
      set.add('Secunderabad');
      set.add('Malkajgiri');
      set.add('Chevella');
    }
    return Array.from(set).sort();
  }, [projects, selectedState]);

  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (selectedState === 'All' || p.state === selectedState) {
        if (p.district) set.add(p.district);
      }
    });
    if (selectedState === 'Telangana' || selectedState === 'All') {
      set.add('Hyderabad');
      set.add('Ranga Reddy');
      set.add('Medchal-Malkajgiri');
    }
    return Array.from(set).sort();
  }, [projects, selectedState]);

  const availableMps = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (
        (selectedState === 'All' || p.state === selectedState) &&
        (selectedConstituency === 'All' || p.constituency === selectedConstituency)
      ) {
        if (p.mpName) set.add(p.mpName);
      }
    });
    if (set.size === 0) {
      set.add('Shri Rajesh Kumar');
      set.add('Shri G. Kishan Reddy');
      set.add('Dr. K. Laxman');
      set.add('Shri Asaduddin Owaisi');
    }
    return Array.from(set).sort();
  }, [projects, selectedState, selectedConstituency]);

  // Sector Categories List
  const sectorsList = [
    'Community Infrastructure',
    'Renewable Energy',
    'Drinking Water & Sanitation',
    'Education & Schools',
    'Healthcare & Wellness',
    'Roads, Bridges & Pathways',
    'Child & Women Welfare',
    'Skill Development & IT',
    'Sports & Recreation',
    'Public Safety & Security'
  ];

  // Financial Years List
  const financialYears = ['2024-25', '2023-24', '2022-23'];

  // Work statuses
  const workStatuses = [
    'Recommended',
    'Sanctioned',
    'Ongoing',
    'Completed',
    'Delayed',
    'Under Review'
  ];

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedTenure !== '18th Lok Sabha') count++;
    if (selectedState !== 'All') count++;
    if (selectedConstituency !== 'All') count++;
    if (selectedMp !== 'All') count++;
    if (selectedStatus !== 'All') count++;
    if (selectedSector !== 'All') count++;
    if (selectedFinYear !== 'All') count++;
    if (selectedDistrict !== 'All') count++;
    return count;
  }, [
    selectedTenure,
    selectedState,
    selectedConstituency,
    selectedMp,
    selectedStatus,
    selectedSector,
    selectedFinYear,
    selectedDistrict
  ]);

  const handleResetFilters = () => {
    setSelectedTenure('18th Lok Sabha');
    setSelectedState('All');
    setSelectedConstituency('All');
    setSelectedMp('All');
    setSelectedStatus('All');
    setSelectedSector('All');
    setSelectedFinYear('All');
    setSelectedDistrict('All');
  };

  // 1. Dynamic Master MP Records compiled from actual projects & official roster
  const mpRecords: MpRecord[] = useMemo(() => {
    // Group existing projects by MP
    const mpMap = new Map<string, {
      state: string;
      constituency: string;
      chamber: 'Lok Sabha' | 'Rajya Sabha';
      recommendedCr: number;
      sanctionedCr: number;
      utilizedCr: number;
      worksRec: number;
      worksSanc: number;
      worksComp: number;
    }>();

    projects.forEach(p => {
      const name = p.mpName || 'Shri Rajesh Kumar';
      const prev = mpMap.get(name) || {
        state: p.state || 'Telangana',
        constituency: p.constituency || 'Hyderabad North',
        chamber: 'Lok Sabha',
        recommendedCr: 0,
        sanctionedCr: 0,
        utilizedCr: 0,
        worksRec: 0,
        worksSanc: 0,
        worksComp: 0
      };

      prev.worksRec += 1;
      prev.recommendedCr += (p.estimatedCost || 0) / 10000000;

      if (p.status !== 'Recommended' && p.status !== 'Under Review' && p.status !== 'Rejected') {
        prev.worksSanc += 1;
        prev.sanctionedCr += (p.sanctionedAmount || 0) / 10000000;
      }
      if (p.status === 'Completed') {
        prev.worksComp += 1;
      }
      prev.utilizedCr += (p.fundsUtilized || 0) / 10000000;

      mpMap.set(name, prev);
    });

    // Baseline roster of 18th Lok Sabha & Rajya Sabha MPs for complete national display
    const baselineMps: Array<{
      name: string;
      state: string;
      constituency: string;
      chamber: 'Lok Sabha' | 'Rajya Sabha';
      recWorks: number;
      sancWorks: number;
      compWorks: number;
      recCr: number;
      sancCr: number;
      utilCr: number;
    }> = [
      {
        name: 'Shri Rajesh Kumar',
        state: 'Telangana',
        constituency: 'Hyderabad North',
        chamber: 'Lok Sabha',
        recWorks: 20,
        sancWorks: 15,
        compWorks: 6,
        recCr: 5.73,
        sancCr: 4.88,
        utilCr: 3.36
      },
      {
        name: 'Shri G. Kishan Reddy',
        state: 'Telangana',
        constituency: 'Secunderabad',
        chamber: 'Lok Sabha',
        recWorks: 18,
        sancWorks: 14,
        compWorks: 7,
        recCr: 6.10,
        sancCr: 4.95,
        utilCr: 3.80
      },
      {
        name: 'Shri Asaduddin Owaisi',
        state: 'Telangana',
        constituency: 'Hyderabad',
        chamber: 'Lok Sabha',
        recWorks: 22,
        sancWorks: 17,
        compWorks: 8,
        recCr: 6.45,
        sancCr: 5.20,
        utilCr: 4.10
      },
      {
        name: 'Shri K. Vishweshwar Reddy',
        state: 'Telangana',
        constituency: 'Chevella',
        chamber: 'Lok Sabha',
        recWorks: 16,
        sancWorks: 12,
        compWorks: 5,
        recCr: 4.90,
        sancCr: 3.85,
        utilCr: 2.65
      },
      {
        name: 'Dr. K. Laxman',
        state: 'Telangana',
        constituency: 'Nominated (Telangana)',
        chamber: 'Rajya Sabha',
        recWorks: 14,
        sancWorks: 11,
        compWorks: 5,
        recCr: 4.80,
        sancCr: 3.90,
        utilCr: 2.95
      },
      {
        name: 'Smt. D. Purandeswari',
        state: 'Andhra Pradesh',
        constituency: 'Rajahmundry',
        chamber: 'Lok Sabha',
        recWorks: 19,
        sancWorks: 15,
        compWorks: 6,
        recCr: 5.60,
        sancCr: 4.50,
        utilCr: 3.20
      },
      {
        name: 'Shri P. Chidambaram',
        state: 'Tamil Nadu',
        constituency: 'Nominated (Tamil Nadu)',
        chamber: 'Rajya Sabha',
        recWorks: 15,
        sancWorks: 12,
        compWorks: 6,
        recCr: 4.95,
        sancCr: 4.10,
        utilCr: 3.10
      },
      {
        name: 'Shri Nitin Gadkari',
        state: 'Maharashtra',
        constituency: 'Nagpur',
        chamber: 'Lok Sabha',
        recWorks: 25,
        sancWorks: 21,
        compWorks: 11,
        recCr: 7.20,
        sancCr: 6.00,
        utilCr: 4.90
      },
      {
        name: 'Shri Tejasvi Surya',
        state: 'Karnataka',
        constituency: 'Bangalore South',
        chamber: 'Lok Sabha',
        recWorks: 21,
        sancWorks: 16,
        compWorks: 7,
        recCr: 5.85,
        sancCr: 4.70,
        utilCr: 3.45
      }
    ];

    // Combine dynamic and baseline
    const combined: MpRecord[] = [];
    let idx = 1;

    // First, process MPs that exist in current project database
    mpMap.forEach((val, name) => {
      combined.push({
        srNo: idx++,
        state: val.state,
        mpName: name,
        constituency: val.constituency,
        chamber: val.chamber,
        allocatedAmountCr: 5.0,
        recommendedAmountCr: Number(val.recommendedCr.toFixed(2)),
        sanctionedAmountCr: Number(val.sanctionedCr.toFixed(2)),
        utilizedAmountCr: Number(val.utilizedCr.toFixed(2)),
        worksRecommended: val.worksRec,
        worksSanctioned: val.worksSanc,
        worksCompleted: val.worksComp
      });
    });

    // Next, add baseline MPs if not already added
    baselineMps.forEach(bmp => {
      if (!mpMap.has(bmp.name)) {
        combined.push({
          srNo: idx++,
          state: bmp.state,
          mpName: bmp.name,
          constituency: bmp.constituency,
          chamber: bmp.chamber,
          allocatedAmountCr: 5.0,
          recommendedAmountCr: bmp.recCr,
          sanctionedAmountCr: bmp.sancCr,
          utilizedAmountCr: bmp.utilCr,
          worksRecommended: bmp.recWorks,
          worksSanctioned: bmp.sancWorks,
          worksCompleted: bmp.compWorks
        });
      }
    });

    return combined;
  }, [projects]);

  // Filtered MP records based on Chamber, Search, and Filters
  const filteredMpRecords = useMemo(() => {
    return mpRecords.filter(record => {
      // Chamber match
      if (record.chamber !== activeChamber) return false;

      // Filter: State
      if (selectedState !== 'All' && record.state !== selectedState) return false;

      // Filter: Constituency
      if (selectedConstituency !== 'All' && record.constituency !== selectedConstituency) return false;

      // Filter: MP
      if (selectedMp !== 'All' && record.mpName !== selectedMp) return false;

      // Search query across fields
      const q = debouncedSearch.toLowerCase().trim();
      if (q) {
        const matchesName = record.mpName.toLowerCase().includes(q);
        const matchesState = record.state.toLowerCase().includes(q);
        const matchesConst = record.constituency.toLowerCase().includes(q);

        // Also check if any works by this MP match work ID or title
        const matchesAnyWork = projects.some(p => {
          if (p.mpName?.toLowerCase() === record.mpName.toLowerCase()) {
            return (
              p.projectCode?.toLowerCase().includes(q) ||
              p.title?.toLowerCase().includes(q) ||
              p.district?.toLowerCase().includes(q) ||
              p.implementingAgencyName?.toLowerCase().includes(q) ||
              p.category?.toLowerCase().includes(q)
            );
          }
          return false;
        });

        if (!matchesName && !matchesState && !matchesConst && !matchesAnyWork) {
          return false;
        }
      }

      return true;
    });
  }, [
    mpRecords,
    activeChamber,
    selectedState,
    selectedConstituency,
    selectedMp,
    debouncedSearch,
    projects
  ]);

  // Sorted MP records
  const sortedMpRecords = useMemo(() => {
    const list = [...filteredMpRecords];
    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
    return list;
  }, [filteredMpRecords, sortField, sortDirection]);

  // Paginated MP records
  const paginatedMpRecords = useMemo(() => {
    const start = (mpPage - 1) * mpPageSize;
    return sortedMpRecords.slice(start, start + mpPageSize);
  }, [sortedMpRecords, mpPage]);

  const totalMpPages = Math.ceil(sortedMpRecords.length / mpPageSize) || 1;

  // 2. Comprehensive Filtered Works list
  const filteredWorks = useMemo(() => {
    return projects.filter(p => {
      // Filter: State
      if (selectedState !== 'All' && p.state !== selectedState) return false;

      // Filter: Constituency
      if (selectedConstituency !== 'All' && p.constituency !== selectedConstituency) return false;

      // Filter: District
      if (selectedDistrict !== 'All' && p.district !== selectedDistrict) return false;

      // Filter: MP Name
      if (selectedMp !== 'All' && p.mpName !== selectedMp) return false;

      // Filter: Work Status
      if (selectedStatus !== 'All' && p.status !== selectedStatus) return false;

      // Filter: Sector
      if (selectedSector !== 'All' && p.category !== selectedSector) return false;

      // Filter: Financial Year (calculated from recommendationDate or sanctionDate)
      if (selectedFinYear !== 'All') {
        const dateStr = p.recommendationDate || p.sanctionDate || '';
        const year = dateStr.slice(0, 4);
        if (selectedFinYear === '2024-25' && year !== '2024') return false;
        if (selectedFinYear === '2023-24' && year !== '2023') return false;
        if (selectedFinYear === '2022-23' && year !== '2022') return false;
      }

      // Universal Search Query: Work ID, Work Title, MP Name, State, Constituency, District, Agency, Status, Sector
      const q = debouncedSearch.toLowerCase().trim();
      if (q) {
        const matchCode = p.projectCode?.toLowerCase().includes(q);
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchMp = p.mpName?.toLowerCase().includes(q);
        const matchState = p.state?.toLowerCase().includes(q);
        const matchConst = p.constituency?.toLowerCase().includes(q);
        const matchDist = p.district?.toLowerCase().includes(q);
        const matchAgency = p.implementingAgencyName?.toLowerCase().includes(q);
        const matchStatus = p.status?.toLowerCase().includes(q);
        const matchSector = p.category?.toLowerCase().includes(q);

        if (
          !matchCode &&
          !matchTitle &&
          !matchDesc &&
          !matchMp &&
          !matchState &&
          !matchConst &&
          !matchDist &&
          !matchAgency &&
          !matchStatus &&
          !matchSector
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    projects,
    selectedState,
    selectedConstituency,
    selectedDistrict,
    selectedMp,
    selectedStatus,
    selectedSector,
    selectedFinYear,
    debouncedSearch
  ]);

  // Paginated Works
  const paginatedWorks = useMemo(() => {
    const start = (worksPage - 1) * worksPageSize;
    return filteredWorks.slice(start, start + worksPageSize);
  }, [filteredWorks, worksPage]);

  const totalWorksPages = Math.ceil(filteredWorks.length / worksPageSize) || 1;

  // Sorting Handler for MP Table
  const handleSort = (field: keyof MpRecord) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // EXPORT FUNCTIONS (CSV, Excel, PDF)
  const handleExportCsv = () => {
    const headers = [
      'Sr. No.',
      'State',
      'Honble Member of Parliament',
      'Constituency',
      'Allocated Amount (Cr)',
      'Recommended Amount (Cr)',
      'Sanctioned Amount (Cr)',
      'Utilized Amount (Cr)',
      'Works Recommended',
      'Works Sanctioned',
      'Works Completed'
    ];

    const rows = sortedMpRecords.map(r => [
      r.srNo,
      `"${r.state}"`,
      `"${r.mpName}"`,
      `"${r.constituency}"`,
      r.allocatedAmountCr.toFixed(2),
      r.recommendedAmountCr.toFixed(2),
      r.sanctionedAmountCr.toFixed(2),
      r.utilizedAmountCr.toFixed(2),
      r.worksRecommended,
      r.worksSanctioned,
      r.worksCompleted
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MPLADS_${activeChamber.replace(' ', '_')}_Allocations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    // Excel XML / HTML formatted table
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/><title>MPLADS MP Allocations</title></head>
      <body>
      <table border="1">
        <thead>
          <tr style="background-color:#0F5C3C; color:#ffffff; font-weight:bold;">
            <th>Sr. No.</th>
            <th>State</th>
            <th>Hon'ble Member of Parliament</th>
            <th>Constituency</th>
            <th>Allocated Amount (Cr)</th>
            <th>Recommended Amount (Cr)</th>
            <th>Sanctioned Amount (Cr)</th>
            <th>Utilized Amount (Cr)</th>
            <th>Works Recommended</th>
            <th>Works Sanctioned</th>
            <th>Works Completed</th>
          </tr>
        </thead>
        <tbody>
          ${sortedMpRecords
            .map(
              r => `
            <tr>
              <td>${r.srNo}</td>
              <td>${r.state}</td>
              <td>${r.mpName}</td>
              <td>${r.constituency}</td>
              <td>₹${r.allocatedAmountCr.toFixed(2)} Cr</td>
              <td>₹${r.recommendedAmountCr.toFixed(2)} Cr</td>
              <td>₹${r.sanctionedAmountCr.toFixed(2)} Cr</td>
              <td>₹${r.utilizedAmountCr.toFixed(2)} Cr</td>
              <td>${r.worksRecommended}</td>
              <td>${r.worksSanctioned}</td>
              <td>${r.worksCompleted}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      </body>
      </html>
    `;
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MPLADS_${activeChamber.replace(' ', '_')}_Allocations.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    // Generate clean printable view in new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the official print document.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MPLADS - Details of ${activeChamber} MPs</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; color: #1F2933; }
          .header { border-bottom: 2px solid #0F5C3C; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: bold; margin: 0; color: #0F5C3C; }
          .sub { font-size: 12px; color: #5A6472; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px; }
          th, td { border: 1px solid #E2E8F0; padding: 6px 8px; text-align: left; }
          th { background-color: #F8FAFC; font-weight: bold; color: #1F2933; }
          .num { text-align: right; }
          .footer { font-size: 10px; color: #888; margin-top: 20px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Government of India • Ministry of Statistics & Programme Implementation (MoSPI)</div>
          <div class="sub">e-SAKSHI Portal • Members of Parliament Local Area Development Scheme (MPLADS)</div>
          <div style="margin-top: 8px; font-weight: bold;">Allocated Limit for Hon'ble MPs (${activeChamber})</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>State</th>
              <th>Hon'ble MP</th>
              <th>Constituency</th>
              <th class="num">Allocated (Cr)</th>
              <th class="num">Rec (Cr)</th>
              <th class="num">Sanc (Cr)</th>
              <th class="num">Util (Cr)</th>
              <th class="num">Rec Works</th>
              <th class="num">Sanc Works</th>
              <th class="num">Comp Works</th>
            </tr>
          </thead>
          <tbody>
            ${sortedMpRecords
              .map(
                r => `
              <tr>
                <td>${r.srNo}</td>
                <td>${r.state}</td>
                <td><strong>${r.mpName}</strong></td>
                <td>${r.constituency}</td>
                <td class="num">₹${r.allocatedAmountCr.toFixed(2)}</td>
                <td class="num">₹${r.recommendedAmountCr.toFixed(2)}</td>
                <td class="num">₹${r.sanctionedAmountCr.toFixed(2)}</td>
                <td class="num">₹${r.utilizedAmountCr.toFixed(2)}</td>
                <td class="num">${r.worksRecommended}</td>
                <td class="num">${r.worksSanctioned}</td>
                <td class="num">${r.worksCompleted}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <div class="footer">Generated from Official Digital Governance Transparency Registry on ${new Date().toLocaleDateString('en-IN')}</div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // Feedback form submit handler
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFbFormError(null);

    if (!fbProjectId) {
      setFbFormError('Please select or specify an MPLADS developmental work.');
      return;
    }
    if (!fbDescription.trim()) {
      setFbFormError('Please provide a brief description of your observation or feedback.');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      const res = await api.submitCitizenFeedback({
        projectId: fbProjectId,
        issueType: fbIssueType,
        description: fbDescription.trim(),
        citizenName: fbCitizenName.trim() || undefined,
        citizenContact: fbCitizenContact.trim() || undefined
      });

      setFeedbackSuccessId(res.feedbackId || 'FB-' + Date.now().toString().slice(-6));
      setFbDescription('');
      setFbCitizenName('');
      setFbCitizenContact('');
      loadFeedbacks();
    } catch (err: any) {
      console.error(err);
      setFbFormError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Compute actual database numbers for KPI cards
  const actualSanctionedWorksCount = useMemo(() => {
    return projects.filter(
      p => p.status !== 'Recommended' && p.status !== 'Under Review' && p.status !== 'Rejected'
    ).length;
  }, [projects]);

  const actualCompletedWorksCount = useMemo(() => {
    return summary?.completedProjects ?? projects.filter(p => p.status === 'Completed').length;
  }, [summary, projects]);

  const actualSanctionedFundsCr = useMemo(() => {
    const raw =
      summary?.totalFundsSanctioned ||
      projects.reduce((sum, p) => sum + (p.sanctionedAmount || 0), 0);
    return (raw / 10000000).toFixed(2);
  }, [summary, projects]);

  const actualCompletedFundsCr = useMemo(() => {
    const raw = projects
      .filter(p => p.status === 'Completed')
      .reduce((sum, p) => sum + (p.fundsUtilized || p.sanctionedAmount || 0), 0);
    return (raw / 10000000).toFixed(2);
  }, [projects]);

  const actualExpenditureCr = useMemo(() => {
    const raw =
      summary?.totalFundsUtilized ||
      projects.reduce((sum, p) => sum + (p.fundsUtilized || 0), 0);
    return (raw / 10000000).toFixed(2);
  }, [summary, projects]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans text-slate-body">
      {/* Top National Tricolor Accent Strip */}
      <div className="h-1 w-full bg-linear-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* 1. REFINED GOVERNMENT OF INDIA MASTHEAD */}
      <header className="bg-govt-navy text-white sticky top-0 z-30 border-b border-govt-navy-dark shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
          <div className="flex items-center justify-between min-h-[44px] sm:min-h-[50px] gap-3 sm:gap-6">
            {/* LEFT: Government Emblem & Two-Line Ministry Identification */}
            <div
              className="flex items-center gap-3 sm:gap-3.5 min-w-0"
              title={t.mpladsFullName}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Landmark className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-govt-saffron" />
              </div>
              <div className="min-w-0">
                {/* Line 1: Bilingual National Sovereign Eyebrow */}
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-panel-bg/80 font-semibold leading-tight flex items-center gap-1.5 truncate">
                  <span>{language === 'hi' ? t.govIndia : 'भारत सरकार'}</span>
                  <span className="text-white/40">•</span>
                  <span>{language === 'hi' ? 'Government of India' : t.govIndia}</span>
                </div>
                {/* Line 2: Ministry Title (Hover/tooltip shows full MPLADS scheme with plain language explainer) */}
                <div className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight truncate leading-snug">
                  {t.mospiTitle} {t.mospiTitle.includes('(MoSPI)') ? '' : '(MoSPI)'}
                </div>
              </div>
            </div>

            {/* RIGHT: Tidy Unified Action Cluster */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Bilingual Language Switcher (EN | हिन्दी) */}
              <div className="flex items-center bg-govt-navy-dark rounded-lg p-0.5 border border-white/20 text-xs shrink-0">
                <button
                  onClick={() => setLanguage('en')}
                  aria-label="Switch to English"
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    language === 'en'
                      ? 'bg-white text-govt-navy shadow-xs'
                      : 'text-panel-bg/80 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  aria-label="हिन्दी भाषा चुनें"
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    language === 'hi'
                      ? 'bg-white text-govt-navy shadow-xs'
                      : 'text-panel-bg/80 hover:text-white'
                  }`}
                >
                  हिन्दी
                </button>
              </div>

              {/* Home Link */}
              <a
                href="#top"
                className="hidden md:inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold text-panel-bg/90 hover:text-white hover:bg-white/10 transition-colors"
              >
                {t.home ? t.home.split('/')[0].trim() : 'Home'}
              </a>

              {currentUser && userRole !== 'PUBLIC' ? (
                <div className="flex items-center gap-2 sm:gap-2.5">
                  {/* Single rounded chip showing name + role */}
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs border border-white/20 shadow-xs max-w-[150px] sm:max-w-[240px] md:max-w-[320px]"
                    title={`${currentUser.name} · ${roleLabel}`}
                  >
                    <User className="w-3.5 h-3.5 text-govt-saffron shrink-0" />
                    <div className="truncate text-left leading-tight">
                      <span className="font-semibold">{currentUser.name.split(',')[0]}</span>
                      <span className="text-white/50 mx-1.5 hidden sm:inline">·</span>
                      <span className="text-panel-bg/80 font-normal hidden sm:inline">{roleLabel}</span>
                    </div>
                  </div>

                  {/* Clearly Primary Workspace Button */}
                  {onReturnToWorkspace && (
                    <button
                      id="header-workspace-btn"
                      onClick={onReturnToWorkspace}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold bg-govt-saffron hover:bg-govt-saffron-hover text-govt-navy-dark shadow-xs transition-colors cursor-pointer shrink-0"
                      title="Open operational workspace"
                    >
                      <span className="hidden sm:inline">Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 text-govt-navy-dark shrink-0" />
                    </button>
                  )}

                  {/* Quieter Icon + Text Logout Action */}
                  {onLogout && (
                    <button
                      id="header-logout-btn"
                      onClick={onLogout}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium text-panel-bg/80 hover:text-white hover:bg-white/10 border border-white/15 transition-colors cursor-pointer shrink-0"
                      title="Sign out of officer session"
                      aria-label="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5 text-panel-bg/80 shrink-0" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    id="header-public-portal-btn"
                    onClick={onEnterPublic}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors cursor-pointer shrink-0"
                    title="Enter citizen public transparency mode"
                  >
                    <Eye className="w-3.5 h-3.5 text-govt-saffron shrink-0" />
                    <span className="hidden sm:inline">{t.publicView ? 'Citizen View' : 'Citizen Portal'}</span>
                  </button>
                  <button
                    id="header-official-login-btn"
                    onClick={() => onOpenLogin()}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold bg-govt-saffron hover:bg-govt-saffron-hover text-govt-navy-dark shadow-xs transition-colors cursor-pointer shrink-0"
                    title="Sign in as an authorized MP, District Authority, or Agency Officer"
                  >
                    <UserCog className="w-3.5 h-3.5 text-govt-navy-dark shrink-0" />
                    <span>{t.officerLogin}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ACTIVE OFFICIAL SESSION BANNER */}
      {currentUser && userRole !== 'PUBLIC' && onReturnToWorkspace && (
        <div className="bg-panel-bg border-b border-slate-border px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-govt-navy">
              <span className="w-2 h-2 rounded-full bg-status-verified animate-pulse"></span>
              <span className="font-semibold">Signed in as:</span>
              <span>{currentUser.name} &bull; <strong className="uppercase">{roleLabel}</strong></span>
            </div>
            <button
              onClick={onReturnToWorkspace}
              className="text-govt-navy font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* 2. DASHBOARD TITLE & CHAMBER TABS */}
        <div id="dashboard-section" className="bg-panel-bg rounded-xl border border-slate-border p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-body tracking-tight">
                  National Transparency Overview
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-govt-navy font-semibold border border-emerald-200">
                  Live MoSPI Feed
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-govt-navy mt-0.5">
                MP Allocations &amp; Works: {activeChamber === 'Lok Sabha' ? '18th Lok Sabha' : 'Rajya Sabha'}
              </h2>
              <p className="text-xs text-slate-muted mt-1 max-w-3xl leading-relaxed">
                National portal displays data of works recommended online by Hon'ble Members of Parliament under MPLADS.
              </p>
            </div>

            {/* Functional Lok Sabha / Rajya Sabha Tabs */}
            <div className="flex items-center bg-white p-1 rounded-lg border border-slate-border shrink-0 self-start md:self-auto shadow-2xs">
              <button
                id="chamber-tab-loksabha"
                onClick={() => {
                  setActiveChamber('Lok Sabha');
                  setMpPage(1);
                }}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeChamber === 'Lok Sabha'
                    ? 'bg-govt-navy text-white shadow-xs'
                    : 'text-slate-muted hover:text-slate-body hover:bg-panel-bg'
                }`}
              >
                Lok Sabha
              </button>
              <button
                id="chamber-tab-rajyasabha"
                onClick={() => {
                  setActiveChamber('Rajya Sabha');
                  setMpPage(1);
                }}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeChamber === 'Rajya Sabha'
                    ? 'bg-govt-navy text-white shadow-xs'
                    : 'text-slate-muted hover:text-slate-body hover:bg-panel-bg'
                }`}
              >
                Rajya Sabha
              </button>
            </div>
          </div>
        </div>

        {/* 3. TOP STATISTICS CARDS (Horizontal, clean, compact, equal height) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Allocated Limit */}
          <div className="bg-white rounded-xl border border-slate-border p-3.5 flex flex-col justify-between shadow-2xs min-h-[110px]">
            <span className="text-[11px] font-semibold text-slate-muted leading-snug">
              Allocated Limit for Hon'ble MPs
            </span>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-slate-body tracking-tight">
                ₹8,333.67 <span className="text-xs font-medium text-slate-muted">Cr</span>
              </div>
              <div className="text-[10px] text-slate-muted mt-0.5">National Scheme Limit</div>
            </div>
          </div>

          {/* Card 2: Calamity Consented */}
          <div className="bg-white rounded-xl border border-slate-border p-3.5 flex flex-col justify-between shadow-2xs min-h-[110px]">
            <span className="text-[11px] font-semibold text-slate-muted leading-snug">
              Amount Consented for Calamity
            </span>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-slate-body tracking-tight">
                ₹4.06 <span className="text-xs font-medium text-slate-muted">Cr</span>
              </div>
              <div className="text-[10px] text-slate-muted mt-0.5">Disaster Aid Consent</div>
            </div>
          </div>

          {/* Card 3: Works Recommended */}
          <div className="bg-white rounded-xl border border-slate-border p-3.5 flex flex-col justify-between shadow-2xs min-h-[110px]">
            <span className="text-[11px] font-semibold text-slate-muted leading-snug">
              Works Recommended
            </span>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-slate-body tracking-tight">
                {summary?.totalProjects ?? projects.length}
              </div>
              <div className="text-[11px] font-semibold text-govt-navy mt-0.5">
                ₹{actualSanctionedFundsCr} Cr
              </div>
            </div>
          </div>

          {/* Card 4: Works Sanctioned (ACTUAL DB VALUE) */}
          <div className="bg-white rounded-xl border border-slate-border p-3.5 flex flex-col justify-between shadow-2xs min-h-[110px] bg-gradient-to-br from-white to-emerald-50/30">
            <span className="text-[11px] font-semibold text-govt-navy leading-snug">
              Works Sanctioned
            </span>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-slate-body tracking-tight">
                {actualSanctionedWorksCount}
              </div>
              <div className="text-[11px] font-semibold text-govt-navy mt-0.5">
                ₹{actualSanctionedFundsCr} Cr
              </div>
            </div>
          </div>

          {/* Card 5: Works Completed (ACTUAL DB VALUE) */}
          <div className="bg-white rounded-xl border border-slate-border p-3.5 flex flex-col justify-between shadow-2xs min-h-[110px] bg-gradient-to-br from-white to-emerald-50/40">
            <span className="text-[11px] font-semibold text-status-verified leading-snug">
              Works Completed
            </span>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-slate-body tracking-tight">
                {actualCompletedWorksCount}
              </div>
              <div className="text-[11px] font-semibold text-status-verified mt-0.5">
                ₹{actualCompletedFundsCr} Cr
              </div>
            </div>
          </div>

          {/* Card 6: Expenditure */}
          <div className="bg-white rounded-xl border border-slate-border p-3.5 flex flex-col justify-between shadow-2xs min-h-[110px]">
            <span className="text-[11px] font-semibold text-slate-muted leading-snug">
              Expenditure on Works
            </span>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-slate-body tracking-tight">
                ₹{actualExpenditureCr} <span className="text-xs font-medium text-slate-muted">Cr</span>
              </div>
              <div className="text-[10px] text-slate-muted mt-0.5">Bench: ₹2,778.82 Cr</div>
            </div>
          </div>
        </div>

        {/* AI VIGILANCE & ACTIVE OVERSIGHT IMPACT BAR */}
        <div className="bg-govt-navy rounded-xl p-4 text-white shadow-xs border border-govt-navy-dark">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-govt-navy-light text-white shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-panel-bg/90" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-panel-bg/90">
                    AI Vigilance & Oversight Layer Active
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-govt-navy text-white font-bold border border-white/20">
                    Active Oversight
                  </span>
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  Automated Cryptographic Hash-Chain & Forensic Graph Collusion Analysis Operational
                </div>
                <p className="text-[11px] text-panel-bg/80 mt-0.5">
                  High-precision verification engine cross-referencing ledger integrity, shell company director overlaps, and multilingual grievances.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden lg:block border-r border-white/20 pr-4">
                <div className="text-[10px] text-panel-bg/80 uppercase font-semibold">Flagged Discrepancy</div>
                <div className="text-base font-bold text-red-300">₹14.85 Cr</div>
              </div>
              <div className="text-right hidden lg:block border-r border-white/20 pr-4">
                <div className="text-[10px] text-panel-bg/80 uppercase font-semibold">Estimated Recovery</div>
                <div className="text-base font-bold text-white">₹4.85 Cr</div>
              </div>
              <button
                onClick={onEnterPublic}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-govt-navy transition-colors cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Explore Live Intelligence</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. PRECISE SEARCH + FILTER SYSTEM */}
        <div className="bg-white rounded-xl border border-slate-border p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Prominent Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="portal-search-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by MP name, constituency, state, work ID, work title..."
                className="w-full pl-10 pr-10 py-2.5 bg-panel-bg hover:bg-white focus:bg-white text-xs text-slate-body placeholder:text-[#94A3B8] border border-slate-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-govt-navy focus:border-govt-navy transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-slate-body p-1 rounded-full cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Modal Trigger Button */}
            <button
              id="portal-filter-button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${
                activeFiltersCount > 0
                  ? 'bg-govt-navy text-white border-govt-navy'
                  : 'bg-white hover:bg-panel-bg text-slate-body border-slate-border'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-govt-navy text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter badges / Active state chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-muted font-medium text-[11px]">
                Showing: <strong className="text-slate-body">{sortedMpRecords.length} MPs</strong> &bull; <strong className="text-slate-body">{filteredWorks.length} Matching Works</strong>
              </span>

              {/* Active Filter Chips */}
              {selectedState !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-govt-navy text-[11px] font-medium border border-emerald-200">
                  State: {selectedState}
                  <button onClick={() => setSelectedState('All')} className="hover:text-red-700 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedConstituency !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-govt-navy text-[11px] font-medium border border-emerald-200">
                  Const: {selectedConstituency}
                  <button onClick={() => setSelectedConstituency('All')} className="hover:text-red-700 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedStatus !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-govt-navy text-[11px] font-medium border border-emerald-200">
                  Status: {selectedStatus}
                  <button onClick={() => setSelectedStatus('All')} className="hover:text-red-700 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedSector !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-govt-navy text-[11px] font-medium border border-emerald-200">
                  Sector: {selectedSector}
                  <button onClick={() => setSelectedSector('All')} className="hover:text-red-700 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedFinYear !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-govt-navy text-[11px] font-medium border border-emerald-200">
                  FY: {selectedFinYear}
                  <button onClick={() => setSelectedFinYear('All')} className="hover:text-red-700 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-red-600 hover:underline font-semibold ml-1 cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Tab switch between MP allocation view and Developmental Works view */}
            <div className="flex items-center gap-1 bg-panel-bg p-0.5 rounded-lg border border-slate-border">
              <button
                onClick={() => setActiveViewTab('mps')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  activeViewTab === 'mps'
                    ? 'bg-white text-slate-body shadow-2xs'
                    : 'text-slate-muted hover:text-slate-body'
                }`}
              >
                MP Allocations ({sortedMpRecords.length})
              </button>
              <button
                onClick={() => setActiveViewTab('works')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  activeViewTab === 'works'
                    ? 'bg-white text-slate-body shadow-2xs'
                    : 'text-slate-muted hover:text-slate-body'
                }`}
              >
                Detailed Works ({filteredWorks.length})
              </button>
            </div>
          </div>
        </div>

        {/* 5. MP DATA TABLE ("Allocated Limit for Hon'ble MPs") */}
        {activeViewTab === 'mps' ? (
          <div className="bg-white rounded-xl border border-slate-border overflow-hidden shadow-2xs">
            {/* Table Header with Title & Export Actions */}
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-slate-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-body">
                  Allocated Limit for Hon'ble MPs
                </h3>
                <p className="text-[11px] text-slate-muted">
                  {activeChamber} &bull; State-wise & MP-wise Allocation, Recommendation and Utilization
                </p>
              </div>

              {/* Working Export Buttons: [Excel] [CSV] [PDF] */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-muted font-semibold hidden md:inline">Export:</span>
                <button
                  id="export-excel-btn"
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-body border border-slate-border transition-colors cursor-pointer shadow-2xs"
                  title="Export to Microsoft Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-govt-navy" />
                  <span>Excel</span>
                </button>
                <button
                  id="export-csv-btn"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-body border border-slate-border transition-colors cursor-pointer shadow-2xs"
                  title="Export to CSV"
                >
                  <FileText className="w-3.5 h-3.5 text-govt-navy" />
                  <span>CSV</span>
                </button>
                <button
                  id="export-pdf-btn"
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-body border border-slate-border transition-colors cursor-pointer shadow-2xs"
                  title="Print / Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-govt-navy" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Table Container with Horizontal Scroll */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-govt-navy text-white select-none">
                    <th
                      onClick={() => handleSort('srNo')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide cursor-pointer hover:bg-govt-navy-light"
                    >
                      Sr. No.
                    </th>
                    <th
                      onClick={() => handleSort('state')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide cursor-pointer hover:bg-govt-navy-light"
                    >
                      State
                    </th>
                    <th
                      onClick={() => handleSort('mpName')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide cursor-pointer hover:bg-govt-navy-light"
                    >
                      Hon'ble Member of Parliament
                    </th>
                    <th
                      onClick={() => handleSort('constituency')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide cursor-pointer hover:bg-govt-navy-light"
                    >
                      Constituency
                    </th>
                    <th
                      onClick={() => handleSort('allocatedAmountCr')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide text-right cursor-pointer hover:bg-govt-navy-light"
                    >
                      Allocated Amount
                    </th>
                    <th
                      onClick={() => handleSort('recommendedAmountCr')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide text-right cursor-pointer hover:bg-govt-navy-light"
                    >
                      Recommended Amount
                    </th>
                    <th
                      onClick={() => handleSort('sanctionedAmountCr')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide text-right cursor-pointer hover:bg-govt-navy-light"
                    >
                      Sanctioned Amount
                    </th>
                    <th
                      onClick={() => handleSort('utilizedAmountCr')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide text-right cursor-pointer hover:bg-govt-navy-light"
                    >
                      Utilized Amount
                    </th>
                    <th
                      onClick={() => handleSort('worksRecommended')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide text-right cursor-pointer hover:bg-govt-navy-light"
                    >
                      Works Recommended
                    </th>
                    <th
                      onClick={() => handleSort('worksSanctioned')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide text-right cursor-pointer hover:bg-govt-navy-light"
                    >
                      Works Sanctioned
                    </th>
                    <th
                      onClick={() => handleSort('worksCompleted')}
                      className="py-3 px-3.5 font-semibold text-[11px] tracking-wide text-right cursor-pointer hover:bg-govt-navy-light"
                    >
                      Works Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMpRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-xs text-slate-muted">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Info className="w-6 h-6 text-[#94A3B8] mx-auto" />
                          <div className="font-semibold text-slate-body">No MP records found</div>
                          <div className="text-[11px]">Try adjusting your search query or reset applied filters.</div>
                          <button
                            onClick={handleResetFilters}
                            className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-body text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMpRecords.map((r, i) => (
                      <tr
                        key={r.mpName + i}
                        className="hover:bg-panel-bg transition-colors"
                      >
                        <td className="py-2.5 px-3.5 text-slate-muted font-mono text-xs">{r.srNo}</td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-body whitespace-nowrap">{r.state}</td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-body whitespace-nowrap">
                          {r.mpName}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-muted whitespace-nowrap">{r.constituency}</td>
                        <td className="py-2.5 px-3.5 text-right font-medium text-slate-body whitespace-nowrap">
                          ₹{r.allocatedAmountCr.toFixed(2)} Cr
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-govt-navy font-medium whitespace-nowrap">
                          ₹{r.recommendedAmountCr.toFixed(2)} Cr
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-slate-body font-semibold whitespace-nowrap">
                          ₹{r.sanctionedAmountCr.toFixed(2)} Cr
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-status-verified font-medium whitespace-nowrap">
                          ₹{r.utilizedAmountCr.toFixed(2)} Cr
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-slate-body font-medium">{r.worksRecommended}</td>
                        <td className="py-2.5 px-3.5 text-right text-govt-navy font-semibold">{r.worksSanctioned}</td>
                        <td className="py-2.5 px-3.5 text-right text-status-verified font-bold">{r.worksCompleted}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {sortedMpRecords.length > 0 && (
              <div className="px-4 py-3 bg-[#F8FAFC] border-t border-slate-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-slate-muted">
                  Showing {(mpPage - 1) * mpPageSize + 1} to{' '}
                  {Math.min(mpPage * mpPageSize, sortedMpRecords.length)} of {sortedMpRecords.length} MPs
                </span>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => setMpPage(p => Math.max(1, p - 1))}
                    disabled={mpPage === 1}
                    className="px-2.5 py-1 rounded bg-white border border-slate-border text-slate-body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalMpPages })
                    .map((_, idx) => idx + 1)
                    .filter(page => {
                      if (totalMpPages <= 7) return true;
                      if (page === 1 || page === totalMpPages) return true;
                      return Math.abs(page - mpPage) <= 1;
                    })
                    .map((page, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-1 text-xs text-slate-muted">...</span>
                          )}
                          <button
                            onClick={() => setMpPage(page)}
                            className={`w-7 h-7 rounded text-xs font-semibold cursor-pointer ${
                              mpPage === page
                                ? 'bg-govt-navy text-white'
                                : 'bg-white border border-slate-border text-slate-muted hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  <button
                    onClick={() => setMpPage(p => Math.min(totalMpPages, p + 1))}
                    disabled={mpPage === totalMpPages}
                    className="px-2.5 py-1 rounded bg-white border border-slate-border text-slate-body disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Detailed Works View */
          <div className="bg-white rounded-xl border border-slate-border overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-slate-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-body">Matching Developmental Works</h3>
                <p className="text-[11px] text-slate-muted">
                  Click on any developmental project to inspect sanction orders, photos, and live completion status
                </p>
              </div>
              <button
                onClick={() => setActiveViewTab('mps')}
                className="text-xs font-semibold text-govt-navy hover:underline cursor-pointer"
              >
                &larr; Switch to MP Summary
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {paginatedWorks.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-muted">
                  <p className="font-semibold text-sm text-slate-body">No works match your current criteria</p>
                  <p className="text-xs mt-1">Try resetting or broadening your search parameters.</p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-3 px-3 py-1.5 rounded-md bg-slate-100 text-slate-body text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                paginatedWorks.map(p => (
                  <div
                    key={p.id}
                    className="p-4 hover:bg-panel-bg transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-body bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {p.projectCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'Completed'
                              ? 'bg-emerald-100 text-status-verified'
                              : p.status === 'Ongoing'
                              ? 'bg-emerald-100 text-govt-navy'
                              : p.status === 'Delayed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="text-[11px] text-slate-muted font-medium">
                          {p.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-body truncate">{p.title}</h4>
                      <p className="text-xs text-slate-muted line-clamp-1">{p.locationAddress}</p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-muted pt-1">
                        <span>MP: <strong className="text-slate-body">{p.mpName}</strong></span>
                        <span>Agency: <strong className="text-slate-body">{p.implementingAgencyName}</strong></span>
                        <span>Sanction: <strong className="text-slate-body">₹{(p.sanctionedAmount / 100000).toFixed(1)} Lakh</strong></span>
                        <span>Progress: <strong className="text-status-verified">{p.completionPercentage}%</strong></span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={() => onSelectProject(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-govt-navy hover:bg-govt-navy-light text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination for Works */}
            {filteredWorks.length > 0 && (
              <div className="px-4 py-3 bg-[#F8FAFC] border-t border-slate-border flex items-center justify-between text-xs">
                <span className="text-slate-muted">
                  Showing {(worksPage - 1) * worksPageSize + 1} to{' '}
                  {Math.min(worksPage * worksPageSize, filteredWorks.length)} of {filteredWorks.length} works
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setWorksPage(p => Math.max(1, p - 1))}
                    disabled={worksPage === 1}
                    className="px-2.5 py-1 rounded bg-white border border-slate-border text-slate-body disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-body">
                    Page {worksPage} of {totalWorksPages}
                  </span>
                  <button
                    onClick={() => setWorksPage(p => Math.min(totalWorksPages, p + 1))}
                    disabled={worksPage === totalWorksPages}
                    className="px-2.5 py-1 rounded bg-white border border-slate-border text-slate-body disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. CITIZEN OPINION & PUBLIC FEEDBACK (Dedicated Section, No Official Login Needed) */}
        <div id="feedback-section" className="bg-white rounded-xl border border-slate-border p-5 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-border">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-govt-navy" />
                <h3 className="text-base font-bold text-slate-body">
                  Citizen Opinion & Public Feedback
                </h3>
              </div>
              <p className="text-xs text-slate-muted mt-0.5">
                Share citizen feedback, report delays or quality concerns, and express public satisfaction. Stored separately from official records.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-govt-navy text-xs font-semibold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-govt-navy" />
              <span>Public Portal Feature • No Login Required</span>
            </div>
          </div>

          {/* Feedback Form & Recent Registry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Feedback Submission Form */}
            <div className="lg:col-span-6 bg-panel-bg p-4 sm:p-5 rounded-xl border border-slate-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-body uppercase tracking-wide">
                  Submit Citizen Observation
                </span>
                <span className="text-[10px] text-slate-muted">Direct to District Authority</span>
              </div>

              {feedbackSuccessId ? (
                <div className="p-4 bg-emerald-50 rounded-lg border border-status-verified/30 text-status-verified space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-status-verified">
                    <CheckCircle2 className="w-4 h-4 text-status-verified" />
                    <span>Feedback Registered Successfully!</span>
                  </div>
                  <p>
                    Your citizen feedback has been logged under Tracking Reference ID:{' '}
                    <strong className="font-mono text-status-verified">{feedbackSuccessId}</strong>.
                  </p>
                  <p className="text-[11px] text-status-verified">
                    District Authority and Vigilance Officers review all public reports for ground verification.
                  </p>
                  <button
                    onClick={() => setFeedbackSuccessId(null)}
                    className="mt-2 text-xs font-semibold underline text-status-verified cursor-pointer"
                  >
                    Submit Another Feedback
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3 text-xs">
                  {fbFormError && (
                    <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                      {fbFormError}
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-body font-semibold mb-1">
                      Select MPLADS Work *
                    </label>
                    <select
                      value={fbProjectId}
                      onChange={e => setFbProjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy focus:border-govt-navy"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.projectCode} &mdash; {p.title.slice(0, 50)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-body font-semibold mb-1">
                        Category of Observation *
                      </label>
                      <select
                        value={fbIssueType}
                        onChange={e => setFbIssueType(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy focus:border-govt-navy"
                      >
                        <option value="Incomplete Work">Incomplete Work</option>
                        <option value="Poor Quality">Substandard Material Quality</option>
                        <option value="Delay Risk">Unexplained Delay in Execution</option>
                        <option value="Incorrect Location">Location Discrepancy</option>
                        <option value="Damaged Asset">Damaged / Non-Functional Asset</option>
                        <option value="Public Appreciation">Public Appreciation / Work Completed Well</option>
                        <option value="Other">General Suggestion</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-body font-semibold mb-1">
                        Citizen Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={fbCitizenName}
                        onChange={e => setFbCitizenName(e.target.value)}
                        placeholder="Anonymous or Name"
                        className="w-full px-3 py-2 bg-white border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy focus:border-govt-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-body font-semibold mb-1">
                      Phone or Email (Optional, masked for privacy)
                    </label>
                    <input
                      type="text"
                      value={fbCitizenContact}
                      onChange={e => setFbCitizenContact(e.target.value)}
                      placeholder="+91 98490 ***** or citizen@email.com"
                      className="w-full px-3 py-2 bg-white border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy focus:border-govt-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-body font-semibold mb-1">
                      Observation Details & Ground Realities *
                    </label>
                    <textarea
                      rows={3}
                      value={fbDescription}
                      onChange={e => setFbDescription(e.target.value)}
                      placeholder="Describe what you observed on site, current state of the facility, quality issues or public satisfaction..."
                      className="w-full px-3 py-2 bg-white border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy focus:border-govt-navy"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={feedbackSubmitting}
                    className="w-full py-2.5 px-4 rounded-lg bg-govt-navy hover:bg-govt-navy-light text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{feedbackSubmitting ? 'Submitting Feedback...' : 'Submit Feedback to Public Registry'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Public Feedback Transparency Feed */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-body uppercase tracking-wide">
                  Public Feedback Registry ({feedbacks.length})
                </span>
                <span className="text-[11px] text-slate-muted">Verified Transparency Log</span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {feedbackLoading ? (
                  <div className="p-6 text-center text-xs text-slate-muted">
                    Loading public citizen observations...
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className="p-6 bg-panel-bg rounded-lg border border-slate-border text-center text-xs text-slate-muted">
                    No public grievances registered yet. Be the first to share ground observation!
                  </div>
                ) : (
                  feedbacks.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-panel-bg hover:bg-white rounded-lg border border-slate-border text-xs space-y-1.5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-body bg-white px-1.5 py-0.5 rounded border border-slate-border">
                            {item.id}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-body truncate max-w-[180px]">
                            {item.issueType}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-100 text-status-verified'
                              : item.status === 'Verified'
                              ? 'bg-emerald-100 text-govt-navy'
                              : item.status === 'Under Review'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-muted line-clamp-2">{item.description}</p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-border">
                        <span>Citizen: {item.citizenName || 'Public Observer'}</span>
                        <span>{new Date(item.submittedAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FILTER MODAL / PANEL */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-border max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-govt-navy text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] text-panel-bg/80 uppercase font-bold tracking-wider">
                  Precise Search & Filter Engine
                </div>
                <h3 className="text-base font-bold">Filter MPLADS Records</h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 rounded-lg text-panel-bg/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Form Fields */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* A. Tenure */}
                <div>
                  <label className="block font-semibold text-slate-body mb-1">A. Tenure</label>
                  <select
                    value={selectedTenure}
                    onChange={e => setSelectedTenure(e.target.value)}
                    className="w-full px-3 py-2 bg-panel-bg border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy"
                  >
                    <option value="18th Lok Sabha">18th Lok Sabha (Current)</option>
                    <option value="17th Lok Sabha">17th Lok Sabha</option>
                    <option value="All Tenures">All Tenures</option>
                  </select>
                </div>

                {/* B. State */}
                <div>
                  <label className="block font-semibold text-slate-body mb-1">B. State / UT</label>
                  <select
                    value={selectedState}
                    onChange={e => {
                      setSelectedState(e.target.value);
                      setSelectedConstituency('All');
                      setSelectedMp('All');
                    }}
                    className="w-full px-3 py-2 bg-panel-bg border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy"
                  >
                    <option value="All">All States / UTs</option>
                    {availableStates.map(st => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* C. Constituency (Dynamic) */}
                <div>
                  <label className="block font-semibold text-slate-body mb-1">
                    C. Constituency (Dynamic)
                  </label>
                  <select
                    value={selectedConstituency}
                    onChange={e => setSelectedConstituency(e.target.value)}
                    className="w-full px-3 py-2 bg-panel-bg border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy"
                  >
                    <option value="All">All Constituencies</option>
                    {availableConstituencies.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* D. MP Name (Dynamic) */}
                <div>
                  <label className="block font-semibold text-slate-body mb-1">
                    D. Hon'ble MP Name (Dynamic)
                  </label>
                  <select
                    value={selectedMp}
                    onChange={e => setSelectedMp(e.target.value)}
                    className="w-full px-3 py-2 bg-panel-bg border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy"
                  >
                    <option value="All">All Hon'ble MPs</option>
                    {availableMps.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* E. Work Status */}
                <div>
                  <label className="block font-semibold text-slate-body mb-1">E. Work Status</label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-panel-bg border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy"
                  >
                    <option value="All">All Statuses</option>
                    {workStatuses.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* F. Sector */}
                <div>
                  <label className="block font-semibold text-slate-body mb-1">F. Sector / Category</label>
                  <select
                    value={selectedSector}
                    onChange={e => setSelectedSector(e.target.value)}
                    className="w-full px-3 py-2 bg-panel-bg border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy"
                  >
                    <option value="All">All Sectors</option>
                    {sectorsList.map(sec => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* G. Financial Year */}
                <div>
                  <label className="block font-semibold text-slate-body mb-1">G. Financial Year</label>
                  <select
                    value={selectedFinYear}
                    onChange={e => setSelectedFinYear(e.target.value)}
                    className="w-full px-3 py-2 bg-panel-bg border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy"
                  >
                    <option value="All">All Financial Years</option>
                    {financialYears.map(fy => (
                      <option key={fy} value={fy}>
                        {fy}
                      </option>
                    ))}
                  </select>
                </div>

                {/* H. District */}
                <div>
                  <label className="block font-semibold text-slate-body mb-1">H. District</label>
                  <select
                    value={selectedDistrict}
                    onChange={e => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-panel-bg border border-slate-border rounded-lg text-xs focus:ring-1 focus:ring-govt-navy"
                  >
                    <option value="All">All Districts</option>
                    {availableDistricts.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-panel-bg border-t border-slate-border flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent transition-colors cursor-pointer"
              >
                Reset Filters
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-body hover:bg-slate-200 border border-slate-border transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMpPage(1);
                    setWorksPage(1);
                    setIsFilterModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-govt-navy hover:bg-govt-navy-light text-white shadow-2xs transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-border py-6 px-4 mt-12 text-xs text-slate-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-govt-navy text-white flex items-center justify-center font-bold text-[9px]">
              GOI
            </div>
            <div>
              <div className="font-bold text-slate-body">e-SAKSHI Portal &bull; MPLADS Digital Governance</div>
              <div className="text-[11px]">Ministry of Statistics & Programme Implementation, Government of India</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a href="#dashboard-section" className="hover:text-govt-navy">Dashboard</a>
            <a href="#feedback-section" className="hover:text-govt-navy">Citizen Feedback</a>
            <button onClick={onEnterPublic} className="hover:text-govt-navy cursor-pointer">Public Portal</button>
            <button onClick={() => onOpenLogin()} className="hover:text-govt-navy cursor-pointer font-semibold">Officer Login</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
