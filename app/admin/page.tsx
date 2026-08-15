'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Video,
  PlusCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sliders,
  FileText
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const analyticsRes = await fetch('/api/analytics');
        const analyticsData = await analyticsRes.json();
        if (analyticsData.success) {
          setAnalytics(analyticsData);
        }

        const membersRes = await fetch('/api/members?status=PENDING');
        const membersData = await membersRes.json();
        if (membersData.members) {
          setPendingMembers(membersData.members);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleApproveMember = async (userId: string, status: string) => {
    try {
      await fetch('/api/members/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });

      setPendingMembers(pendingMembers.filter((m) => m.id !== userId));

      // Reload analytics
      const analyticsRes = await fetch('/api/analytics');
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) setAnalytics(analyticsData);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = analytics?.stats || {
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    totalVideos: 0,
    publishedVideos: 0,
    completedTrainings: 0,
    avgCompletionRate: 0,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
            Admin Control Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Techveons Employee Digital Identity & Skill Development Overview
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
          ADMIN SESSION ACTIVE
        </div>
      </div>

      {/* PROMINENT QUICK ACTIONS BANNER (SECTION 31 REQUIREMENT) */}
      <div className="glass-card rounded-3xl p-6 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-blue-600/10 to-purple-600/10 space-y-4">
        <h2 className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
          ⚡ Administrative Quick Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/videos/add"
            className="p-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex flex-col items-center justify-center space-y-2 shadow-lg shadow-blue-500/25 transition-all text-center group"
          >
            <PlusCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>+ Add Training Video</span>
          </Link>

          <Link
            href="/admin/members"
            className="p-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs border border-gray-800 flex flex-col items-center justify-center space-y-2 transition-all text-center group"
          >
            <Users className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Manage Members ({stats.totalMembers})</span>
          </Link>

          <Link
            href="/admin/analytics"
            className="p-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs border border-gray-800 flex flex-col items-center justify-center space-y-2 transition-all text-center group"
          >
            <BarChart3 className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>View Analytics</span>
          </Link>

          <Link
            href="/admin/videos"
            className="p-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs border border-gray-800 flex flex-col items-center justify-center space-y-2 transition-all text-center group"
          >
            <Video className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Manage Videos ({stats.totalVideos})</span>
          </Link>
        </div>
      </div>

      {/* METRIC STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Total Members</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.totalMembers}</p>
          <p className="text-[10px] text-emerald-400 font-mono">{stats.activeMembers} Approved Active</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400">{stats.pendingMembers}</p>
          <p className="text-[10px] text-gray-400 font-mono">Requires admin review</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Total Videos</span>
            <Video className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.totalVideos}</p>
          <p className="text-[10px] text-indigo-400 font-mono">{stats.publishedVideos} Published Live</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Completed Trainings</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">{stats.completedTrainings}</p>
          <p className="text-[10px] text-gray-400 font-mono">{stats.avgCompletionRate}% avg completion</p>
        </div>
      </div>

      {/* PENDING MEMBER APPROVALS SECTION */}
      {pendingMembers.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-amber-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Member Registrations ({pendingMembers.length})
            </h2>
            <Link href="/admin/members" className="text-xs text-amber-400 hover:underline">
              View All Members
            </Link>
          </div>

          <div className="space-y-3">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-900 font-bold text-white flex items-center justify-center border border-gray-800">
                    {member.profile?.fullName?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {member.profile?.fullName}
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {member.profile?.memberId}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">{member.email} • {member.profile?.position}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleApproveMember(member.id, 'APPROVED')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                  >
                    Approve Member ✓
                  </button>
                  <button
                    onClick={() => handleApproveMember(member.id, 'REJECTED')}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT ACTIVITY STREAM */}
      <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Recent Platform Audit Activity
        </h2>

        <div className="space-y-2">
          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            analytics.recentActivity.map((log: any) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-gray-950/50 border border-gray-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
                    {log.action}
                  </span>
                  <span className="text-white font-semibold">{log.target}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 py-4 text-center">No recent audit log activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
