import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZenOS Observability & Operations',
  description: 'Local-first personal AI workstation observability dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#090d16] text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
