import React from 'react';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { getCurrentUser } from '@/lib/auth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // STRICT 403 ACCESS DENIED ENFORCEMENT
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col justify-between">
        <Navbar user={user} />
        <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-center justify-center mx-auto text-rose-400 shadow-2xl shadow-rose-500/20 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">403 — Access Denied</h1>
            <p className="text-sm text-rose-400 font-mono">Restricted Administrator Zone</p>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed bg-gray-950/60 p-4 rounded-2xl border border-gray-800">
            You do not have administrative permissions to view this control panel. This access attempt has been logged for security audits.
          </p>

          <Link
            href="/home"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Member Home</span>
          </Link>
        </main>
        <div className="py-6 text-center text-xs font-mono text-gray-600 flex flex-col items-center gap-2">
          <img src="/logo.png" alt="Techveons Creations" className="w-8 h-8 object-contain opacity-70" />
          <span>TECHVEONS SECURITY GATEWAY • AUTHORIZED PERSONNEL ONLY</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col">
      <Navbar user={user} />
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
