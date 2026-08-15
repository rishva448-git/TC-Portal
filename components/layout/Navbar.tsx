'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  LogOut,
  User,
  ShieldAlert,
  Sun,
  Moon,
  Sparkles,
  LayoutDashboard,
  Film,
  History,
  Menu,
  X,
  ChevronDown
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notificationsList, setNotificationsList] = useState(user?.notifications || []);

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

  return (
    <header className="sticky top-0 z-40 w-full bg-gray-900 border-b border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Brand Identity */}
        <div className="flex items-center space-x-6">
          <Link href="/home" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 flex items-center justify-center">
                <img src="/logo.png" alt="Techveons Creations" className="w-full h-full object-contain" />
              </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                TECHVEONS
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  CREATIONS
                </span>
              </span>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider hidden sm:block">
                EMPLOYEE DIGITAL IDENTITY & SKILL PORTAL
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 pl-6 border-l border-gray-800">
              <Link
                href="/home"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isNavActive('/home')
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Home</span>
              </Link>
              <Link
                href="/videos"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isNavActive('/videos')
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Film className="w-4 h-4 text-indigo-400" />
                <span>Training Catalog</span>
              </Link>
              <Link
                href="/history"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isNavActive('/history')
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>Watch History</span>
              </Link>
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isNavActive('/dashboard')
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>My Dashboard</span>
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 flex items-center space-x-1.5 ml-2"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Right Section: Notifications & User Profile */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 relative transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-gray-950 animate-pulse"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Notifications
                        <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
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

              {/* Profile Avatar Button */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-blue-500/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
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
                    <p className="text-[10px] text-blue-400 font-mono truncate max-w-[120px]">
                      {user.profile?.memberId || user.role}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Profile Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-3 z-50">
                    <div className="p-3 border-b border-gray-800 mb-2 text-sm">
                      <p className="text-sm font-bold text-white">{user.profile?.fullName}</p>
                      <p className="text-sm text-gray-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {user.profile?.position || user.role}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      className="w-full px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-xl flex items-center space-x-2 transition-all"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 text-blue-400" />
                      <span>View Profile & ID</span>
                    </Link>

                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="w-full px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/10 rounded-xl flex items-center space-x-2 transition-all mt-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Admin Control Center</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center space-x-2 transition-all mt-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
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
