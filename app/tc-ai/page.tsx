import React from 'react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import TcAiDashboardPage from '@/app/admin/tc-ai/page';
import { getCurrentUser } from '@/lib/auth';

export default async function TcAiPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && (user.role !== 'MEMBER' || user.status !== 'APPROVED'))) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100">
      <Navbar user={user} />
      <main className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 pb-24 md:pb-8">
        <TcAiDashboardPage />
      </main>
      <MobileNav />
    </div>
  );
}