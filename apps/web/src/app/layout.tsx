import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { AlertPopup } from '@/components/alert-popup';
import { CoinDetail } from '@/components/coin-detail';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Crypto Screener',
  description: 'Real-time cryptocurrency analytics platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground">
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
          <CoinDetail />
          <AlertPopup />
        </Providers>
      </body>
    </html>
  );
}
