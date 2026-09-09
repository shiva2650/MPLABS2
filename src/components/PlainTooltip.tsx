import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface PlainTooltipProps {
  term?: string;
  explanation: string;
  className?: string;
}

export const PlainTooltip: React.FC<PlainTooltipProps> = ({
  term,
  explanation,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <span ref={containerRef} className={`relative inline-flex items-center ml-1 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={e => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
        aria-label={`${t.whatDoesThisMean}: ${term || 'term explanation'}`}
        className="text-slate-muted hover:text-govt-navy focus:outline-hidden focus-visible:ring-2 focus-visible:ring-govt-navy rounded-full p-0.5 transition-colors cursor-pointer"
        title={t.clickToExplain}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white text-slate-body border border-slate-border rounded-lg shadow-md z-50 text-xs text-left"
        >
          {term && <div className="font-bold text-govt-navy mb-1">{term}</div>}
          <div className="text-slate-body leading-relaxed">{explanation}</div>
          <div className="mt-2 pt-1 border-t border-slate-border text-[10px] text-slate-muted flex justify-between items-center">
            <span>{t.plainGuidance}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-govt-navy font-semibold hover:underline cursor-pointer"
            >
              {t.close}
            </button>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-white border-b border-r border-slate-border rotate-45" />
        </div>
      )}
    </span>
  );
};
