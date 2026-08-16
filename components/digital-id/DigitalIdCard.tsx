'use client';

import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Building2, Mail, Phone, Calendar, Award, ExternalLink, QrCode, CheckCircle } from 'lucide-react';

interface DigitalIdCardProps {
  member: {
    memberId: string;
    fullName: string;
    email: string;
    phone?: string;
    position: string;
    roleName: string;
    company?: string;
    profilePhoto?: string;
    bio?: string;
    skills: string[];
    joiningDate?: string;
    status: string;
    stats?: {
      completedCount: number;
      totalWatched: number;
      completionRate: number;
    };
  };
  compact?: boolean;
}

export default function DigitalIdCard({ member, compact = false }: DigitalIdCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const formattedDate = member.joiningDate
    ? new Date(member.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : '2026';

  const avatarUrl = member.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.memberId}`;

  return (
    <div className={`relative w-full max-w-md mx-auto perspective-1000 ${compact ? 'text-sm' : ''}`}>
      {/* Container with flip transition */}
      <div
        className={`relative transition-all duration-700 ease-in-out transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT OF DIGITAL IDENTITY CARD */}
        <div className="w-full bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-lg relative overflow-hidden group">

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.png" alt="Techveons Creations" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-white tracking-[0.03em] flex items-center gap-1.5">
                  <span>Techveons Creations</span>
                  <ShieldCheck className="w-4 h-4 text-brand-500" />
                </h3>
                <p className="text-[10px] text-gray-400 font-sans tracking-[0.16em] uppercase">Official Employee Digital ID</p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/30 text-brand-500 text-xs font-mono font-bold">
              {member.memberId}
            </div>
          </div>

          {/* Member Photo & Core Details */}
          <div className="flex items-start space-x-4 mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-500/40 shadow-xl bg-gray-900 flex-shrink-0">
                <img
                  src={avatarUrl}
                  alt={member.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-gray-900 flex items-center justify-center" title="Active Account">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
 
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate tracking-tight">{member.fullName}</h2>
              <p className="text-sm text-brand-500 font-medium truncate mb-1">{member.position}</p>
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                <Sparkles className="w-3 h-3 mr-1 text-brand-500" />
                {member.roleName}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-gray-950/40 rounded-xl p-3.5 border border-gray-800/60 mb-4">
            <div className="flex items-center space-x-2 text-gray-300">
              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{member.phone || '+91 98765 43210'}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{member.company || 'Techveons Creations'}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>Joined {formattedDate}</span>
            </div>
          </div>

          {/* Skill Badges */}
          {member.skills && member.skills.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase font-mono text-gray-400 mb-1.5 flex items-center gap-1">
                <Award className="w-3 h-3 text-brand-500" /> Key Specializations
              </p>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.slice(0, 5).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[11px] bg-brand-500/10 text-brand-300 border border-brand-500/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800/80 text-xs">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              STATUS: {member.status}
            </span>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="text-xs font-semibold text-brand-500 hover:text-brand-400 flex items-center space-x-1 hover:underline"
            >
              <span>View Security Verification</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
