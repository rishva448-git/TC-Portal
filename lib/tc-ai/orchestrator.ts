import { randomUUID } from 'crypto';
import type {
  ToolContext,
  ChatMessage,
  ChatResponsePayload,
  PendingConfirmation,
  ToolName,
} from './types';
import { executeTool } from './registry';
import { createPendingConfirmation, verifyPendingConfirmation } from './confirmation';
import { parseNaturalLanguageCommand, isAffirmativeResponse, isNegativeResponse } from './nlu';
import { callGeminiIfAvailable } from './gemini';
import { answerCompanyAssistantRequest } from './company-assistant';
import { researchYouTubeTraining } from './youtube-research';
import { db } from '@/lib/db';

export async function processAiMessage(
  context: ToolContext,
  message: string,
  history: ChatMessage[] = [],
  confirmationPayload?: {
    id: string;
    confirmed: boolean;
    token: string;
  }
): Promise<ChatResponsePayload> {
  const user = context.currentUser;
  if (!user) {
    return {
      success: false,
      message: 'Unauthorized: Valid session required.',
      error: 'UNAUTHORIZED',
    };
  }
  if (user.role !== 'ADMIN' && user.role !== 'MEMBER') {
    return { success: false, message: 'Forbidden: authenticated portal access required.', error: 'FORBIDDEN' };
  }

  if (user.role === 'MEMBER') {
    if (user.status !== 'APPROVED' || confirmationPayload) {
      return { success: false, message: 'This action is not available for member accounts.', error: 'FORBIDDEN' };
    }
    const lower = message.toLowerCase();
    const role = user.profile?.roleId ? await db.role.findUnique({ where: { id: user.profile.roleId } }) : null;
    const personalPlanRequest = /training plan|weekly plan|what skills|skills should i learn/i.test(message);
    if (personalPlanRequest) {
      const withRole = role && !lower.includes(role.name.toLowerCase()) ? `${message} for ${role.name}` : message;
      const planned = await answerCompanyAssistantRequest(withRole);
      if (planned) return { success: true, message: planned };
    }

    if (/my progress|progress|completed videos|videos have i completed|next training|training history|what training should i complete|what should i watch/i.test(lower)) {
      if (/training history/i.test(lower)) {
        const result = await executeTool({ currentUser: user }, 'get_member_watch_history', { identifier: user.id });
        return { success: result.success, message: result.message, card: result.card };
      }
      if (/next training|what training should i complete|what should i watch|my progress|\bprogress\b|completed videos|videos have i completed/i.test(lower)) {
        const where = { status: 'Published', OR: [{ roleId: user.profile?.roleId || null }, { roleId: null }] };
        const [videos, completed] = await Promise.all([
          db.video.findMany({ where, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }], select: { id: true, title: true, youtubeUrl: true, priority: true } }),
          db.watchHistory.findMany({ where: { userId: user.id, completed: true }, select: { videoId: true } }),
        ]);
        const completedIds = new Set(completed.map((item) => item.videoId));
        const assignedCompleted = videos.filter((video) => completedIds.has(video.id)).length;
        const next = videos.find((video) => !completedIds.has(video.id) && video.priority === 'Required') || videos.find((video) => !completedIds.has(video.id));
        return {
          success: true,
          message: /next training|what training should i complete|what should i watch/i.test(lower)
            ? next
              ? `You have completed **${assignedCompleted}/${videos.length}** published assigned video(s). Next up: **${next.title}**${next.priority === 'Required' ? ' (Required)' : ''}.\n${next.youtubeUrl}`
              : `You have completed **${assignedCompleted}/${videos.length}** published assigned video(s). There are no incomplete published videos in your assigned catalog.`
            : `Training progress: **${assignedCompleted}/${videos.length}** published assigned videos completed; **${videos.filter((video) => video.priority === 'Required' && !completedIds.has(video.id)).length}** Required video(s) remain.`,
        };
      }
    }
    if (/\bmy\b|\brequired videos\b|training catalog|videos assigned/i.test(lower)) {
      const result = await executeTool({ currentUser: user }, 'list_videos', {
        priority: /required|mandatory/i.test(lower) ? 'Required' : undefined,
      });
      return { success: result.success, message: result.message, card: result.card };
    }

    const companyAnswer = await answerCompanyAssistantRequest(message);
    if (companyAnswer && !/pending work|today|task|department|training content.*missing/i.test(lower)) {
      return { success: true, message: companyAnswer };
    }
    return {
      success: true,
      message: 'I can help with your own assigned training, progress, role skills, and learning plans. Member accounts cannot view other members or run portal administration actions.',
    };
  }

  // ----------------------------------------------------
  // CASE 1: Explicit Confirmation from UI action button
  // ----------------------------------------------------
  if (confirmationPayload) {
    const { confirmed, id, token } = confirmationPayload;
    const ticket = await verifyPendingConfirmation(context, token, id);
    if (!ticket) {
      return {
        success: false,
        message: 'This confirmation is invalid, expired, or already used. Please submit the command again.',
        error: 'INVALID_CONFIRMATION',
      };
    }

    if (!confirmed) {
      return {
        success: true,
        message: 'Action cancelled. No database changes were made.',
      };
    }

    // Execute the confirmed action
    const result = await executeTool(context, ticket.toolName, ticket.params);
    return {
      success: result.success,
      message: result.message,
      card: result.card,
      toolCalls: [
        {
          toolName: ticket.toolName,
          status: result.success ? 'success' : 'failed',
          description: result.message,
          error: result.error,
        },
      ],
      pendingConfirmation: null,
    };
  }

  // ----------------------------------------------------
  // CASE 2: Conversational Confirmation (User typed "Yes" / "No")
  // ----------------------------------------------------
  const lastAssistantMessage = [...history].reverse().find((m) => m.role === 'assistant');
  const pending = lastAssistantMessage?.pendingConfirmation;

  if (pending) {
    if (isNegativeResponse(message)) {
      const ticket = await verifyPendingConfirmation(context, pending.token, pending.id);
      if (!ticket) {
        return { success: false, message: 'This confirmation is invalid, expired, or already used.', error: 'INVALID_CONFIRMATION' };
      }
      return {
        success: true,
        message: 'Action cancelled. No changes were made.',
        toolCalls: [{ toolName: pending.toolName, status: 'cancelled' }],
        pendingConfirmation: null,
      };
    }

    if (isAffirmativeResponse(message)) {
      const ticket = await verifyPendingConfirmation(context, pending.token, pending.id);
      if (!ticket) {
        return {
          success: false,
          message: 'This confirmation is invalid or has expired. Please submit the command again.',
          error: 'INVALID_CONFIRMATION',
        };
      }
      const result = await executeTool(context, ticket.toolName, ticket.params);
      return {
        success: result.success,
        message: result.message,
        card: result.card,
        toolCalls: [
          {
            toolName: ticket.toolName,
            status: result.success ? 'success' : 'failed',
            description: result.message,
            error: result.error,
          },
        ],
        pendingConfirmation: null,
      };
    }
  }

  // ----------------------------------------------------
  // CASE 3: Process New Command
  // ----------------------------------------------------
  const companyAnswer = await answerCompanyAssistantRequest(message);
  if (companyAnswer) return { success: true, message: companyAnswer };

  if (/(find|search|research|prepare|give|need|want|kudu|kodu|venum)/i.test(message) && /video|youtube|tutorial/i.test(message)) {
    const count = Number(message.match(/\b(\d{1,2})\b/)?.[1] || 5);
    const asksForEveryRole = /each|every|all roles|all departments|each sector|ovvoru|ellaa/i.test(message);
    const role = asksForEveryRole
      ? undefined
      : message.match(/(?:for|to)\s+(.+?)(?:\s+(?:with|including|videos?)\b|$)/i)?.[1]?.trim() ||
        (/frontend/i.test(message) ? 'Frontend Developer' : /backend/i.test(message) ? 'Backend Developer' : /marketing|sales/i.test(message) ? 'Sales & Marketing' : /designer|figma/i.test(message) ? 'UI/UX & Graphic Designer' : /video editor|editing/i.test(message) ? 'Video Editor' : /automation|agents/i.test(message) ? 'AI Automation & AI Agents' : undefined);
    try {
      return { success: true, message: await researchYouTubeTraining(message, count, role) };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Could not verify a direct YouTube video for this requirement.',
        error: 'RESEARCH_UNAVAILABLE',
      };
    }
  }
  let targetTool: { toolName: ToolName; params: any } | null = null;

  const parsed = await parseNaturalLanguageCommand(message, history);
  if (parsed) {
    targetTool = {
      toolName: parsed.toolName,
      params: parsed.params,
    };
  } else {
    targetTool = await callGeminiIfAvailable(
      message,
      history.map((h) => ({ role: h.role, content: h.content }))
    );
  }

  // If no intent was recognized, return friendly help
  if (!targetTool) {
    return {
      success: true,
      message: `I'm **TC AI**, your Techveons Portal Assistant. I couldn't identify an exact command for that.\n\nHere are some commands you can try:\n- **Add Video**: \`Add this video to Frontend Developer: https://youtube.com/watch?v=...\`\n- **Approve Member**: \`Approve Arun\` or \`Show pending members\`\n- **Member Statistics**: \`How many members are approved?\`\n- **Training Progress**: \`Who hasn't completed the required training?\`\n- **Watch History**: \`Show Guru's training history\`\n- **Filter Videos**: \`Show required Backend videos\`\n- **Send Notification**: \`Send a notification to all Frontend Developers: Workshop starts at 3 PM\``,
    };
  }

  // Check if this tool requires confirmation
  const confirmation = await createPendingConfirmation(context, targetTool.toolName, targetTool.params);

  if (confirmation) {
    return {
      success: true,
      message: confirmation.prompt,
      pendingConfirmation: confirmation,
      toolCalls: [
        {
          toolName: targetTool.toolName,
          status: 'pending',
          description: confirmation.summary,
        },
      ],
    };
  }

  // Execute directly (read-only tools)
  const result = await executeTool(context, targetTool.toolName, targetTool.params);

  return {
    success: result.success,
    message: result.message,
    card: result.card,
    toolCalls: [
      {
        toolName: targetTool.toolName,
        status: result.success ? 'success' : 'failed',
        description: result.message,
        error: result.error,
      },
    ],
  };
}
