'use client';

import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerDMYProps {
  value: string; // Formatted as "YYYY-MM-DD"
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
}

/**
 * Converts a YYYY-MM-DD string into strictly DD/MM/YYYY
 */
export function formatDMY(isoDateString?: string): string {
  if (!isoDateString) return '-';
  const parts = isoDateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDateString;
}

export default function DatePickerDMY({
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  className = '',
  id,
  placeholder = 'DD/MM/YYYY',
}: DatePickerDMYProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayDate = value ? formatDMY(value) : placeholder;

  const handleClick = () => {
    if (disabled) return;
    try {
      inputRef.current?.showPicker?.();
    } catch {
      inputRef.current?.focus();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-700 hover:border-brand-500 rounded-xl cursor-pointer transition-all focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/30 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <Calendar className="w-4 h-4 text-brand-400 flex-shrink-0" />
        <span
          className={`font-mono text-xs sm:text-sm font-semibold tracking-wide ${
            value ? 'text-slate-100' : 'text-slate-500'
          }`}
        >
          {displayDate}
        </span>
      </div>

      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex-shrink-0">
        DD/MM/YYYY
      </span>

      {/* Invisible native date input overlay for standard native calendar popup */}
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          e.stopPropagation();
          try {
            e.currentTarget.showPicker?.();
          } catch {}
        }}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:dark]"
        tabIndex={0}
      />
    </div>
  );
}
