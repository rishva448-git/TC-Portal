'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';
import { User, Mail, Phone, Lock, Save, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          setFullName(data.user.profile?.fullName || '');
          setPhone(data.user.profile?.phone || '');
          setBio(data.user.profile?.bio || '');
          setSkills(data.user.profile?.skills || []);
          setProfilePhoto(data.user.profile?.profilePhoto || '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfilePhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/members/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          bio,
          skills,
          profilePhoto,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update profile');
        return;
      }

      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 pb-24 md:pb-12">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <User className="w-8 h-8 text-blue-500" />
            Edit Professional Profile
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Update your personal profile details, bio, and key skills visible on your digital ID card.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6">
          {/* RESTRICTED FIELDS BANNER */}
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-gray-400 font-mono">Member ID (Locked)</p>
              <p className="font-bold text-white text-sm mt-0.5">{user.profile?.memberId}</p>
            </div>
            <div>
              <p className="text-gray-400 font-mono">Assigned Role (Admin Controlled)</p>
              <p className="font-bold text-blue-400 text-sm mt-0.5">{user.profile?.roleName}</p>
            </div>
            <div>
              <p className="text-gray-400 font-mono">Account Status</p>
              <span className="inline-block mt-1 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {user.status}
              </span>
            </div>
          </div>

          {/* EDITABLE FIELDS */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <label className="sm:w-1/3 text-xs font-semibold text-gray-300 mb-1.5 sm:mb-0">Profile Photo</label>
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-xl bg-gray-900 flex-shrink-0">
                    <img src={profilePhoto || user.profile?.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.profile?.memberId}`} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-sm text-gray-300"
                    />
                    <p className="text-xs text-gray-400 mt-1">Upload an image from your device (PNG, JPG). This will replace your profile photo.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                <label className="sm:w-1/3 block text-xs font-semibold text-gray-300 mb-1.5 sm:mb-0">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                <label className="sm:w-1/3 block text-xs font-semibold text-gray-300 mb-1.5 sm:mb-0">Contact Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Professional Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief bio about your specializations at Techveons..."
                className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
              ></textarea>
            </div>

            {/* Skills Tag Management */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Key Skills & Specializations
              </label>

              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add skill (e.g. Next.js)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                >
                  Add Skill
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-blue-950/60 border border-blue-700/40 text-blue-300 text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-rose-400 hover:text-rose-300 ml-1 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </form>
      </main>

      <MobileNav />
    </div>
  );
}
