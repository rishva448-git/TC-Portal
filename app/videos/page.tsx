"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import { Search, Play, Film } from 'lucide-react';

export default function VideosPage() {
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.authenticated) setUser(userData.user);

        const rolesRes = await fetch('/api/roles');
        const rolesData = await rolesRes.json();
        if (rolesData.roles) setRoles(rolesData.roles);

        const videosRes = await fetch('/api/videos');
        const videosData = await videosRes.json();
        if (videosData.videos) setVideos(videosData.videos);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRole === 'ALL' || v.roleId === selectedRole || !v.roleId;
    const matchesDifficulty = selectedDifficulty === 'ALL' || v.difficulty === selectedDifficulty;

    return matchesSearch && matchesRole && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 pb-24 md:pb-12">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HEADER & SEARCH BAR */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Film className="w-8 h-8 text-blue-500" />
              Techveons Training Video Catalog
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Explore role-assigned video courses and internal skill development resources.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search training by title, purpose, or skill..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-950/80 border border-gray-800 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* ROLE FILTER TABS */}
        <div className="space-y-3">
          <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
            Filter By Role
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedRole('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedRole === 'ALL'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              All Roles & Training
            </button>

            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedRole === r.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* DIFFICULTY FILTER TABS */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-400 font-medium">Difficulty:</span>
          {['ALL', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                selectedDifficulty === diff
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* VIDEO CARDS GRID */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
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

                  <div className="p-5 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {video.roleName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-800">
                        {video.difficulty}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-white line-clamp-2">{video.title}</h3>
                    
                    <div className="bg-gray-950/60 rounded-xl p-3 border border-gray-800/60">
                      <p className="text-[10px] uppercase font-mono text-blue-400 font-bold mb-1">
                        Why You Should Watch:
                      </p>
                      <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{video.purpose}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/videos/${video.id}`}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/20"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch Training Video</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-12 text-center border border-gray-800 space-y-3">
            <Film className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No training videos found</h3>
            <p className="text-xs text-gray-400">Try adjusting your search terms or filter selection.</p>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
