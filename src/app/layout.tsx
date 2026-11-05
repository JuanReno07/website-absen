import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeScript from '@/components/ThemeScript';
import { prisma } from '@/lib/db';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  let title = 'ASE Duty Attendance System';
  let favicon = '/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png';

  try {
    const settings = await prisma.systemSettings.findFirst({
      where: { id: 'default' },
      select: { system_name: true, favicon: true },
    });
    if (settings?.system_name) title = settings.system_name;
    if (settings?.favicon && !settings.favicon.startsWith('data:')) {
      favicon = settings.favicon;
    }
  } catch (e) {}

  return {
    title,
    description: 'Sistem Absensi Duty IN & Duty OUT Serba Otomatis untuk ASE Roleplay',
    manifest: '/manifest.json',
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings = null;
  try {
    settings = await prisma.systemSettings.findFirst({
      where: { id: 'default' },
      select: {
        primary_color: true,
        secondary_color: true,
        accent_color: true,
        theme_mode: true,
      },
    });
  } catch (e) {}

  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/Logo/TRANSPARENT_ASERP_BLACK_SQUARE.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased selection:bg-brand-500 selection:text-white flex flex-col min-h-screen`}>
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
