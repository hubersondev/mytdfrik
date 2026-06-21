import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getTheme } from '@/lib/theme';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MyTDFRIK',
  description: 'Plateforme web de gestion centralisée des demandes clients TECHDIFRIK',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();
  return (
    <html
      lang="fr"
      // Les extensions de navigateur (ex. iorad) et le thème injectent des
      // attributs sur <html> côté client : on évite les faux avertissements
      // d'hydratation, sans masquer ceux du contenu applicatif.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${theme === 'dark' ? 'dark' : ''}`}
      data-theme={theme}
    >
      <body className="flex min-h-full flex-col bg-sand-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
