'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Video,
  Users,
  Shield,
  Clock,
  Youtube,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Settings,
  HelpCircle,
  Check,
  X,
  Play,
  ArrowRight,
} from 'lucide-react';
import type { ChatMessage, ActionCard, PendingConfirmation } from '@/lib/tc-ai/types';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: `Hello! I am **TC AI**, the internal assistant for Techveons Creations.

  I can help with company knowledge, learning plans, verified YouTube research, and your authorized portal workflows. I won't invent company records or unverified video links.

**Popular commands you can try:**
  • \`Create a 30-day Frontend Developer training plan\`
  • \`Find 5 Tamil tutorials for Frontend Developer\`
  • \`Show pending members\`
  • \`Who hasn't completed required training?\`
  • \`Prepare these videos for bulk upload\``,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export default function TcAiDashboardPage() {
  const isAdmin = usePathname().startsWith('/admin/');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedYtId, setDetectedYtId] = useState<string | null>(null);
  const [resolvedConfirmations, setResolvedConfirmations] = useState<Record<string, 'confirmed' | 'cancelled' | 'failed'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionChips = isAdmin
    ? ['Show pending members', 'Show training content gaps', 'Create a weekly training plan for Frontend Developer', 'Show incomplete mandatory training', 'Find 5 Tamil videos for each company role']
    : ['Show my required videos', 'Show my progress', 'What training should I complete?', 'Create a weekly training plan', 'What skills should I learn?'];

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Detect YouTube URL in live input for visual hint
  useEffect(() => {
    const vidId = extractYouTubeId(input);
    setDetectedYtId(vidId);
  }, [input]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/tc-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: newHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'TC AI request failed.');

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'Action processed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: data.toolCalls,
        card: data.card,
        pendingConfirmation: data.pendingConfirmation,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: error instanceof Error ? `❌ ${error.message}` : '❌ Failed to reach the TC AI service. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleConfirmationAction = async (
    pending: PendingConfirmation,
    confirmed: boolean
  ) => {
    if (isLoading) return;

    const userActionMessage: ChatMessage = {
      id: `user-confirm-${Date.now()}`,
      role: 'user',
      content: confirmed ? 'Yes, proceed with action.' : 'No, cancel action.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userActionMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch('/api/tc-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: confirmed ? 'Confirm' : 'Cancel',
          confirmation: {
            id: pending.id,
            confirmed,
            token: pending.token,
          },
          history: newHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Confirmation request failed.');
      setResolvedConfirmations((prev) => ({
        ...prev,
        [pending.id]: data.success ? (confirmed ? 'confirmed' : 'cancelled') : 'failed',
      }));

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || (confirmed ? '✅ Action executed.' : 'Action cancelled.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: data.toolCalls,
        card: data.card,
        pendingConfirmation: null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: error instanceof Error ? `❌ ${error.message}` : '❌ Error processing confirmation.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
    setResolvedConfirmations({});
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to render markdown bold / lists simply
  const renderFormattedText = (content: string) => {
    return content.split('\n').map((line, idx) => {
      // Bold text replacement
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

      return (
        <div key={idx} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code
                  key={pIdx}
                  className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-indigo-300 font-mono text-xs"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4 pb-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">TC AI</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Founder, research, training, and portal operations
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 text-xs font-medium transition-all"
            title="Reset conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isPending = msg.pendingConfirmation && !resolvedConfirmations[msg.pendingConfirmation.id];
          const resolution = msg.pendingConfirmation ? resolvedConfirmations[msg.pendingConfirmation.id] : null;

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              {!isUser ? (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 border border-indigo-400/30 shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 font-bold text-xs flex-shrink-0">
                  {isAdmin ? 'ADM' : 'YOU'}
                </div>
              )}

              {/* Message Content Container */}
              <div className={`max-w-[85%] sm:max-w-[78%] space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* TOOL CALL BADGES */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.toolCalls.map((tc, tcIdx) => (
                      <span
                        key={tcIdx}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                          tc.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : tc.status === 'cancelled'
                            ? 'bg-gray-800 text-gray-400 border-gray-700'
                            : tc.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        tool: {tc.toolName}
                        {tc.status === 'success' && ' ✓'}
                        {tc.status === 'pending' && ' (confirming)'}
                      </span>
                    ))}
                  </div>
                )}

                {/* TEXT BUBBLE */}
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm border shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/40 rounded-tr-none'
                      : 'bg-gray-900/90 text-gray-200 border-gray-800 backdrop-blur-md rounded-tl-none'
                  }`}
                >
                  {renderFormattedText(msg.content)}
                  <div
                    className={`text-[10px] mt-2 font-mono ${
                      isUser ? 'text-blue-200/80 text-right' : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {/* CONFIRMATION ACTION CARD (Interactive) */}
                {msg.pendingConfirmation && (
                  <div
                    className={`p-4 rounded-2xl border backdrop-blur-md transition-all ${
                      resolution === 'confirmed'
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : resolution === 'cancelled'
                        ? 'bg-gray-900/40 border-gray-800 opacity-60'
                        : msg.pendingConfirmation.destructive
                        ? 'bg-rose-950/20 border-rose-500/30 shadow-lg shadow-rose-500/5'
                        : 'bg-indigo-950/20 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider mb-2">
                      {msg.pendingConfirmation.destructive ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span className="text-rose-400">Action Requires Confirmation</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                          <span className="text-indigo-400">Action Verification</span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-gray-300 mb-3">{msg.pendingConfirmation.summary}</p>

                    {/* Preview details if available */}
                    {msg.pendingConfirmation.previewData && (
                      <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-800 text-xs text-gray-300 space-y-1.5 mb-3">
                        {msg.pendingConfirmation.previewData.thumbnailUrl && (
                          <div className="w-full h-24 rounded-lg overflow-hidden bg-black mb-2 relative">
                            <img
                              src={msg.pendingConfirmation.previewData.thumbnailUrl}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {msg.pendingConfirmation.previewData.title && (
                          <div>
                            <span className="text-gray-400">Title:</span>{' '}
                            <span className="font-semibold text-white">
                              {msg.pendingConfirmation.previewData.title}
                            </span>
                          </div>
                        )}
                        {msg.pendingConfirmation.previewData.roleName && (
                          <div>
                            <span className="text-gray-400">Role:</span>{' '}
                            <span className="text-amber-300">
                              {msg.pendingConfirmation.previewData.roleName}
                            </span>
                          </div>
                        )}
                        {msg.pendingConfirmation.previewData.fullName && (
                          <div>
                            <span className="text-gray-400">Member:</span>{' '}
                            <span className="font-semibold text-white">
                              {msg.pendingConfirmation.previewData.fullName}
                            </span>{' '}
                            ({msg.pendingConfirmation.previewData.email})
                          </div>
                        )}
                        {msg.pendingConfirmation.previewData.recipientCount !== undefined && (
                          <div>
                            <span className="text-gray-400">Recipients:</span>{' '}
                            <span className="font-bold text-emerald-400">
                              {msg.pendingConfirmation.previewData.recipientCount} member(s)
                            </span>
                          </div>
                        )}
                        {msg.pendingConfirmation.previewData.affectedCount !== undefined && (
                          <div>
                            <span className="text-gray-400">Records in action:</span>{' '}
                            <span className="font-bold text-amber-300">{msg.pendingConfirmation.previewData.affectedCount}</span>
                          </div>
                        )}
                        {msg.pendingConfirmation.previewData.roles?.map((role: { name: string; count: number }) => (
                          <div key={role.name} className="flex justify-between gap-3">
                            <span>{role.name}</span>
                            <span className="font-mono text-amber-300">{role.count}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    {isPending ? (
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() =>
                            handleConfirmationAction(msg.pendingConfirmation!, true)
                          }
                          disabled={isLoading}
                          className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center space-x-1.5 ${
                            msg.pendingConfirmation.destructive
                              ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-500/20'
                              : 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm & Execute</span>
                        </button>
                        <button
                          onClick={() =>
                            handleConfirmationAction(msg.pendingConfirmation!, false)
                          }
                          disabled={isLoading}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-all flex items-center space-x-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 pt-1">
                        {resolution === 'confirmed' ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Action Confirmed & Completed
                          </span>
                        ) : resolution === 'failed' ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Action Failed
                          </span>
                        ) : (
                          <span className="text-gray-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Action Cancelled
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* RICH RESULT CARD (Visual Data Displays) */}
                {msg.card && <RenderActionCard card={msg.card} />}
              </div>
            </div>
          );
        })}

        {/* LOADING STATE */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 border border-indigo-400/30 shadow-md">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-gray-900 border border-gray-800 flex items-center space-x-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
              <span>TC AI is querying backend tools & database...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTION PILLS */}
      <div className="flex-shrink-0 flex items-center overflow-x-auto py-1 gap-1.5 scrollbar-none">
        <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap pl-1">Quick:</span>
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-[11px] whitespace-nowrap transition-all"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* DETECTED YOUTUBE URL PREVIEW HINT */}
      {detectedYtId && (
        <div className="flex-shrink-0 p-2.5 rounded-xl bg-gray-950 border border-red-500/30 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-8 rounded overflow-hidden bg-black flex-shrink-0 border border-gray-800">
              <img
                src={getYouTubeThumbnail(detectedYtId)}
                alt="YT"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-semibold text-white flex items-center gap-1">
                <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Video Detected
              </span>
              <span className="text-[10px] text-gray-400 font-mono">ID: {detectedYtId}</span>
            </div>
          </div>
          <span className="text-[10px] text-indigo-400 font-mono">Press Send to Prepare & Add</span>
        </div>
      )}

      {/* INPUT FORM */}
      <div className="flex-shrink-0 relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Instruct TC AI: e.g. 'Add this video to Frontend Developer: https://...' or 'Approve Arun'"
            className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-gray-950 border border-gray-800 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 resize-none shadow-xl transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-40 hover:opacity-95 transition-all shadow-md shadow-indigo-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SUBCOMPONENT: RENDER ACTION CARDS
// ----------------------------------------------------
function RenderActionCard({ card }: { card: ActionCard }) {
  const { type, data } = card;

  switch (type) {
    case 'video_preview':
      return (
        <div className="p-3.5 rounded-2xl bg-gray-950/90 border border-gray-800 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-28 aspect-video rounded-xl overflow-hidden bg-black flex-shrink-0 border border-gray-800 relative">
              <img src={data.thumbnailUrl} alt={data.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="font-bold text-white text-xs sm:text-sm truncate">{data.title}</h4>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  {data.roleName || 'All Members'}
                </span>
                <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                  {data.status}
                </span>
                {data.priority && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {data.priority}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-1">{data.purpose}</p>
            </div>
          </div>
          {data.id && (
            <div className="pt-2 border-t border-gray-800 flex justify-end">
              <Link
                href={`/videos/${data.id}`}
                className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
              >
                <span>View Course Player</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      );

    case 'video_list':
      return (
        <div className="p-3 rounded-2xl bg-gray-950/90 border border-gray-800 space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Video Results</h4>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {data.map((video: any) => (
              <div
                key={video.id}
                className="p-2 rounded-xl bg-gray-900/60 hover:bg-gray-900 border border-gray-800 flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-10 h-7 rounded overflow-hidden bg-black flex-shrink-0">
                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{video.title}</p>
                    <p className="text-[10px] text-gray-400">{video.roleName} • {video.priority}</p>
                  </div>
                </div>
                <Link
                  href={`/videos/${video.id}`}
                  className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white flex-shrink-0"
                  title="Open video"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      );

    case 'member_card':
      return (
        <div className="p-4 rounded-2xl bg-gray-950/90 border border-gray-800 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              {data.fullName?.substring(0, 2).toUpperCase() || 'MB'}
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{data.fullName}</h4>
              <p className="text-xs text-gray-400 font-mono">{data.memberId} • {data.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-gray-900/60 border border-gray-800">
              <span className="text-[10px] text-gray-500 block">Assigned Role</span>
              <span className="font-semibold text-amber-300">{data.roleName}</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-900/60 border border-gray-800">
              <span className="text-[10px] text-gray-500 block">Status</span>
              <span className={`font-semibold ${data.status === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.status}
              </span>
            </div>
          </div>
          {data.stats && (
            <div className="p-2.5 rounded-xl bg-gray-900/40 border border-gray-800 text-xs flex justify-between items-center">
              <span className="text-gray-400">Training Completion:</span>
              <span className="font-mono font-bold text-indigo-400">
                {data.stats.completed} / {data.stats.totalWatched} ({data.stats.completionRate}%)
              </span>
            </div>
          )}
        </div>
      );

    case 'stats_widget':
      return (
        <div className="p-4 rounded-2xl bg-gray-950/90 border border-gray-800 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(data)
              .filter(([k, v]) => typeof v === 'number')
              .map(([key, value]) => (
                <div key={key} className="p-2.5 rounded-xl bg-gray-900/70 border border-gray-800 text-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-mono">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-lg font-extrabold text-white">{String(value)}</span>
                </div>
              ))}
          </div>
        </div>
      );

    case 'training_completion':
      return (
        <div className="p-4 rounded-2xl bg-gray-950/90 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white uppercase tracking-wider">Required Training Audit</span>
            {data.totalRequiredVideos !== undefined && (
              <span className="font-mono text-gray-400">
                {data.completedCount}/{data.totalApprovedMembers} Members Done
              </span>
            )}
          </div>
          {data.incompleteMembers && data.incompleteMembers.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {data.incompleteMembers.map((m: any) => (
                <div
                  key={m.id}
                  className="p-2 rounded-xl bg-gray-900/60 border border-gray-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-white block">{m.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{m.memberId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {m.completedCount}/{m.totalRequired}
                    </span>
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${m.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}
