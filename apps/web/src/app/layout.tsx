import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto Screener',
  description: 'Real-time cryptocurrency screener and analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
