'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Video, Award, CheckCircle2 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        const json = await res.json();
        if (json.success) setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { stats, membersByRole, topVideos } = data;

  const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            Learning Analytics & Performance Metrics
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Visual insights on company-wide training adoption, completion rates, and member engagement.
          </p>
        </div>
      </div>

      {/* METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-1">
          <p className="text-xs text-gray-400">Total Company Members</p>
          <p className="text-2xl font-extrabold text-white">{stats.totalMembers}</p>
          <p className="text-[10px] text-emerald-400 font-mono">{stats.activeMembers} Active Approved</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-1">
          <p className="text-xs text-gray-400">Total Video Courses</p>
          <p className="text-2xl font-extrabold text-white">{stats.totalVideos}</p>
          <p className="text-[10px] text-indigo-400 font-mono">{stats.publishedVideos} Published</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-1">
          <p className="text-xs text-gray-400">Total Video Views</p>
          <p className="text-2xl font-extrabold text-amber-400">{stats.totalWatches}</p>
          <p className="text-[10px] text-gray-400 font-mono">Watch history records</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-1">
          <p className="text-xs text-gray-400">Avg Completion Rate</p>
          <p className="text-2xl font-extrabold text-emerald-400">{stats.avgCompletionRate}%</p>
          <p className="text-[10px] text-emerald-400 font-mono">{stats.completedTrainings} Finished ✓</p>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CHART 1: MEMBERS & VIDEOS BY ROLE */}
        <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Users className="w-4 h-4 text-blue-400" />
            Members & Training Videos By Company Role
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={membersByRole} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="roleName" stroke="#9CA3AF" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="memberCount" name="Members" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="videoCount" name="Videos" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: TOP WATCHED COURSES */}
        <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Most Watched Training Courses
          </h2>

          <div className="space-y-3 pt-2">
            {topVideos.map((vid: any, idx: number) => (
              <div
                key={vid.id}
                className="p-3.5 rounded-2xl bg-gray-950/60 border border-gray-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-bold font-mono flex items-center justify-center flex-shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{vid.title}</p>
                    <p className="text-[10px] text-gray-400">{vid.roleName}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-amber-400 font-mono">{vid.watchCount} Views</p>
                  <p className="text-[10px] text-gray-500">Popularity rank</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
