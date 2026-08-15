"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import YouTubePlayer from '@/components/video-player/YouTubePlayer';
import { ArrowLeft, Sparkles, Shield, Calendar, AlertCircle } from 'lucide-react';

export default function VideoDetailPage() {
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.authenticated) setUser(userData.user);

        if (params.id) {
          const videoRes = await fetch(`/api/videos/${params.id}`);
          const videoData = await videoRes.json();

          if (videoData.video) {
            setVideo(videoData.video);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <h2 className="text-xl font-bold">Training Video Not Found</h2>
        <Link href="/videos" className="text-xs text-blue-400 hover:underline">
          Return to Video Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 pb-24 md:pb-12">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <Link
          href="/videos"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Training Catalog</span>
        </Link>

        {/* YOUTUBE EMBEDDED PLAYER */}
        <YouTubePlayer
          videoId={video.id}
          youtubeVideoId={video.youtubeVideoId}
          initialProgress={video.userProgress?.progressPercentage || 0}
          initialCompleted={video.userProgress?.completed || false}
        />

        {/* VIDEO METADATA & PURPOSE DETAILS */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6">
          {/* Header & Badges */}
          <div className="space-y-3 border-b border-gray-800/80 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {video.roleName}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono text-gray-300 bg-gray-900 border border-gray-800">
                Level: {video.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                Priority: {video.priority}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {video.title}
            </h1>
          </div>

          {/* Purpose Box */}
          <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-800/40 space-y-2">
            <h3 className="text-xs font-bold font-mono text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" /> Why You Should Watch This Video:
            </h3>
            <p className="text-sm text-gray-200 leading-relaxed font-medium">
              "{video.purpose}"
            </p>
          </div>

          {/* Description */}
          {video.description && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Course Overview & Notes:</h4>
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line bg-gray-950/40 rounded-xl p-4 border border-gray-800/60">
                {video.description}
              </p>
            </div>
          )}

          {/* Created Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-800/80">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Assigned by Techveons Training Admin</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Added {new Date(video.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
