import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Project } from '../types';
import { Info, Layers, Eye } from 'lucide-react';

interface GISProjectMapProps {
  projects: Project[];
  onSelectProject?: (project: Project) => void;
}

export const GISProjectMap: React.FC<GISProjectMapProps> = ({
  projects,
  onSelectProject,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [focusedProject, setFocusedProject] = useState<Project | null>(null);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map instance already exists
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.5937, 78.9629], // Geographic center of India
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
      });

      // OpenStreetMap official standard tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when projects or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Filter projects
    const filtered = projects.filter((p) => {
      if (selectedSector !== 'ALL' && p.sector !== selectedSector) return false;
      if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
      if (selectedRisk !== 'ALL' && p.riskLevel !== selectedRisk) return false;
      return true;
    });

    // Helper to get color code
    const getMarkerColor = (project: Project): string => {
      if (project.riskLevel === 'HIGH' || project.riskLevel === 'CRITICAL') return '#dc2626'; // Red
      if (project.riskLevel === 'MEDIUM') return '#d97706'; // Yellow/Amber
      if (project.status === 'Completed') return '#16a34a'; // Green
      if (project.status === 'Ongoing') return '#2563eb'; // Blue
      if (project.status === 'Delayed') return '#ea580c'; // Orange
      return '#6b7280'; // Gray (Recommended/Under Review)
    };

    filtered.forEach((p) => {
      if (!p.coordinates || !p.coordinates.lat || !p.coordinates.lng) return;

      const color = getMarkerColor(p);

      // Custom HTML circle marker icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 1px 4px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([p.coordinates.lat, p.coordinates.lng], { icon: customIcon });

      // Clean public-safe popup content
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 220px; font-size: 12px; color: #1c1917;">
          <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 2px;">
            ${p.workCode}
          </div>
          <div style="font-size: 13px; font-weight: 700; line-height: 1.3; margin-bottom: 6px; color: #0c4a6e;">
            ${p.title}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Sector:</strong> ${p.sector}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Location:</strong> ${p.district}, ${p.state}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>MP:</strong> ${p.mpName} (${p.house})
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Sanctioned:</strong> ₹${p.sanctionedCostLakhs.toFixed(2)} Lakhs
          </div>
          <div style="margin-bottom: 6px;">
            <strong>Status:</strong> <span style="font-weight: 600;">${p.status} (${p.progressPercentage}%)</span>
          </div>
          <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background-color: ${color}20; color: ${color}; border: 1px solid ${color}40;">
            Risk: ${p.riskScore}/100 (${p.riskLevel})
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setFocusedProject(p);
      });

      markersGroup.addLayer(marker);
    });
  }, [projects, selectedSector, selectedStatus, selectedRisk]);

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
      {/* Map Control Bar */}
      <div className="p-3 sm:p-4 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-stone-700" />
          <span className="text-xs sm:text-sm font-bold text-stone-800">
            MPLADS GIS Project Geolocation Map
          </span>
          <span className="text-xs text-stone-500 font-medium">
            ({projects.length} Works Mapped Across States)
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            id="gis-filter-sector"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-700 font-medium"
          >
            <option value="ALL">All Sectors</option>
            <option value="Roads, Pathways & Bridges">Roads, Pathways &amp; Bridges</option>
            <option value="Drinking Water Facility">Drinking Water Facility</option>
            <option value="Sanitation & Public Health">Sanitation &amp; Public Health</option>
            <option value="Education & School Infrastructure">Education &amp; Schools</option>
            <option value="Community Infrastructure">Community Infrastructure</option>
            <option value="Irrigation & Flood Control">Irrigation &amp; Flood Control</option>
            <option value="Electricity & Non-Conventional Energy">Electricity &amp; Solar</option>
            <option value="Sports & Youth Development">Sports &amp; Youth</option>
          </select>

          <select
            id="gis-filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
            <option value="Sanctioned">Sanctioned</option>
            <option value="Recommended">Recommended</option>
          </select>

          <select
            id="gis-filter-risk"
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-stone-300 rounded text-stone-700 font-medium"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Map Stage */}
      <div className="relative">
        <div ref={mapContainerRef} className="h-[460px] sm:h-[520px] w-full z-10" />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs border border-stone-300 rounded-md p-2.5 shadow-md text-[11px] text-stone-700 space-y-1">
          <div className="font-bold text-stone-900 border-b border-stone-200 pb-1 mb-1.5">
            Color Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shrink-0" />
            <span>Completed Work</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block shrink-0" />
            <span>Ongoing Work</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shrink-0" />
            <span>At Risk / Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block shrink-0" />
            <span>High Risk / Location Mismatch</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-stone-500 inline-block shrink-0" />
            <span>Recommended / Sanctioned</span>
          </div>
        </div>

        {/* Selected Project Card Preview in Map Corner */}
        {focusedProject && (
          <div className="absolute top-3 right-3 z-20 bg-white border border-stone-300 rounded-lg p-3 shadow-lg max-w-xs text-xs">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="font-bold text-stone-900 line-clamp-2 leading-snug">
                {focusedProject.title}
              </span>
              <button
                onClick={() => setFocusedProject(null)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                &times;
              </button>
            </div>
            <div className="text-[11px] text-stone-600 space-y-0.5 mb-2">
              <div><strong>District:</strong> {focusedProject.district}, {focusedProject.state}</div>
              <div><strong>MP:</strong> {focusedProject.mpName}</div>
              <div><strong>Sanctioned:</strong> ₹{focusedProject.sanctionedCostLakhs.toFixed(2)} Lakhs</div>
              <div><strong>Progress:</strong> {focusedProject.progressPercentage}% ({focusedProject.status})</div>
              <div><strong>Risk Score:</strong> {focusedProject.riskScore}/100</div>
            </div>
            {onSelectProject && (
              <button
                onClick={() => onSelectProject(focusedProject)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-sky-900 hover:bg-sky-950 rounded transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                View Full Details
              </button>
            )}
          </div>
        )}
      </div>

      {/* Map Footer Note */}
      <div className="px-4 py-2 bg-stone-100 border-t border-stone-200 text-[11px] text-stone-600 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-stone-500" />
          Click any marker to inspect sanctioned costs, verified geo-coordinates, and execution progress.
        </span>
        <span className="text-stone-500 font-mono">WGS84 EPSG:4326</span>
      </div>
    </div>
  );
};
