import { db } from '@/lib/db';
import type { ToolName } from './types';

// Tool Declarations for Google Gemini Function Calling
export const GEMINI_TOOL_DECLARATIONS = [
  {
    name: 'add_video',
    description: 'Add a new training video from a YouTube URL assigned to a company role.',
    parameters: {
      type: 'OBJECT',
      properties: {
        youtubeUrl: { type: 'STRING', description: 'The YouTube watch or share URL' },
        roleName: { type: 'STRING', description: 'Target role name e.g. Frontend Developer or ALL' },
        title: { type: 'STRING', description: 'Optional course title. If omitted, will be fetched from YouTube.' },
        priority: { type: 'STRING', enum: ['Normal', 'Important', 'Required'], description: 'Course priority' },
        purpose: { type: 'STRING', description: 'Purpose / why the member must watch this course' },
      },
      required: ['youtubeUrl'],
    },
  },
  {
    name: 'archive_video',
    description: 'Archive a video so it is hidden from active member training (Destructive, requires confirmation).',
    parameters: {
      type: 'OBJECT',
      properties: {
        videoTitle: { type: 'STRING', description: 'Title or identifier of the video to archive' },
      },
      required: ['videoTitle'],
    },
  },
  {
    name: 'publish_video',
    description: 'Publish a draft video so members can start watching it.',
    parameters: {
      type: 'OBJECT',
      properties: {
        videoTitle: { type: 'STRING', description: 'Title of the video, or leave empty for latest draft' },
      },
    },
  },
  {
    name: 'list_videos',
    description: 'List videos with optional role, priority, or search filter.',
    parameters: {
      type: 'OBJECT',
      properties: {
        roleName: { type: 'STRING', description: 'Filter by role name e.g. Backend Developer' },
        priority: { type: 'STRING', enum: ['Normal', 'Important', 'Required', 'ALL'] },
        status: { type: 'STRING', enum: ['Published', 'Draft', 'Archived', 'ALL'] },
        search: { type: 'STRING', description: 'Search keywords' },
      },
    },
  },
  {
    name: 'approve_member',
    description: 'Approve a member registration and activate their portal account (Requires confirmation).',
    parameters: {
      type: 'OBJECT',
      properties: {
        identifier: { type: 'STRING', description: 'Member name, email, or memberId like TV-001' },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'suspend_member',
    description: 'Suspend an active member account (Destructive, requires confirmation).',
    parameters: {
      type: 'OBJECT',
      properties: {
        identifier: { type: 'STRING', description: 'Member name, email, or memberId' },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'reject_member',
    description: 'Reject a pending member registration (Destructive, requires confirmation).',
    parameters: {
      type: 'OBJECT',
      properties: {
        identifier: { type: 'STRING', description: 'Member name, email, or memberId' },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'update_member_role',
    description: 'Change the assigned company role for a member.',
    parameters: {
      type: 'OBJECT',
      properties: {
        identifier: { type: 'STRING', description: 'Member name, email, or memberId' },
        roleName: { type: 'STRING', description: 'New role name e.g. Backend Developer' },
      },
      required: ['identifier', 'roleName'],
    },
  },
  {
    name: 'list_members',
    description: 'List members with optional status or role filter.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', enum: ['APPROVED', 'PENDING', 'SUSPENDED', 'REJECTED', 'ALL'] },
        roleName: { type: 'STRING', description: 'Filter by role' },
        search: { type: 'STRING', description: 'Search query' },
      },
    },
  },
  {
    name: 'get_pending_members',
    description: 'Get all members awaiting administrative registration approval.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_member_watch_history',
    description: 'Get the course watching history and progress for a specific member.',
    parameters: {
      type: 'OBJECT',
      properties: {
        identifier: { type: 'STRING', description: 'Member name, email, or memberId' },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'get_training_completion',
    description: 'Get training completion report and identify members who have not completed required courses.',
    parameters: {
      type: 'OBJECT',
      properties: {
        roleName: { type: 'STRING', description: 'Optional role name to filter report' },
        requiredOnly: { type: 'BOOLEAN', description: 'Focus on required priority videos' },
      },
    },
  },
  {
    name: 'notify_role_members',
    description: 'Send a portal notification to all approved members in a role (Requires confirmation).',
    parameters: {
      type: 'OBJECT',
      properties: {
        roleName: { type: 'STRING', description: 'Target role name or ALL' },
        title: { type: 'STRING', description: 'Notification title' },
        message: { type: 'STRING', description: 'Notification message body' },
      },
      required: ['title', 'message'],
    },
  },
  {
    name: 'get_member_statistics',
    description: 'Get statistical summary of member counts, statuses, and role distribution.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_video_statistics',
    description: 'Get statistical summary of video library counts, statuses, and categories.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'get_system_settings',
    description: 'View current portal system settings.',
    parameters: { type: 'OBJECT', properties: {} },
  },
];

async function getGeminiApiKey(): Promise<string | null> {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;

  try {
    const setting = await db.systemSetting.findUnique({
      where: { key: 'GEMINI_API_KEY' },
    });
    if (setting?.value) return setting.value;
  } catch {}

  return null;
}

export async function callGeminiIfAvailable(
  prompt: string,
  history: Array<{ role: string; content: string }> = []
): Promise<{ toolName: ToolName; params: any } | null> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) return null;

  try {
    const contents = [
      ...history.slice(-6).map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: prompt }] },
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS }],
        toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
        generationConfig: { temperature: 0.1 },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API call returned non-200 status:', response.status);
      return null;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const functionCall = candidate?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;

    if (functionCall && functionCall.name) {
      return {
        toolName: functionCall.name as ToolName,
        params: functionCall.args || {},
      };
    }
  } catch (error) {
    console.error('Error invoking Gemini API:', error);
  }

  return null;
}
