'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Shield } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/analytics');
        const json = await res.json();
        if (json.success) setAnalytics(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const logs = analytics.recentActivity || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-gray-800 pb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-7 h-7 text-indigo-400" />
          Security Audit Logs & Activity Trail
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Historical record of administrative actions, member registration approvals, video updates, and role changes.
        </p>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-950/80 text-gray-400 uppercase font-mono text-[10px] border-b border-gray-800">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-900/40">
                  <td className="p-4 text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-white font-sans font-semibold">
                    {log.target}
                  </td>
                  <td className="p-4 text-gray-300 font-sans">
                    {log.user?.profile?.fullName || 'System Admin'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
