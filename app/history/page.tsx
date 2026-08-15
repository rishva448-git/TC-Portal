'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import { History, Play, CheckCircle2, Clock, Film } from 'lucide-react';

export default function WatchHistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'in_progress', 'completed'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.authenticated) setUser(userData.user);

        const historyRes = await fetch('/api/history');
        const historyData = await historyRes.json();
        if (historyData.history) setHistoryItems(historyData.history);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const filteredItems = historyItems.filter((item) => {
    if (filterStatus === 'completed') return item.completed;
    if (filterStatus === 'in_progress') return !item.completed;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 pb-24 md:pb-12">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <History className="w-8 h-8 text-amber-400" />
              Watch & Learning History
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Track your learning progress, completed training modules, and resume where you left off.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({historyItems.length})
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterStatus === 'in_progress'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              In Progress ({historyItems.filter((i) => !i.completed).length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterStatus === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Completed ({historyItems.filter((i) => i.completed).length})
            </button>
          </div>
        </div>

        {/* History Cards Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
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

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {item.roleName}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Last: {new Date(item.lastWatchedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-white line-clamp-1">{item.videoTitle}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{item.purpose}</p>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-400">Progress</span>
                      <span className={item.completed ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                        {item.completed ? '100% Completed ✓' : `${item.progressPercentage}%`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className={`h-full ${item.completed ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${item.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link
                    href={`/videos/${item.videoId}`}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      item.completed
                        ? 'bg-gray-900 text-gray-300 hover:text-white border border-gray-800'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{item.completed ? 'Watch Again' : 'Continue Watching'}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-12 text-center border border-gray-800 space-y-3">
            <History className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No watch history records</h3>
            <p className="text-xs text-gray-400">
              Start watching training videos from the catalog to record your learning activity.
            </p>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
