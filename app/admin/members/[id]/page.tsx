'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Film,
  Award,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

export default function AdminMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const rolesRes = await fetch('/api/roles');
        const rolesData = await rolesRes.json();
        if (rolesData.roles) setRoles(rolesData.roles);

        if (params.id) {
          const res = await fetch(`/api/members/${params.id}`);
          const data = await res.json();
          if (data.member) {
            setMember(data.member);
            setSelectedRoleId(data.member.profile.roleId || '');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch('/api/members/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id, status: newStatus }),
      });

      setMember({ ...member, status: newStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleUpdate = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRoleId = e.target.value;
    setSelectedRoleId(newRoleId);

    try {
      await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: newRoleId }),
      });
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

  if (!member) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-white">Member Not Found</h2>
        <Link href="/admin/members" className="text-xs text-blue-400 hover:underline">
          Return to Member List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Link
        href="/admin/members"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Members</span>
      </Link>

      {/* MEMBER PROFILE HEADER CARD */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-800">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-900 border-2 border-blue-500/40 flex-shrink-0">
              <img
                src={member.profile.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.profile.memberId}`}
                alt={member.profile.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-white">{member.profile.fullName}</h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {member.profile.memberId}
                </span>
              </div>
              <p className="text-sm text-blue-400 font-medium">{member.profile.position}</p>
              <p className="text-xs text-gray-400 mt-1">{member.email}</p>
            </div>
          </div>

          {/* ADMIN ACTIONS: APPROVE / SUSPEND / REJECT / ASSIGN ROLE */}
          <div className="space-y-3 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 font-medium">Status:</span>
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                {member.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {member.status !== 'APPROVED' && (
                <button
                  onClick={() => handleStatusChange('APPROVED')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
                >
                  Approve Account ✓
                </button>
              )}
              {member.status !== 'SUSPENDED' && (
                <button
                  onClick={() => handleStatusChange('SUSPENDED')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
                >
                  Suspend Account
                </button>
              )}
            </div>

            {/* Change Role Dropdown */}
            <div className="pt-2 border-t border-gray-800">
              <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase font-bold">
                Assigned Role:
              </label>
              <select
                value={selectedRoleId}
                onChange={handleRoleUpdate}
                className="w-full px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-gray-900 text-white">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* LEARNING OVERVIEW STATS (SECTION 20 REQUIREMENT) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
            Learning Progress Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800 text-center">
              <p className="text-xs text-gray-400">Total Videos Watched</p>
              <p className="text-2xl font-extrabold text-white mt-1">{member.stats.totalWatched}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800 text-center">
              <p className="text-xs text-gray-400">Completed Trainings</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{member.stats.completedCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800 text-center">
              <p className="text-xs text-gray-400">In Progress</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{member.stats.inProgressCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800 text-center">
              <p className="text-xs text-gray-400">Completion Rate</p>
              <p className="text-2xl font-extrabold text-indigo-400 mt-1">{member.stats.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* MEMBER COMPLETE WATCH HISTORY LIST */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-400" />
          Complete Member Watch History
        </h2>

        {member.watchHistory && member.watchHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-950/80 text-gray-400 uppercase font-mono text-[10px] border-b border-gray-800">
                <tr>
                  <th className="p-3">Video Title</th>
                  <th className="p-3">Started Date</th>
                  <th className="p-3">Last Watched</th>
                  <th className="p-3">Progress %</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {member.watchHistory.map((historyItem: any) => (
                  <tr key={historyItem.id} className="hover:bg-gray-900/40">
                    <td className="p-3 font-semibold text-white">
                      {historyItem.video?.title}
                    </td>
                    <td className="p-3 font-mono text-gray-400">
                      {new Date(historyItem.startedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono text-gray-400">
                      {new Date(historyItem.lastWatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400">
                      {historyItem.progressPercentage}%
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          historyItem.completed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {historyItem.completed ? 'Completed ✓' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-6">No watch history logged for this member yet.</p>
        )}
      </div>
    </div>
  );
}
