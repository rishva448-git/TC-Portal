'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Eye } from 'lucide-react';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch('/api/members');
        const data = await res.json();
        if (data.members) setMembers(data.members);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, []);

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.profile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.profile.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.profile.position.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusClass = (status: string) =>
    status === 'APPROVED'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : status === 'PENDING'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  return (
    <div className="space-y-5 sm:space-y-6 pb-24 md:pb-12">
      <div className="border-b border-gray-800 pb-5">
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 flex-shrink-0" />
          Member Management
        </h1>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          View member profiles, approve pending registrations, and monitor learning activity.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or member ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs w-full overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {['ALL', 'APPROVED', 'PENDING', 'SUSPENDED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white border border-blue-400'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-10">No members found.</p>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="glass-card rounded-2xl border border-gray-800 p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-900 border border-gray-800 flex-shrink-0">
                  {member.profile?.profilePhoto ? (
                    <img
                      src={member.profile.profilePhoto}
                      alt={member.profile.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-white">
                      {member.profile?.fullName?.charAt(0) || 'M'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{member.profile?.fullName}</p>
                      <p className="text-[11px] text-blue-400 tracking-wide">{member.profile?.memberId}</p>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${statusClass(member.status)}`}>
                      {member.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1.5 leading-snug">{member.profile?.position}</p>
                  <p className="text-[11px] text-gray-500">{member.profile?.roleName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-xs border-t border-gray-800/80 pt-3">
                <p className="text-gray-400 break-all">
                  <span className="text-gray-500">Email · </span>
                  <span className="text-gray-200">{member.email}</span>
                </p>
                <p className="text-gray-400">
                  <span className="text-gray-500">Progress · </span>
                  <span className="text-white font-medium">
                    {member.stats.completedCount} / {member.stats.totalWatched} videos
                  </span>
                  <span className="text-indigo-400"> · {member.stats.completionRate}%</span>
                </p>
              </div>

              <Link
                href={`/admin/members/${member.id}`}
                className="w-full px-3 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold transition-all border border-blue-500/30 inline-flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Profile & History</span>
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block glass-card rounded-3xl overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300 min-w-[720px]">
            <thead className="bg-gray-950/80 text-gray-400 uppercase tracking-wider text-[10px] border-b border-gray-800">
              <tr>
                <th className="p-4">Member ID & Profile</th>
                <th className="p-4">Position & Role</th>
                <th className="p-4">Contact Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Watched / Progress</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-900 border border-gray-800 flex-shrink-0">
                        {member.profile?.profilePhoto ? (
                          <img src={member.profile.profilePhoto} alt={member.profile.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-white">
                            {member.profile?.fullName?.charAt(0) || 'M'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{member.profile?.fullName}</p>
                        <p className="text-[10px] text-blue-400">{member.profile?.memberId}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <p className="font-semibold text-gray-200">{member.profile?.position}</p>
                    <p className="text-[10px] text-gray-400">{member.profile?.roleName}</p>
                  </td>

                  <td className="p-4 text-gray-300 break-all max-w-[200px]">
                    {member.email}
                  </td>

                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusClass(member.status)}`}>
                      {member.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-white">
                      {member.stats.completedCount} / {member.stats.totalWatched} Videos
                    </p>
                    <p className="text-[10px] text-indigo-400">{member.stats.completionRate}% Rate</p>
                  </td>

                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-bold transition-all border border-blue-500/30 inline-flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Profile & History</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
