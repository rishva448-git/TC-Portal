'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import DigitalIdCard from '@/components/digital-id/DigitalIdCard';
import {
  LayoutDashboard,
  Award,
  Film,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Edit3,
  BookOpen
} from 'lucide-react';

export default function MemberDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [assignedVideos, setAssignedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();

        if (userData.authenticated) {
          setUser(userData.user);

          const historyRes = await fetch('/api/history');
          const historyData = await historyRes.json();
          if (historyData.history) setHistory(historyData.history);

          const videosRes = await fetch('/api/videos');
          const videosData = await videosRes.json();
          if (videosData.videos) {
            const roleId = userData.user.profile?.roleId;
            setAssignedVideos(videosData.videos.filter((v: any) => v.roleId === roleId || !v.roleId));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalWatched = history.length;
  const completedCount = history.filter((h) => h.completed).length;
  const inProgressCount = totalWatched - completedCount;
  const completionRate = totalWatched > 0 ? Math.round((completedCount / totalWatched) * 100) : 0;

  // Role-specific recommended skill maps (prompt section 14)
  const roleRecommendedSkills: Record<string, string[]> = {
    'AI Automation & AI Agents': ['n8n', 'AI Agents', 'API Integration', 'Webhooks', 'OpenAI API', 'Automation', 'Prompt Engineering', 'Database Integration'],
    'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS', 'Git', 'Responsive Design'],
    'Backend Developer': ['Node.js', 'APIs', 'Databases', 'Authentication', 'Security', 'Backend Architecture', 'Deployment'],
    'UI/UX & Graphic Designer': ['Figma', 'UI Design', 'UX Research', 'Typography', 'Branding', 'Graphic Design', 'Design Systems'],
    'Video Editor': ['Premiere Pro', 'DaVinci Resolve', 'CapCut', 'Motion Graphics', 'Color Grading', 'Sound Design', 'Storytelling'],
    'Sales & Marketing': ['Lead Generation', 'Sales', 'Cold Outreach', 'Client Communication', 'Social Media Marketing', 'Copywriting', 'Branding'],
  };

  const currentRoleName = user.profile?.roleName || 'Frontend Developer';
  const roleSkills = roleRecommendedSkills[currentRoleName] || roleRecommendedSkills['Frontend Developer'];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 pb-24 md:pb-12">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-emerald-400" />
              My Professional Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Role: <span className="text-blue-400 font-semibold">{currentRoleName}</span> • Member ID: <span className="font-mono text-gray-300">{user.profile?.memberId}</span>
            </p>
          </div>

          <Link
            href="/profile"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-md shadow-blue-500/20"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </Link>
        </div>

        {/* MAIN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: DIGITAL IDENTITY CARD */}
          <div className="space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Digital Employee Identity
            </h2>

            <DigitalIdCard
              member={{
                memberId: user.profile?.memberId || 'TV-001',
                fullName: user.profile?.fullName || '',
                email: user.email,
                phone: user.profile?.phone,
                position: user.profile?.position || '',
                roleName: currentRoleName,
                company: user.profile?.company || 'Techveons Creations',
                profilePhoto: user.profile?.profilePhoto,
                skills: user.profile?.skills || [],
                joiningDate: user.profile?.joiningDate,
                status: user.status,
              }}
            />
          </div>

          {/* RIGHT: STATS & ROLE SPECIFIC DASHBOARD */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Statistics Grid */}
            <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Learning Statistics Overview
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800 text-center">
                  <p className="text-xs text-gray-400 mb-1">Videos Watched</p>
                  <p className="text-2xl font-extrabold text-white">{totalWatched}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800 text-center">
                  <p className="text-xs text-gray-400 mb-1">Completed</p>
                  <p className="text-2xl font-extrabold text-emerald-400">{completedCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800 text-center">
                  <p className="text-xs text-gray-400 mb-1">In Progress</p>
                  <p className="text-2xl font-extrabold text-amber-400">{inProgressCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800 text-center">
                  <p className="text-xs text-gray-400 mb-1">Progress Rate</p>
                  <p className="text-2xl font-extrabold text-indigo-400">{completionRate}%</p>
                </div>
              </div>
            </div>

            {/* Role-Specific Recommended Skills Section */}
            <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Recommended Skills for {currentRoleName}
              </h3>

              <div className="flex flex-wrap gap-2">
                {roleSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Assigned Training Videos */}
            <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-blue-400" />
                  Assigned Role Training ({assignedVideos.length})
                </h3>
                <Link href="/videos" className="text-xs text-blue-400 hover:underline">
                  View Catalog
                </Link>
              </div>

              <div className="space-y-3">
                {assignedVideos.slice(0, 3).map((video) => (
                  <Link
                    key={video.id}
                    href={`/videos/${video.id}`}
                    className="p-3.5 rounded-2xl bg-gray-950/60 border border-gray-800 hover:border-blue-500/40 flex items-center justify-between gap-4 transition-all group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-16 h-10 rounded-lg bg-gray-900 overflow-hidden flex-shrink-0">
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 truncate">
                          {video.title}
                        </h4>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{video.purpose}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-[10px] font-bold whitespace-nowrap">
                      Watch
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
