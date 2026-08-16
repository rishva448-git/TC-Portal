'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Play, Pause, Clock, AlertCircle, Award, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface YouTubePlayerProps {
  videoId: string;
  youtubeVideoId: string;
  initialProgress?: number;
  initialCompleted?: boolean;
  onProgressUpdate?: (percentage: number, completed: boolean) => void;
}

export default function YouTubePlayer({
  videoId,
  youtubeVideoId,
  initialProgress = 0,
  initialCompleted = false,
  onProgressUpdate,
}: YouTubePlayerProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [completed, setCompleted] = useState(initialCompleted);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProgress = async (newPercentage: number) => {
    try {
      setIsUpdating(true);
      const capped = Math.min(100, Math.max(0, newPercentage));
      setProgress(capped);

      const isDone = capped >= 100;
      if (isDone && !completed) {
        setCompleted(true);
        // Trigger celebratory confetti effect
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          progressPercentage: capped,
        }),
      });

      if (onProgressUpdate) {
        onProgressUpdate(capped, isDone || completed);
      }
    } catch (e) {
      console.error('Failed to update progress:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Responsive YouTube iFrame Embed */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden glass-card border border-brand-500/30 shadow-2xl bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&enablejsapi=1&rel=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        ></iframe>
      </div>

      {/* Interactive Progress Tracking Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Progress Bar & Status */}
        <div className="w-full md:w-2/3 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-500" />
              Learning Progress Tracking
            </span>
            <span className="text-brand-500 font-mono font-bold">
              {progress}% {completed ? ' (Completed)' : ''}
            </span>
          </div>

          <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800 relative">
            <div
              className={`h-full transition-all duration-500 ${
                completed
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-brand-600 to-brand-400'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Milestone Fast-Update Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          {[25, 50, 75, 100].map((step) => (
            <button
              key={step}
              onClick={() => updateProgress(step)}
              disabled={isUpdating}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                progress >= step
                  ? 'bg-brand-500 text-black shadow-md shadow-brand-500/20'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {step === 100 ? (completed ? '✓ Done' : 'Mark 100%') : `${step}%`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
