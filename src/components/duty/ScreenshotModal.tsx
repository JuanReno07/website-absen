'use client';

import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
}

export default function ScreenshotModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Bukti Screenshot Absensi',
}: ScreenshotModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500"></span>
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              title="Buka Gambar Asli"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Image */}
        <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto bg-slate-950/40">
          <img
            src={imageUrl}
            alt="Screenshot Proof"
            className="max-h-[72vh] w-auto object-contain rounded-lg border border-slate-800 shadow-md"
          />
        </div>
      </div>
    </div>
  );
}
