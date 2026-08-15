'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Sparkles, Youtube, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

export default function AdminAddVideoPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [extractedId, setExtractedId] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [roleId, setRoleId] = useState('ALL');
  const [roles, setRoles] = useState<any[]>([]);
  const [category, setCategory] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [priority, setPriority] = useState('Required');
  const [status, setStatus] = useState('Published');
  const [duration, setDuration] = useState('15m');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/roles')
      .then((res) => res.json())
      .then((data) => {
        if (data.roles) setRoles(data.roles);
      });
  }, []);

  // Handle YouTube URL change & auto-extract thumbnail
  const handleUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const vidId = extractYouTubeId(url);
    if (vidId) {
      setExtractedId(vidId);
      setThumbnailUrl(getYouTubeThumbnail(vidId));
    } else {
      setExtractedId(null);
      setThumbnailUrl('');
    }
  };

  const handleSubmit = async (submitStatus: string) => {
    setIsLoading(true);
    setErrorMessage('');

    if (!title || !youtubeUrl || !purpose) {
      setErrorMessage('Title, YouTube URL, and Purpose are required.');
      setIsLoading(false);
      return;
    }

    if (!extractedId) {
      setErrorMessage('Invalid YouTube URL. Please provide a valid watch link.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          youtubeUrl,
          purpose,
          description,
          roleId,
          category,
          difficulty,
          priority,
          status: submitStatus,
          duration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to add video.');
        return;
      }

      router.push('/admin/videos');
      router.refresh();
    } catch (err) {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <Link
        href="/admin/videos"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Video Management</span>
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <PlusCircle className="w-7 h-7 text-blue-500" />
          Add Training Video
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Assign YouTube training courses to company roles with clear learning objectives.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit('Published'); }} className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6">
        {/* VIDEO TITLE */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Video Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete n8n Automation Tutorial"
            className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* YOUTUBE URL & AUTO-THUMBNAIL PREVIEW */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            YouTube Video URL *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-500">
              <Youtube className="w-5 h-5" />
            </div>
            <input
              type="url"
              required
              value={youtubeUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=XXXXXXXX"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Thumbnail Preview Box */}
          {extractedId && thumbnailUrl && (
            <div className="p-4 rounded-2xl bg-gray-950/80 border border-gray-800 flex items-center space-x-4">
              <div className="w-32 aspect-video rounded-xl overflow-hidden bg-black flex-shrink-0 border border-gray-800 relative">
                <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> YouTube Video Identified
                </p>
                <p className="text-[11px] font-mono text-gray-400">ID: {extractedId}</p>
                <p className="text-[10px] text-gray-500">Thumbnail automatically extracted.</p>
              </div>
            </div>
          )}
        </div>

        {/* ASSIGNED ROLE & PURPOSE / REASON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Assigned Company Role *
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="ALL" className="bg-gray-900 text-white">All Members (Company-wide)</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-gray-900 text-white">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Estimated Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 35m or 1h 10m"
              className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* PURPOSE / REASON FOR WATCHING (IMPORTANT SECTION REQUIREMENT) */}
        <div>
          <label className="block text-xs font-semibold text-blue-400 mb-1.5 uppercase font-mono tracking-wider">
            Purpose / Why Member Must Watch This Video *
          </label>
          <textarea
            rows={2}
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Watch this video to master building production n8n workflows and custom OpenAI agent nodes."
            className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-blue-500/30 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
          ></textarea>
        </div>

        {/* CATEGORY, DIFFICULTY, PRIORITY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Skill Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="Technical">Technical</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Communication">Communication</option>
              <option value="Business">Business</option>
              <option value="Productivity">Productivity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Priority Status
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="Normal">Normal</option>
              <option value="Important">Important</option>
              <option value="Required">Required</option>
            </select>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Full Description / Key Takeaways
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed course topics, requirements, and reference notes..."
            className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-sm focus:outline-none focus:border-blue-500"
          ></textarea>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSubmit('Draft')}
            className="px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-xs border border-gray-800 transition-all"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSubmit('Published')}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center space-x-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Publish Video Now 🚀</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
