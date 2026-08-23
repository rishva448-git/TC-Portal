import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Techveons Creations — Digital Identity & Skill Platform',
  description: 'Internal Employee Digital Identity, Skill Development, and Training Management Platform for Techveons Creations.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F19] text-gray-100 min-h-screen antialiased font-sans selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
