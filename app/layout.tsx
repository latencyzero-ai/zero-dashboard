import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZERO — Clinic Operations Console',
  description: 'Latency Zero AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
