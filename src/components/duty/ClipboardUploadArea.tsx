'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Clipboard, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

interface ClipboardUploadAreaProps {
  onImageSelected: (base64Image: string | null) => void;
  label?: string;
  required?: boolean;
}

export default function ClipboardUploadArea({
  onImageSelected,
  label = 'Unggah Bukti Screenshot',
  required = true,
}: ClipboardUploadAreaProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Format file harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    const maxSizeMb = 10;
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`Ukuran file melebihi batas maksimal ${maxSizeMb} MB.`);
      return;
    }

    // Format file size string
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const sizeInKb = Math.round(file.size / 1024);
    setFileSizeStr(file.size >= 1024 * 1024 ? `${sizeInMb} MB` : `${sizeInKb} KB`);
    setFileName(file.name || `screenshot-${Date.now()}.png`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
  };

  // Clipboard Paste Event Listener (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName('');
    setFileSizeStr('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onImageSelected(null);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-200">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clipboard className="w-3.5 h-3.5 text-brand-400" />
          Bisa tekan <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Ctrl + V</kbd> untuk paste
        </span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          tabIndex={0}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 outline-none ${
            isDragging
              ? 'border-brand-500 bg-brand-950/20 scale-[1.01]'
              : isFocused
              ? 'border-brand-400 bg-slate-900/90 shadow-lg shadow-brand-500/10'
              : 'border-slate-700/80 bg-slate-900/60 hover:border-brand-500/60 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-brand-400 shadow-inner group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-100 sm:text-base">
                Paste screenshot di sini dengan <span className="text-brand-400">Ctrl + V</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                atau drag & drop gambar, klik untuk milih file / galeri HP
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 bg-slate-800/80 text-slate-300 rounded-md text-[11px] font-mono border border-slate-700/60">
                PNG, JPG, WEBP (Max 10MB)
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative border border-slate-700/80 bg-slate-900/90 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 overflow-hidden">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="truncate">
                <p className="text-sm font-medium text-slate-100 truncate">{fileName}</p>
                <p className="text-xs text-slate-400 font-mono">{fileSizeStr}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Ganti
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 max-h-80 flex items-center justify-center">
            <img src={preview} alt="Preview Screenshot" className="max-h-72 w-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
