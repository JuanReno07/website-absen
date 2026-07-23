import type { Metadata } from 'next';
import './globals.css';
import ThemeScript from '@/components/ThemeScript';
import { prisma } from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.systemSettings.findFirst({ where: { id: 'default' } });
  const title = settings?.system_name || 'ASE Duty Attendance System';
  const description = 'Sistem Absensi Duty IN & Duty OUT Serba Otomatis untuk ASE Roleplay';

  return {
    title,
    description,
    manifest: '/manifest.json',
    icons: {
      icon: settings?.logo || '/Logo/TRANSPARENT_ASERP_BLACK_HORIZONTAL.png',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.systemSettings.findFirst({ where: { id: 'default' } });

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-brand-500 selection:text-white flex flex-col min-h-screen">
        <ThemeScript
          primaryColor={settings?.primary_color}
          secondaryColor={settings?.secondary_color}
          accentColor={settings?.accent_color}
          themeMode={settings?.theme_mode}
        />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
