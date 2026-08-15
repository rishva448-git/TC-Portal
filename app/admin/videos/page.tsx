'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Video, PlusCircle, Search, Filter, Trash2, Edit, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideos() {
      try {
        const res = await fetch('/api/videos?status=ALL');
        const data = await res.json();
        if (data.videos) setVideos(data.videos);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await fetch(`/api/videos/${deleteId}`, { method: 'DELETE' });
      setVideos(videos.filter((v) => v.id !== deleteId));
      setDeleteId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Video className="w-7 h-7 text-blue-500" />
            Training Video Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage training content, assign target company roles, edit reasons, and publish updates.
          </p>
        </div>

        <Link
          href="/admin/videos/add"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Training Video</span>
        </Link>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title or purpose..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 text-xs">
          {['ALL', 'Published', 'Draft', 'Archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white border border-blue-400'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* VIDEOS TABLE (SECTION 18 REQUIREMENT) */}
      <div className="glass-card rounded-3xl overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-950/80 text-gray-400 uppercase font-mono text-[10px] border-b border-gray-800">
              <tr>
                <th className="p-4">Thumbnail & Title</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Category & Level</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredVideos.map((video) => (
                <tr key={video.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 flex-shrink-0">
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="max-w-xs">
                        <p className="font-bold text-white line-clamp-1">{video.title}</p>
                        <p className="text-[10px] text-gray-400 line-clamp-1">{video.purpose}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {video.roleName}
                    </span>
                  </td>

                  <td className="p-4">
                    <p className="font-semibold text-gray-200">{video.category}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{video.difficulty}</p>
                  </td>

                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        video.status === 'Published'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {video.status}
                    </span>
                  </td>

                  <td className="p-4 font-mono text-gray-400">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/videos/${video.id}`}
                        className="p-2 rounded-lg bg-gray-900 text-gray-400 hover:text-white hover:border-gray-700 border border-gray-800"
                        title="View Video Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => setDeleteId(video.id)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                        title="Delete Video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 max-w-sm w-full border border-rose-500/30 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Delete Training Video?</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to delete this training video? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/25"
              >
                Delete Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
