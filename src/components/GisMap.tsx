import React, { useEffect, useRef, useState } from 'react';
import { Project } from '../types/index.js';
import L from 'leaflet';

interface GISMapProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  selectedProjectId?: string;
}

export const GISMap: React.FC<GISMapProps> = ({
  projects,
  onSelectProject,
  selectedProjectId
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [filterRiskOnly, setFilterRiskOnly] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default centered on Hyderabad / Telangana coordinates (17.41, 78.49)
      const map = L.map(mapContainerRef.current, {
        center: [17.41, 78.49],
        zoom: 11,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Update Markers when projects or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    let filtered = projects;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }
    if (filterRiskOnly) {
      filtered = filtered.filter(p => p.riskAnalysis.overallScore > 50);
    }

    const bounds = L.latLngBounds([]);

    filtered.forEach(project => {
      if (!project) return;
      const lat = project.latitude;
      const lon = project.longitude;

      if (!lat || !lon) return;

      bounds.extend([lat, lon]);

      // Determine marker color based on status and risk
      let markerColor = '#0F5C3C'; // Primary Green (Ongoing)
      if (project.status === 'Completed') markerColor = '#1E7B34'; // Status-verified
      else if (project.status === 'Delayed' || project.riskAnalysis.riskLevel === 'CRITICAL') markerColor = '#B91C1C'; // Red (Delayed/Critical)
      else if (project.riskAnalysis.overallScore > 60) markerColor = '#B45309'; // Amber (High Risk)
      else if (project.status === 'Recommended') markerColor = '#5A6472'; // Slate (Recommended)

      // Create Custom SVG Pin
      const customIcon = L.divIcon({
        className: 'custom-gis-pin',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #ffffff;
            box-shadow: 0 3px 6px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              transform: rotate(45deg);
              color: #ffffff;
              font-size: 10px;
              font-weight: bold;
              font-family: monospace;
            ">
              ${project.completionPercentage}%
            </span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-xs';
      popupContent.innerHTML = `
        <div style="font-family: monospace; font-size: 10px; color: #5A6472; font-weight: 600;">${project.projectCode}</div>
        <div style="font-weight: 700; font-size: 13px; color: #1F2933; margin-top: 2px; line-height: 1.2;">${project.title}</div>
        <div style="margin-top: 4px; color: #5A6472; font-size: 11px;">
          <strong>District:</strong> ${project.district} | <strong>Category:</strong> ${project.category}
        </div>
        <div style="display: flex; gap: 8px; margin-top: 6px; font-size: 11px; color: #1F2933;">
          <div>Cost: <strong>₹${(project.sanctionedAmount / 100000).toFixed(1)}L</strong></div>
          <div>Progress: <strong>${project.completionPercentage}%</strong></div>
          <div>Risk: <span style="font-weight:bold; color:${project.riskAnalysis.overallScore > 60 ? '#DC2626' : '#059669'}">${project.riskAnalysis.riskLevel} (${project.riskAnalysis.overallScore})</span></div>
        </div>
        <button id="view-prj-${project.id}" style="
          margin-top: 8px;
          width: 100%;
          padding: 6px 10px;
          background-color: #0F5C3C;
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          font-size: 11px;
        ">
          View Complete Project Audit
        </button>
      `;

      // Handle button click inside Leaflet popup
      popupContent.querySelector(`#view-prj-${project.id}`)?.addEventListener('click', () => {
        onSelectProject(project);
      });

      marker.bindPopup(popupContent);
      markersLayerRef.current?.addLayer(marker);
    });

    if (filtered.length > 0 && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [projects, selectedCategory, selectedStatus, filterRiskOnly]);

  const categories = ['All', 'Drinking Water & Sanitation', 'Education & Schools', 'Renewable Energy', 'Roads, Bridges & Pathways', 'Healthcare & Wellness'];
  const statuses = ['All', 'Ongoing', 'Completed', 'Delayed', 'Sanctioned', 'Recommended'];

  return (
    <div className="relative w-full h-[600px] bg-panel-bg rounded-2xl border border-slate-border overflow-hidden shadow-inner flex flex-col">
      {/* Top Filter Floating Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-border p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-body">Category:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-panel-bg border border-slate-border rounded-lg text-xs text-slate-body font-medium focus:ring-2 focus:ring-govt-navy focus:outline-hidden"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <span className="font-bold text-slate-body ml-2">Status:</span>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-panel-bg border border-slate-border rounded-lg text-xs text-slate-body font-medium focus:ring-2 focus:ring-govt-navy focus:outline-hidden"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 ml-2 cursor-pointer font-bold text-status-flagged">
            <input
              type="checkbox"
              checked={filterRiskOnly}
              onChange={e => setFilterRiskOnly(e.target.checked)}
              className="rounded text-status-flagged focus:ring-status-flagged"
            />
            <span>High Risk / Delayed Only</span>
          </label>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-status-verified inline-block" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-govt-navy inline-block" /> Ongoing
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-status-flagged inline-block" /> Delayed / Anomaly
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-muted inline-block" /> Recommended
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
