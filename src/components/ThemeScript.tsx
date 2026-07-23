'use client';

import { useEffect } from 'react';

interface ThemeScriptProps {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  themeMode?: string;
}

export default function ThemeScript({
  primaryColor = '#DC2626',
  secondaryColor = '#1E293B',
  accentColor = '#EF4444',
  themeMode = 'BRANDED',
}: ThemeScriptProps) {
  useEffect(() => {
    const root = document.documentElement;

    if (themeMode === 'LIGHT') {
      root.style.setProperty('--bg-color', '#f8fafc');
      root.style.setProperty('--surface-color', '#ffffff');
      root.style.setProperty('--primary-color', primaryColor);
      root.style.setProperty('--secondary-color', secondaryColor);
      root.style.setProperty('--accent-color', accentColor);
    } else if (themeMode === 'DARK') {
      root.style.setProperty('--bg-color', '#0f172a');
      root.style.setProperty('--surface-color', '#1e293b');
      root.style.setProperty('--primary-color', primaryColor);
      root.style.setProperty('--secondary-color', secondaryColor);
      root.style.setProperty('--accent-color', accentColor);
    } else {
      // BRANDED Theme (Default ASE Roleplay obsidian crimson)
      root.style.setProperty('--bg-color', '#090d16');
      root.style.setProperty('--surface-color', '#0f172a');
      root.style.setProperty('--primary-color', primaryColor);
      root.style.setProperty('--secondary-color', secondaryColor);
      root.style.setProperty('--accent-color', accentColor);
    }
  }, [primaryColor, secondaryColor, accentColor, themeMode]);

  return null;
}
