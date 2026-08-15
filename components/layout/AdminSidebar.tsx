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
  LogOut,
  ArrowLeft,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const isNavActive = (path: string) => pathname === path;

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/members', label: 'Members', icon: Users },
    { href: '/admin/videos', label: 'Videos', icon: Video },
    { href: '/admin/videos/add', label: '+ Add Video', icon: PlusCircle, highlight: true },
    { href: '/admin/roles', label: 'Company Roles', icon: Sliders },
    { href: '/admin/analytics', label: 'Learning Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Website Settings', icon: Settings },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-gray-800/80 bg-gray-950/90 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="px-3 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Techveons Creations" className="w-7 h-7 object-contain" />
            <div>
              <span className="text-xs font-bold text-amber-300 tracking-wide uppercase block">ADMIN CONTROL</span>
              <span className="text-[9px] text-gray-500 font-mono tracking-wider">TECHVEONS CREATIONS</span>
            </div>
          </div>
        </div>

        {/* Links */}
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

      {/* Back to Member Portal */}
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
  );
}
