'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import {
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  ArrowRight,
  Filter,
  Film,
  Compass,
  Star,
  Check
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();

        if (userData.authenticated) {
          setUser(userData.user);

          // Fetch role-prioritized videos
          const videosRes = await fetch('/api/videos');
          const videosData = await videosRes.json();

          if (videosData.videos) {
            setVideos(videosData.videos);
          }

          // Fetch watch history
          const historyRes = await fetch('/api/history');
          const historyData = await historyRes.json();

          if (historyData.history) {
            setHistory(historyData.history);
          }
        }
      } catch (e) {
        console.error('Home data load error:', e);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter 1: Continue Learning (in progress videos < 100%)
  const continueLearningVideos = history.filter((h) => !h.completed && h.progressPercentage > 0);

  // Filter 2: Recommended For You (assigned to user's role OR roleId is null)
  const userRoleId = user?.profile?.roleId;
  const recommendedVideos = videos.filter((v) => v.roleId === userRoleId || !v.roleId);

  // Filter 3: Recently Added
  const recentlyAddedVideos = [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  // Learning stats calculations
  const totalWatched = history.length;
  const completedCount = history.filter((h) => h.completed).length;
  const completionRate = totalWatched > 0 ? Math.round((completedCount / totalWatched) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 pb-24 md:pb-12">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* PERSONALIZED WELCOME BANNER */}
        <section className="glass-card rounded-3xl p-6 sm:p-8 border border-blue-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{user?.profile?.roleName || 'Techveons Member'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.profile?.fullName?.split(' ')[0] || 'Member'} 👋
              </h1>
              <p className="text-sm text-gray-300">
                Continue building your skills and advancing your professional digital identity.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/videos"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition-all"
              >
                <Film className="w-4 h-4" />
                <span>Browse All Videos</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white text-xs font-bold flex items-center space-x-2 transition-all"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>My Identity Card</span>
              </Link>
            </div>
          </div>
        </section>

        {/* LEARNING PROGRESS OVERVIEW CARDS */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>Videos Watched</span>
              <Film className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">{totalWatched}</p>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-400">{completedCount}</p>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>In Progress</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-amber-400">{continueLearningVideos.length}</p>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>Learning Streak</span>
              <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
            </div>
            <p className="text-2xl font-extrabold text-orange-400">3 Days 🔥</p>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>Completion Rate</span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-400">{completionRate}%</p>
          </div>
        </section>

        {/* SECTION 1: CONTINUE LEARNING */}
        {continueLearningVideos.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Continue Learning
              </h2>
              <Link href="/history" className="text-xs text-blue-400 hover:underline">
                View History
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {continueLearningVideos.map((item) => (
                <div
                  key={item.id}
                  className="glass-card glass-card-hover rounded-2xl overflow-hidden border border-gray-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video bg-gray-900">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.videoTitle}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Link
                          href={`/videos/${item.videoId}`}
                          className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform"
                        >
                          <Play className="w-6 h-6 ml-1" />
                        </Link>
                      </div>

                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-gray-300">
                        {item.duration}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {item.roleName}
                      </span>
                      <h3 className="font-bold text-sm text-white line-clamp-1">{item.videoTitle}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2">{item.purpose}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Progress</span>
                      <span className="font-mono font-bold text-amber-400">{item.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${item.progressPercentage}%` }}
                      ></div>
                    </div>

                    <Link
                      href={`/videos/${item.videoId}`}
                      className="w-full mt-2 py-2 rounded-xl bg-gray-900 hover:bg-blue-600 text-gray-200 hover:text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all border border-gray-800"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Watching</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: RECOMMENDED FOR YOU (ROLE SPECIFIC) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Recommended For You
              </h2>
              <p className="text-xs text-gray-400">
                Custom training assigned for <span className="text-blue-400 font-semibold">{user?.profile?.roleName || 'your role'}</span>
              </p>
            </div>

            <Link href="/videos" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              <span>See All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendedVideos.map((video) => (
              <div
                key={video.id}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden border border-gray-800 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-gray-900">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Link
                        href={`/videos/${video.id}`}
                        className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform"
                      >
                        <Play className="w-6 h-6 ml-1" />
                      </Link>
                    </div>

                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-blue-600/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                      {video.priority}
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-gray-300">
                      {video.duration}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {video.roleName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-800">
                        {video.difficulty}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white line-clamp-1">{video.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{video.purpose}</p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    href={`/videos/${video.id}`}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-blue-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Training</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: RECENTLY ADDED */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            Recently Added Training
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentlyAddedVideos.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="glass-card glass-card-hover rounded-2xl p-3 border border-gray-800 flex items-center space-x-3 group"
              >
                <div className="w-20 h-14 rounded-xl overflow-hidden bg-gray-900 relative flex-shrink-0">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-blue-600/40 transition-all">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{video.roleName}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
