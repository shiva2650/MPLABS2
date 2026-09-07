import React, { useState } from 'react';
import { Project } from '../types/index.js';
import { api } from '../services/api.js';
import { X, HardHat, Camera, CheckCircle2, Compass } from 'lucide-react';

interface AgencyUpdateModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AgencyUpdateModal: React.FC<AgencyUpdateModalProps> = ({ project, isOpen, onClose, onSuccess }) => {
  if (!isOpen || !project) return null;

  const [progress, setProgress] = useState(project.completionPercentage);
  const [fundsUtilizedLakh, setFundsUtilizedLakh] = useState(((project.fundsUtilized || 0) / 100000).toFixed(2));
  const [remarks, setRemarks] = useState('');
  const [photoStage, setPhotoStage] = useState<'before' | 'during' | 'after'>('during');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb180c5f2?w=800&auto=format&fit=crop&q=60');
  const [photoLat, setPhotoLat] = useState((project.latitude || 17.4120).toString());
  const [photoLon, setPhotoLon] = useState((project.longitude || 78.4982).toString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fundsNumber = Math.round(parseFloat(fundsUtilizedLakh) * 100000);
      await api.updateProgress(project.id, {
        completionPercentage: Number(progress),
        fundsUtilized: fundsNumber,
        remarks,
        photoUrl: photoUrl.trim() || undefined,
        photoStage,
        photoCaption: photoCaption.trim() || undefined,
        photoLat: parseFloat(photoLat),
        photoLon: parseFloat(photoLon)
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update progress.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B3022]/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#F8F9F7] rounded-2xl shadow-2xl border border-[#DDE5D4] overflow-hidden my-8">
        <div className="px-6 py-4 bg-[#1B3022] text-white flex items-center justify-between border-b border-[#2C4A34]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#395C40]/50 text-[#DDE5D4] border border-[#395C40]">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Update Progress & Upload Geotag Photo
              </h2>
              <div className="text-xs text-[#A3B18A] font-mono">
                {project.projectCode} • {project.title}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#A3B18A] hover:text-white hover:bg-[#395C40] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#FAF3E0] border border-[#E8DAB2] text-[#935D26] rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1B3022] mb-1">Physical Completion ({progress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                className="w-full h-2 bg-[#DDE5D4] rounded-lg appearance-none cursor-pointer accent-[#395C40]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1B3022] mb-1">Funds Utilized (₹ Lakh)</label>
              <input
                type="number"
                step="0.05"
                required
                value={fundsUtilizedLakh}
                onChange={e => setFundsUtilizedLakh(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg font-mono font-bold bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1B3022] mb-1">Field Engineer Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Stage description, inspection observations..."
              className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg bg-white"
            />
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#DDE5D4] space-y-3">
            <div className="flex items-center gap-2 font-bold text-[#1B3022]">
              <Camera className="w-4 h-4 text-[#395C40]" />
              <span>Mandatory Geotagged Progress Photo</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-[#1B3022] mb-1">Milestone Stage</label>
                <select value={photoStage} onChange={e => setPhotoStage(e.target.value as any)} className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg bg-white">
                  <option value="before">Before Work Started</option>
                  <option value="during">During Work Execution</option>
                  <option value="after">After Completion</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-[#1B3022] mb-1">Photo Caption</label>
                <input type="text" value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} placeholder="e.g., Column casting inspection" className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg bg-white" />
              </div>
            </div>
            <div>
              <label className="block font-bold text-[#1B3022] mb-1">Photo URL</label>
              <input type="url" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg font-mono text-[11px] bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#1B3022] mb-1">Photo Latitude</label>
                <input type="text" value={photoLat} onChange={e => setPhotoLat(e.target.value)} className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg font-mono bg-white" />
              </div>
              <div>
                <label className="block font-bold text-[#1B3022] mb-1">Photo Longitude</label>
                <input type="text" value={photoLon} onChange={e => setPhotoLon(e.target.value)} className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg font-mono bg-white" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#DDE5D4] flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[#DDE5D4] text-[#1B3022] bg-white font-bold cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 rounded-lg bg-[#395C40] text-white font-bold hover:bg-[#2C4A34] disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer">
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Save & Verify Progress'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
