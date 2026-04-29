import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation/Navigation';
import Providers from '@/components/Providers/Providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Búho Picks — Picks Deportivos Premium',
  description:
    'Plataforma de análisis estadístico profundo de tenis. Picks diarios ATP y WTA basados en datos reales: ranking, forma, superficie, H2H, servicio y valor esperado.',
  keywords: ['picks tenis', 'análisis ATP', 'predicciones WTA', 'apuestas tenis', 'estadísticas tenis'],
  openGraph: {
    title: 'Búho Picks — Sports AI',
    description: 'Picks diarios de tenis con análisis estadístico profundo',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <Providers>
          <div className="app-layout">
            <Navigation />
            <main className="page-content">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

