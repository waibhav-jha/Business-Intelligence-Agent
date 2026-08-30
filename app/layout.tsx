import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skylark Drones - Business Intelligence AI Agent',
  description: 'Executive Business Intelligence & Monday.com Resilient Analytics Agent for Skylark Drones',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
