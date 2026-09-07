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

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [17.41, 78.49],
        zoom: 11,
        zoomControl: true,
        attributionControl: false
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
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

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    let filtered = projects;
    if (selectedCategory !== 'All') filtered = filtered.filter(p => p.category === selectedCategory);
    if (selectedStatus !== 'All') filtered = filtered.filter(p => p.status === selectedStatus);
    if (filterRiskOnly) filtered = filtered.filter(p => (p.riskAnalysis?.overallScore || 0) > 50);

    const bounds = L.latLngBounds([]);
    filtered.forEach(project => {
      if (!project) return;
      const lat = project.latitude;
      const lon = project.longitude;
      if (!lat || !lon) return;
      bounds.extend([lat, lon]);

      let markerColor = '#588157';
      if (project.status === 'Completed') markerColor = '#395C40';
      else if (project.status === 'Delayed' || project.riskAnalysis?.riskLevel === 'CRITICAL') markerColor = '#E07A5F';
      else if ((project.riskAnalysis?.overallScore || 0) > 60) markerColor = '#D4A373';

      const customIcon = L.divIcon({
        className: 'custom-gis-pin',
        html: `
          <div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 0 3px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
            <span style="transform: rotate(45deg); color: #fff; font-size: 10px; font-weight: bold; font-family: monospace;">${project.completionPercentage}%</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const marker = L.marker([lat, lon], { icon: customIcon });
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-xs';
      popupContent.innerHTML = `
        <div style="font-family: monospace; font-size: 10px; color: #588157; font-weight: 600;">${project.projectCode}</div>
        <div style="font-weight: 700; font-size: 13px; color: #1B3022; margin-top: 2px;">${project.title}</div>
        <div style="margin-top: 4px; color: #588157; font-size: 11px;">
          <strong>District:</strong> ${project.district} | <strong>Category:</strong> ${project.category}
        </div>
        <div style="display: flex; gap: 8px; margin-top: 6px; font-size: 11px;">
          <div>Cost: <strong>₹${((project.sanctionedAmount || project.estimatedCost) / 100000).toFixed(1)}L</strong></div>
          <div>Progress: <strong>${project.completionPercentage}%</strong></div>
          <div>Risk: <strong>${project.riskAnalysis?.riskLevel || 'LOW'}</strong></div>
        </div>
        <button id="view-prj-${project.id}" style="margin-top: 8px; width: 100%; padding: 6px 10px; background-color: #395C40; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 11px;">
          View Complete Audit
        </button>
      `;
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

  const categories = ['All', 'Drinking Water & Sanitation', 'Education & Schools', 'Renewable Energy', 'Roads, Bridges & Pathways', 'Healthcare & Wellness', 'Community Infrastructure'];
  const statuses = ['All', 'Ongoing', 'Completed', 'Delayed', 'Sanctioned', 'Recommended'];

  return (
    <div className="relative w-full h-[600px] bg-[#F8F9F7] rounded-2xl border border-[#DDE5D4] overflow-hidden shadow-inner flex flex-col">
      <div className="absolute top-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-[#DDE5D4] p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[#1B3022]">Category:</span>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="px-2.5 py-1.5 bg-[#F8F9F7] border border-[#DDE5D4] rounded-lg text-xs font-medium">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="font-bold text-[#1B3022] ml-2">Status:</span>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="px-2.5 py-1.5 bg-[#F8F9F7] border border-[#DDE5D4] rounded-lg text-xs font-medium">
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-1.5 ml-2 cursor-pointer font-bold text-[#E07A5F]">
            <input type="checkbox" checked={filterRiskOnly} onChange={e => setFilterRiskOnly(e.target.checked)} className="rounded" />
            <span>High Risk / Delayed Only</span>
          </label>
        </div>
      </div>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
