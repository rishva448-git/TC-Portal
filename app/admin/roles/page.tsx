'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Award, CheckCircle2 } from 'lucide-react';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await fetch('/api/roles');
        const data = await res.json();
        if (data.roles) setRoles(data.roles);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const recommendedSkills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          recommendedSkills,
        }),
      });

      const data = await res.json();
      if (data.role) {
        setRoles([...roles, data.role]);
        setName('');
        setDescription('');
        setSkillsInput('');
        setIsAdding(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-7 h-7 text-indigo-400" />
            Company Role Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Define role descriptions and recommended skill targets. Admin can add new roles dynamically anytime.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Role</span>
        </button>
      </div>

      {/* CREATE NEW ROLE FORM */}
      {isAdding && (
        <form onSubmit={handleCreateRole} className="glass-card rounded-3xl p-6 border border-blue-500/30 space-y-4">
          <h3 className="text-sm font-bold text-white">Create Company Role</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Role Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. DevOps & Cloud Specialist"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Recommended Skills (Comma separated)</label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Docker, Kubernetes, CI/CD, AWS"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Responsibilities and target scope for members in this role..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-950/70 border border-gray-800 text-white text-xs focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl bg-gray-900 text-gray-400 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20"
            >
              Save Role
            </button>
          </div>
        </form>
      )}

      {/* ROLES LIST GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                {role.name}
              </h3>
              <span className="text-[10px] font-mono text-gray-500">ID: {role.id.slice(0, 8)}</span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">{role.description}</p>

            {role.recommendedSkills && role.recommendedSkills.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-gray-800">
                <p className="text-[10px] font-mono uppercase font-bold text-blue-400">Target Skill Stack:</p>
                <div className="flex flex-wrap gap-1.5">
                  {role.recommendedSkills.map((s: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-indigo-950/60 text-indigo-300 border border-indigo-700/40">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
