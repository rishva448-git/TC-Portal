'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Award, ArrowRight, ShieldCheck, User, Film } from 'lucide-react';
import DigitalIdCard from '@/components/digital-id/DigitalIdCard';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          setSelectedSkills(data.user.profile?.skills || []);
        } else {
          router.push('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim() && !selectedSkills.includes(customSkillInput.trim())) {
      setSelectedSkills([...selectedSkills, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  const completeOnboarding = async () => {
    if (user?.profile?.id) {
      await fetch(`/api/members/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: selectedSkills }),
      });
    }
    router.push('/home');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 sm:p-8 flex flex-col justify-between max-w-4xl mx-auto">
      {/* Top Header & Progress Stepper */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Techveons Creations" className="w-12 h-12 object-contain" />
            <div>
              <h2 className="font-extrabold text-white text-base font-display tracking-[0.04em]">Techveons Onboarding</h2>
              <p className="text-xs text-blue-400 font-sans tracking-wide">Member Digital Setup</p>
            </div>
          </div>

          <div className="text-xs font-mono text-gray-400">
            Step <span className="text-blue-400 font-bold">{step}</span> of 4
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* STEP 1: WELCOME TO TECHVEONS */}
      {step === 1 && (
        <div className="my-12 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-24 h-24 flex items-center justify-center mx-auto">
            <img src="/logo.png" alt="Techveons Creations" className="w-24 h-24 object-contain" />
          </div>

          <div className="max-w-xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome to Techveons Creations, {user.profile?.fullName}! 👋
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed">
              You are now part of our digital identity & continuous learning platform. Here you can track your role-specific skills, watch assigned training, and showcase your professional identity.
            </p>
          </div>

          <div className="p-4 glass-card rounded-2xl border border-blue-500/30 inline-block text-left max-w-md">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Assigned Position</p>
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">{user.profile?.position}</p>
                <p className="text-xs text-gray-400">{user.profile?.roleName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIRM DIGITAL IDENTITY PROFILE */}
      {step === 2 && (
        <div className="my-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Confirm Your Digital Identity</h2>
            <p className="text-xs text-gray-400 mt-1">
              Here is your official Techveons employee digital identity card.
            </p>
          </div>

          <DigitalIdCard
            member={{
              memberId: user.profile?.memberId || 'TV-001',
              fullName: user.profile?.fullName || '',
              email: user.email,
              phone: user.profile?.phone,
              position: user.profile?.position || '',
              roleName: user.profile?.roleName || 'Member',
              company: 'Techveons Creations',
              profilePhoto: user.profile?.profilePhoto,
              skills: selectedSkills,
              status: user.status,
            }}
          />
        </div>
      )}

      {/* STEP 3: SELECT & CONFIRM SKILLS */}
      {step === 3 && (
        <div className="my-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Select Your Core Skills</h2>
            <p className="text-xs text-gray-400 mt-1">
              Choose the key skills you want to prioritize in your training feed.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-gray-800 space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                'n8n', 'AI Agents', 'APIs', 'React', 'Next.js', 'TypeScript', 'Tailwind CSS',
                'Node.js', 'PostgreSQL', 'Figma', 'UI Design', 'Premiere Pro', 'Motion Graphics',
                'Lead Generation', 'Sales Outreach', 'Python', 'Webhooks', 'Git'
              ].map((skill) => {
                const active = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-blue-600 text-white border border-blue-400 shadow-md shadow-blue-500/30'
                        : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {active ? `✓ ${skill}` : `+ ${skill}`}
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Add Input */}
            <div className="flex items-center space-x-2 pt-3 border-t border-gray-800">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                placeholder="Add custom skill (e.g. OpenAI API)"
                className="flex-1 px-4 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={addCustomSkill}
                className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: READY FOR ROLE DASHBOARD */}
      {step === 4 && (
        <div className="my-12 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-20 h-20 bg-emerald-600/20 rounded-3xl border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-2xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="max-w-xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold text-white">Setup Complete! 🎉</h1>
            <p className="text-sm text-gray-300 leading-relaxed">
              Your personalized <span className="text-blue-400 font-semibold">{user.profile?.roleName}</span> learning dashboard is configured and ready.
            </p>
          </div>

          <div className="p-4 glass-card rounded-2xl border border-gray-800 inline-block text-left max-w-sm">
            <p className="text-xs font-bold text-gray-400 mb-1">YOUR NEXT ACTION</p>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-400" /> Start watching assigned role training
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-gray-800 pt-6">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-900 border border-gray-800 transition-all"
          >
            Back
          </button>
        ) : <div></div>}

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={completeOnboarding}
            className="px-8 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-xl shadow-blue-500/30 flex items-center space-x-2 transition-all"
          >
            <span>Enter Member Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
