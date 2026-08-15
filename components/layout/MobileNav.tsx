'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Film, History, LayoutDashboard, User } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  const isNavActive = (path: string) => pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-gray-800 bg-gray-950/90 backdrop-blur-xl px-2 py-2">
      <nav className="flex items-center justify-around">
        <Link
          href="/home"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            isNavActive('/home')
              ? 'text-blue-400 bg-blue-600/10 border border-blue-500/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          href="/videos"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            isNavActive('/videos')
              ? 'text-indigo-400 bg-indigo-600/10 border border-indigo-500/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Film className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Videos</span>
        </Link>

        <Link
          href="/history"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            isNavActive('/history')
              ? 'text-amber-400 bg-amber-600/10 border border-amber-500/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">History</span>
        </Link>

        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            isNavActive('/dashboard')
              ? 'text-emerald-400 bg-emerald-600/10 border border-emerald-500/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>
      </nav>
    </div>
  );
}
