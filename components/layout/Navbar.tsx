'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { NavbarUser } from '@/lib/auth';
import {
  Bell,
  LogOut,
  User,
  ShieldAlert,
  Sparkles,
  LayoutDashboard,
  Film,
  History,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  user?: NavbarUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationsList] = useState(user?.notifications || []);

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const isNavActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) =>
    `inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium tracking-wide transition-colors whitespace-nowrap ${
      isNavActive(path)
        ? 'bg-brand-500/15 text-brand-500 border border-brand-500/30'
        : 'text-gray-300 hover:text-white hover:bg-gray-800/50 border border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-gray-900/95 backdrop-blur-md border-b border-gray-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand */}
        <Link href="/home" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 md:flex-none md:max-w-[280px]">
          <div className="w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center">
            <img src="/logo.png" alt="Techveons Creations" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <span className="font-display text-base sm:text-xl font-semibold tracking-[0.02em] text-white leading-tight block truncate">
              <span className="sm:hidden">Techveons</span>
              <span className="hidden sm:inline">Techveons Creations</span>
            </span>
            <p className="text-[9px] sm:text-[10px] text-gray-400 font-sans tracking-[0.14em] uppercase hidden md:block mt-0.5 truncate">
              Employee Digital Identity & Skill Portal
            </p>
          </div>
        </Link>

        {/* Center: Desktop Navigation */}
        {user && (
          <nav className="hidden md:flex items-center justify-center gap-1 flex-1 px-2">
            <Link href="/home" className={navLinkClass('/home')}>
              <Sparkles className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <span>Home</span>
            </Link>
            <Link href="/videos" className={navLinkClass('/videos')}>
              <Film className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <span>Training Catalog</span>
            </Link>
            <Link href="/history" className={navLinkClass('/history')}>
              <History className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <span>Watch History</span>
            </Link>
            <Link href="/dashboard" className={navLinkClass('/dashboard')}>
              <LayoutDashboard className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <span>My Dashboard</span>
            </Link>
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-3 flex-shrink-0">
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="p-2 sm:p-2.5 rounded-xl border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 relative transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-brand-500 rounded-full ring-2 ring-gray-950 animate-pulse" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-1.5rem))] bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2 font-display tracking-wide">
                        Notifications
                        <span className="px-2 py-0.5 text-xs bg-brand-500/20 text-brand-500 rounded-full font-sans">
                          {unreadCount} new
                        </span>
                      </h4>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-sm">
                      {notificationsList.length > 0 ? (
                        notificationsList.map((n) => (
                          <div
                            key={n.id}
                            className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 hover:border-brand-500/30 transition-all text-xs"
                          >
                            <p className="font-semibold text-white mb-0.5">{n.title}</p>
                            <p className="text-gray-400 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-gray-500 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-6">No new notifications</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl border border-gray-800 hover:border-brand-500/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-brand-500 flex items-center justify-center font-semibold text-white text-sm flex-shrink-0">
                    {user.profile?.profilePhoto ? (
                      <img
                        src={user.profile.profilePhoto || undefined}
                        alt={user.profile.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.profile?.fullName?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="hidden sm:block text-left pr-1">
                    <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {user.profile?.fullName || 'Member'}
                    </p>
                    <p className="text-[10px] text-brand-500 tracking-wide truncate max-w-[120px]">
                      {user.profile?.memberId || user.role}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden xs:block sm:block" />
                </button>
 
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-[min(16rem,calc(100vw-1.5rem))] bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-3 z-50">
                    <div className="p-3 border-b border-gray-800 mb-2 text-sm">
                      <p className="text-sm font-semibold text-white font-display tracking-wide">{user.profile?.fullName}</p>
                      <p className="text-sm text-gray-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">
                        {user.profile?.position || user.role}
                      </span>
                    </div>
 
                    <Link
                      href="/profile"
                      className="w-full px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-xl flex items-center gap-2 transition-all"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 text-brand-500" />
                      <span>View Profile & ID</span>
                    </Link>

                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="w-full px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/10 rounded-xl flex items-center gap-2 transition-all mt-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Admin Control Center</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition-all mt-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-3 sm:px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-lg shadow-brand-500/20 transition-all"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
