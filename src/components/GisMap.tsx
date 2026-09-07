import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Project } from '../types/index.ts';
import { MapPin, Layers } from 'lucide-react';

interface GisMapProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  selectedProjectId?: string;
}

export const GisMap: React.FC<GisMapProps> = ({
  projects,
  onSelectProject,
  selectedProjectId
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered over India by default
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
        attributionControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors | MPLADS GIS'
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers whenever projects change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    projects.forEach((proj) => {
      if (!proj.latitude || !proj.longitude) return;

      const lat = Number(proj.latitude);
      const lng = Number(proj.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      bounds.push([lat, lng]);

      // Determine marker color
      let color = '#3B82F6'; // Blue (Ongoing)
      let border = '#1D4ED8';

      if (proj.status === 'Completed') {
        color = '#10B981'; // Green
        border = '#047857';
      } else if (proj.riskLevel === 'Critical' || proj.riskLevel === 'High') {
        color = '#EF4444'; // Red
        border = '#B91C1C';
      } else if (proj.status === 'Delayed' || proj.delayPrediction?.status === 'Delayed') {
        color = '#F59E0B'; // Amber
        border = '#B45309';
      } else if (proj.status === 'Recommended' || proj.status === 'Under Review') {
        color = '#64748B'; // Gray
        border = '#334155';
      }

      const isSelected = proj.id === selectedProjectId;

      // Custom HTML Marker Pin
      const icon = L.divIcon({
        className: 'custom-gis-pin',
        html: `
          <div style="
            width: ${isSelected ? '28px' : '22px'};
            height: ${isSelected ? '28px' : '22px'};
            background-color: ${color};
            border: 2px solid ${isSelected ? '#FFFFFF' : border};
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
            transition: transform 0.2s ease;
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          ">
            <span>●</span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([lat, lng], { icon });

      // Clean Government Style Popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 220px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; color: #1e3a8a; text-transform: uppercase;">
            ${proj.workId}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #111827; margin: 3px 0;">
            ${proj.title}
          </div>
          <div style="color: #4b5563; margin-bottom: 6px; font-size: 11px;">
            ${proj.locationAddress || `${proj.district}, ${proj.state}`}
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 5px; margin-bottom: 6px;">
            <div>
              <span style="color: #6b7280; font-size: 10px;">Sanctioned Cost</span>
              <div style="font-weight: 700; color: #1e3a8a;">₹${(proj.sanctionedCost / 100000).toFixed(1)} L</div>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 10px;">Status</span>
              <div style="font-weight: 700; color: ${color};">${proj.status}</div>
            </div>
          </div>
          <button
            id="view-btn-${proj.id}"
            style="
              width: 100%;
              background-color: #1e3a8a;
              color: white;
              font-weight: 600;
              padding: 5px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            "
          >
            Inspect Project File
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-btn-${proj.id}`);
        if (btn) {
          btn.onclick = () => onSelectProject(proj);
        }
      });

      marker.addTo(markersGroup);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as any, { padding: [40, 40], maxZoom: 13 });
    }
  }, [projects, selectedProjectId]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-2xs mb-6 overflow-hidden">
      <div className="p-3.5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-900" />
          <h3 className="text-sm font-extrabold text-gray-900">
            Interactive GIS Asset Location Map
          </h3>
          <span className="text-xs text-gray-500">
            ({projects.length} Geo-tagged works plotted)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-600 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Ongoing</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Delayed / At Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>AI Risk Anomaly</span>
          </div>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="w-full h-[400px] z-10 bg-slate-100"
      />
    </div>
  );
};
