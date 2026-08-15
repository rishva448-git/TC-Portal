'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Video,
  PlusCircle,
  BarChart3,
  Sliders,
  Settings,
  FileText,
  ArrowLeft,
} from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Members', short: 'Members', icon: Users },
  { href: '/admin/videos', label: 'Videos', short: 'Videos', icon: Video },
  { href: '/admin/videos/add', label: '+ Add Video', short: 'Add', icon: PlusCircle, highlight: true },
  { href: '/admin/roles', label: 'Company Roles', short: 'Roles', icon: Sliders },
  { href: '/admin/analytics', label: 'Learning Analytics', short: 'Stats', icon: BarChart3 },
  { href: '/admin/settings', label: 'Website Settings', short: 'Settings', icon: Settings },
  { href: '/admin/audit-logs', label: 'Audit Logs', short: 'Logs', icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const isNavActive = (path: string) => pathname === path;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 glass-panel border-r border-gray-800/80 bg-gray-950/90 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          <div className="px-3 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Techveons Creations" className="w-7 h-7 object-contain" />
              <div>
                <span className="text-xs font-bold text-amber-300 tracking-wide uppercase block">Admin Control</span>
                <span className="text-[9px] text-gray-500 font-sans tracking-wider">Techveons Creations</span>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isNavActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                      : link.highlight
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : link.highlight ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <Link
            href="/home"
            className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Member Portal</span>
          </Link>
        </div>
      </aside>

      {/* Mobile admin nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-950/95 backdrop-blur-xl">
        <nav className="flex items-stretch overflow-x-auto px-1 py-1.5 gap-0.5 scrollbar-none">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isNavActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center min-w-[4.25rem] px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  active
                    ? 'text-amber-300 bg-amber-500/15'
                    : link.highlight
                    ? 'text-blue-300'
                    : 'text-gray-400'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${active ? 'text-amber-400' : link.highlight ? 'text-blue-400' : ''}`} />
                <span className="whitespace-nowrap">{link.short}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
