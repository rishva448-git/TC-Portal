'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, ArrowRight, Film, Award, Users } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          if (data.user.role === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/home');
          }
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Techveons Creations" className="w-12 h-12 object-contain" />
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              TECHVEONS CREATIONS
            </span>
            <p className="text-[10px] text-blue-400 font-mono tracking-wider">
              EMPLOYEE PORTAL
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all"
          >
            Register Profile
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto text-center space-y-8 my-12 relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Internal Employee Digital Identity & Training Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Techveons Employee Digital Identity & Skill Development
        </h1>

        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Empowering Techveons Creations team members with role-specific training courses, YouTube video tracking, watch history, and verified digital employee identity profiles.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30 flex items-center space-x-2 transition-all"
          >
            <span>Log In to Member Portal</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/signup"
            className="px-8 py-4 rounded-2xl glass-card text-gray-200 hover:text-white border border-gray-800 font-bold text-sm transition-all"
          >
            Create Member Identity
          </Link>
        </div>

        {/* Core Pillars Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          <div className="glass-card rounded-2xl p-6 border border-gray-800 space-y-2">
            <Award className="w-8 h-8 text-blue-400" />
            <h3 className="font-bold text-white text-base">Digital Identity Cards</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every member receives an official employee digital ID with skill tags and position verification.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-gray-800 space-y-2">
            <Film className="w-8 h-8 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Role-Assigned Training</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Curated YouTube video training prioritized automatically based on your specific company role.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-gray-800 space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Admin Approval System</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Secure authentication, role authorization, approval workflows, and learning analytics.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center py-4 border-t border-gray-800/60 text-xs text-gray-500 font-mono flex flex-col items-center gap-2">
        <img src="/logo.png" alt="Techveons Creations" className="w-8 h-8 object-contain opacity-80" />
        <span>© 2026 Techveons Creations. All rights reserved. Internal Company Platform.</span>
      </footer>
    </div>
  );
}
