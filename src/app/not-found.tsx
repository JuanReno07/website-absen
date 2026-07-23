'use client';

import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400 mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-100">404 - Halaman Tidak Ditemukan</h1>
        <p className="text-xs text-slate-400">
          Alamat URL yang Anda tuju tidak ditemukan atau telah dipindahkan.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          KEMBALI KE HALAMAN UTAMA
        </Link>
      </div>
    </div>
  );
}
