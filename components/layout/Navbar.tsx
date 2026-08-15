'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  user?: {
    id: string;
    email: string;
    role: string;
    profile?: {
      fullName: string;
      memberId: string;
      position: string;
      profilePhoto?: string;
    };
    notifications?: Array<{
      id: string;
      title: string;
      message: string;
      read: boolean;
      createdAt: string;
    }>;
  } | null;
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
        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
        : 'text-gray-300 hover:text-white hover:bg-gray-800/50 border border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-gray-900/95 backdrop-blur-md border-b border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left: Brand */}
        <div className="flex items-center min-w-0">
          <Link href="/home" className="flex items-center gap-3 group min-w-0">
            <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="Techveons Creations" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="font-display text-xl font-semibold tracking-[0.04em] text-white leading-none">
                Techveons Creations
              </span>
              <p className="text-[10px] text-gray-400 font-sans tracking-[0.18em] uppercase hidden sm:block mt-1 truncate">
                Employee Digital Identity & Skill Portal
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Navigation */}
        {user ? (
          <nav className="hidden md:flex items-center justify-center gap-1">
            <Link href="/home" className={navLinkClass('/home')}>
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>Home</span>
            </Link>
            <Link href="/videos" className={navLinkClass('/videos')}>
              <Film className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>Training Catalog</span>
            </Link>
            <Link href="/history" className={navLinkClass('/history')}>
              <History className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Watch History</span>
            </Link>
            <Link href="/dashboard" className={navLinkClass('/dashboard')}>
              <LayoutDashboard className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>My Dashboard</span>
            </Link>
          </nav>
        ) : (
          <div />
        )}

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
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
                  className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 relative transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-gray-950 animate-pulse" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2 font-display tracking-wide">
                        Notifications
                        <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full font-sans">
                          {unreadCount} new
                        </span>
                      </h4>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-sm">
                      {notificationsList.length > 0 ? (
                        notificationsList.map((n) => (
                          <div
                            key={n.id}
                            className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 hover:border-blue-500/30 transition-all text-xs"
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
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-blue-500/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center font-semibold text-white text-sm">
                    {user.profile?.profilePhoto ? (
                      <img
                        src={user.profile.profilePhoto}
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
                    <p className="text-[10px] text-blue-400 tracking-wide truncate max-w-[120px]">
                      {user.profile?.memberId || user.role}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-3 z-50">
                    <div className="p-3 border-b border-gray-800 mb-2 text-sm">
                      <p className="text-sm font-semibold text-white font-display tracking-wide">{user.profile?.fullName}</p>
                      <p className="text-sm text-gray-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {user.profile?.position || user.role}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      className="w-full px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-xl flex items-center gap-2 transition-all"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 text-blue-400" />
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
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
              >
                Join Platform
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
