'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [companyName, setCompanyName] = useState('Techveons Creations');
  const [announcement, setAnnouncement] = useState('Welcome to Techveons Employee Digital Identity & Skill Platform 🚀');
  const [trainingRequired, setTrainingRequired] = useState('2');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.company_name) setCompanyName(data.settings.company_name);
          if (data.settings.announcement) setAnnouncement(data.settings.announcement);
          if (data.settings.training_required_per_week) setTrainingRequired(data.settings.training_required_per_week);
        }
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          announcement,
          training_required_per_week: trainingRequired,
        }),
      });

      setSuccessMessage('Platform settings saved successfully.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <div className="border-b border-gray-800 pb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-amber-400" />
          Website & Platform Settings
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage company branding title, platform announcements, and training policy rules.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-950/50 border border-gray-800">
          <img src="/logo.png" alt="Techveons Creations" className="w-16 h-16 object-contain" />
          <div>
            <p className="text-sm font-bold text-white">Company Brand Logo</p>
            <p className="text-xs text-gray-400 mt-0.5">Displayed across login, navbar, digital ID, and portal pages.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Platform Announcement Banner Message
          </label>
          <input
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Target Weekly Training Videos Per Member
          </label>
          <input
            type="number"
            value={trainingRequired}
            onChange={(e) => setTrainingRequired(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Platform Settings</span>
        </button>
      </form>
    </div>
  );
}
