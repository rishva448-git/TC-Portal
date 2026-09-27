import { extractYouTubeId } from '@/lib/youtube';
import type { ToolName } from './types';
import { db } from '@/lib/db';
import type { ChatMessage } from './types';

export interface ParsedIntent {
  toolName: ToolName;
  params: any;
  confidence: number;
  reason?: string;
}

// Check for affirmative confirmation response
export function isAffirmativeResponse(text: string): boolean {
  const clean = text.toLowerCase().trim().replace(/[!.,]/g, '');
  const affirmativeWords = [
    'yes',
    'yep',
    'yeah',
    'sure',
    'ok',
    'okay',
    'confirm',
    'confirmed',
    'proceed',
    'do it',
    'go ahead',
    'add it',
    'approve',
    'archive it',
    'suspend it',
    'send it',
    'yes please',
    'continue',
    'y',
  ];
  return affirmativeWords.includes(clean) || clean.startsWith('yes ') || clean.startsWith('proceed ');
}

// Check for negative cancellation response
export function isNegativeResponse(text: string): boolean {
  const clean = text.toLowerCase().trim().replace(/[!.,]/g, '');
  const negativeWords = [
    'no',
    'nope',
    'cancel',
    'stop',
    'abort',
    "don't",
    'do not',
    'nevermind',
    'never mind',
    'not now',
    'n',
  ];
  return negativeWords.includes(clean) || clean.startsWith('no ') || clean.startsWith('cancel ');
}

/**
 * Deterministic Natural Language Understanding Engine
 * Parses natural language commands into one of the 23 TC AI tools with high accuracy.
 */
export async function parseNaturalLanguageCommand(query: string, history: ChatMessage[] = []): Promise<ParsedIntent | null> {
  const text = query.trim();
  const lower = text.toLowerCase();

  if (/approve\s+(?:all|every)\s+pending\s+members?/i.test(text) || /pending members ellarayum approve/i.test(text)) {
    return { toolName: 'bulk_approve_members', params: {}, confidence: 0.99 };
  }

  const bulkJsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
  if (bulkJsonMatch && /bulk|multiple|these videos|these members|notifications/i.test(lower)) {
    try {
      const parsedJson = JSON.parse(bulkJsonMatch[0]);
      const data = Array.isArray(parsedJson) ? { videos: parsedJson } : parsedJson;
      if (/archive/i.test(lower) && Array.isArray(data.identifiers)) return { toolName: 'bulk_archive_videos', params: data, confidence: 0.99 };
      if (/publish/i.test(lower) && Array.isArray(data.identifiers)) return { toolName: 'bulk_publish_videos', params: data, confidence: 0.99 };
      if (/assign/i.test(lower) && Array.isArray(data.items)) return { toolName: 'bulk_assign_role', params: data, confidence: 0.99 };
      if (/notification|notify/i.test(lower) && Array.isArray(data.items)) return { toolName: 'bulk_create_notifications', params: data, confidence: 0.99 };
      if (/update|mark/i.test(lower) && Array.isArray(data.items)) return { toolName: 'bulk_update_videos', params: data, confidence: 0.99 };
      if (/add|upload|create/i.test(lower) && Array.isArray(data.videos)) return { toolName: 'bulk_add_videos', params: data, confidence: 0.99 };
    } catch {
      return null;
    }
  }

  if (/(?:mark|set|make)\s+(?:the\s+)?frontend\s+and\s+backend.*required|frontend\s+backend\s+required\s+ah\s+mark/i.test(lower)) {
    const roles = await db.role.findMany({ select: { id: true, name: true } });
    const roleIds = roles.filter((role) => /frontend|backend/i.test(role.name)).map((role) => role.id);
    const videos = await db.video.findMany({ where: { roleId: { in: roleIds } }, select: { id: true } });
    return {
      toolName: 'bulk_update_videos',
      params: { items: videos.map((video) => ({ identifier: video.id, updates: { priority: 'Required' } })) },
      confidence: 0.98,
    };
  }

  if (/audit\s*logs?|audit trail/i.test(lower)) {
    const search = /bulk/i.test(lower) ? 'TC_AI_BULK' : undefined;
    return { toolName: 'get_audit_logs', params: { search, limit: 20 }, confidence: 0.95 };
  }

  if (/bulk|these videos|approved videos|bulk upload/i.test(lower) && /add|upload|prepare|create/i.test(lower)) {
    const sourceMessages = [text, ...history.filter((item) => item.role === 'assistant').map((item) => item.content)].reverse();
    const videos: Array<Record<string, string>> = [];
    for (const source of sourceMessages) {
      const pattern = /^VIDEO\s+\d+\s*\r?\n\s*Title:\s*\r?\n([^\r\n]+)\r?\n\s*YouTube URL:\s*\r?\n(https?:\/\/[^\s]+)\r?\n\s*Role:\s*\r?\n([^\r\n]+)\r?\n\s*Purpose:\s*\r?\n([^\r\n]+)\r?\n\s*Category:\s*\r?\n([^\r\n]+)\r?\n\s*Difficulty:\s*\r?\n([^\r\n]+)\r?\n\s*Priority:\s*\r?\n([^\r\n]+)\r?\n\s*Description:\s*\r?\n([\s\S]*?)\r?\n\s*Thumbnail:\s*\r?\n[^\r\n]+/gim;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(source))) {
        videos.push({
          title: match[1].trim(),
          youtubeUrl: match[2].trim(),
          roleName: match[3].trim(),
          purpose: match[4].trim(),
          category: match[5].trim(),
          difficulty: match[6].trim(),
          priority: match[7].trim(),
          description: match[8].trim(),
        });
      }
      if (videos.length > 0) break;
    }
    if (videos.length > 0) return { toolName: 'bulk_add_videos', params: { videos }, confidence: 0.95 };
  }

  // 1. YouTube URL detection (for adding/updating videos)
  const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?[^ \n]*v=|embed\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}[^ \n]*)/i;
  const ytMatch = text.match(ytRegex);

  if (ytMatch) {
    const youtubeUrl = ytMatch[0];
    const isRequired = lower.includes('required') || lower.includes('mandatory') || (lower.includes('frontend') && lower.includes('backend'));
    const isImportant = lower.includes('important');
    const priority = isRequired ? 'Required' : isImportant ? 'Important' : 'Normal';

    // Extract potential role mention
    const roles = await db.role.findMany({ select: { id: true, name: true } });
    let detectedRole = null;

    for (const r of roles) {
      if (lower.includes(r.name.toLowerCase())) {
        detectedRole = r;
        break;
      }
    }

    // Purpose detection: look for "purpose:", "to ...", etc.
    let purpose = undefined;
    const purposeMatch = text.match(/(?:purpose|reason)[:\s]+([^.]+)/i);
    if (purposeMatch) {
      purpose = purposeMatch[1].trim();
    }
    const titleMatch = text.match(/\btitle\s*[:=]\s*(?:"([^"]+)"|'([^']+)')/i);

    return {
      toolName: 'add_video',
      params: {
        youtubeUrl,
        roleId: detectedRole?.id || null,
        roleName: detectedRole?.name || 'All Members',
        title: titleMatch?.[1] || titleMatch?.[2],
        priority,
        purpose,
      },
      confidence: 0.95,
      reason: 'Detected YouTube URL with training command',
    };
  }

  const assignVideoMatch = text.match(/(?:assign|add)\s+(?:the\s+)?video\s+(.+?)\s+to\s+(.+?)(?:\s+training)?$/i);
  if (assignVideoMatch && !ytMatch) {
    return {
      toolName: 'assign_video_to_role',
      params: { videoTitle: assignVideoMatch[1].trim(), roleName: assignVideoMatch[2].trim() },
      confidence: 0.9,
    };
  }

  const getVideoMatch = text.match(/(?:show|get|view|find)\s+(?:the\s+)?video\s+(.+)$/i);
  if (getVideoMatch) {
    return { toolName: 'get_video', params: { videoTitle: getVideoMatch[1].trim() }, confidence: 0.9 };
  }

  // 2. Member Approval: "Approve Arun", "Approve TV-001", "Approve member Ravi"
  const approveMatch = text.match(/^approve(?:\s+member)?\s+(.+)$/i);
  if (approveMatch) {
    return {
      toolName: 'approve_member',
      params: { identifier: approveMatch[1].trim() },
      confidence: 0.95,
    };
  }

  // 3. Member Suspension: "Suspend Ravi", "Suspend member TV-002"
  const suspendMatch = text.match(/^suspend(?:\s+member)?\s+(.+)$/i);
  if (suspendMatch) {
    return {
      toolName: 'suspend_member',
      params: { identifier: suspendMatch[1].trim() },
      confidence: 0.95,
    };
  }

  // 4. Member Rejection: "Reject Kumar", "Reject member TV-003"
  const rejectMatch = text.match(/^reject(?:\s+member)?\s+(.+)$/i);
  if (rejectMatch) {
    return {
      toolName: 'reject_member',
      params: { identifier: rejectMatch[1].trim() },
      confidence: 0.95,
    };
  }

  // 5. Member Role Change: "Change Kumar's role to Backend Developer", "Update role of Arun to Frontend Developer"
  const roleChangeMatch = text.match(/(?:change|update|set)\s+(.+?)(?:'s)?\s+role\s+to\s+(.+)/i);
  if (roleChangeMatch) {
    return {
      toolName: 'update_member_role',
      params: {
        identifier: roleChangeMatch[1].replace(/member/i, '').trim(),
        roleName: roleChangeMatch[2].trim(),
      },
      confidence: 0.95,
    };
  }

  const profileUpdateMatch = text.match(/(?:change|update|set)\s+(.+?)(?:'s)?\s+(phone|bio|position|name)\s+to\s+(.+)$/i);
  if (profileUpdateMatch) {
    const field = profileUpdateMatch[2].toLowerCase();
    const fieldName = field === 'name' ? 'fullName' : field;
    return {
      toolName: 'update_member_profile',
      params: { identifier: profileUpdateMatch[1].trim(), [fieldName]: profileUpdateMatch[3].trim() },
      confidence: 0.9,
    };
  }

  // 6. Pending Members: "Show pending members", "Who is pending approval?", "Pending approvals"
  if (
    lower.includes('pending member') ||
    lower.includes('pending approval') ||
    lower.includes('who is pending') ||
    lower.includes('show pending') ||
    lower === 'pending'
  ) {
    return {
      toolName: 'get_pending_members',
      params: {},
      confidence: 0.95,
    };
  }

  // 7. Training Completion: "Who hasn't completed the required training?", "Who hasn't finished training?", "Training completion"
  if (
    lower.includes("hasn't completed") ||
    lower.includes('has not completed') ||
    lower.includes("haven't completed") ||
    lower.includes('have not completed') ||
    lower.includes('incomplete training') ||
    lower.includes('training completion') ||
    lower.includes('training progress')
  ) {
    // Check if role is specified
    const roles = await db.role.findMany({ select: { id: true, name: true } });
    let targetRole = null;
    for (const r of roles) {
      if (lower.includes(r.name.toLowerCase())) {
        targetRole = r;
        break;
      }
    }

    return {
      toolName: 'get_training_completion',
      params: {
        roleId: targetRole?.id,
        roleName: targetRole?.name,
        requiredOnly: true,
      },
      confidence: 0.9,
    };
  }

  // 8. Watch History for a member: "Show Guru's training history", "Show watch history of Arun", "Training history for TV-001"
  const historyMatch = text.match(/(?:show|get|view)\s+(.+?)(?:'s)?\s+(?:training\s+history|watch\s+history|history)/i);
  if (historyMatch) {
    const ident = historyMatch[1].replace(/member/i, '').trim();
    if (ident && !ident.includes('all')) {
      return {
        toolName: 'get_member_watch_history',
        params: { identifier: ident },
        confidence: 0.95,
      };
    }
  }

  // 9. Member Stats: "How many members are approved?", "Show member statistics", "Member stats", "How many members"
  if (
    lower.includes('member statistics') ||
    lower.includes('member stats') ||
    lower.includes('how many members') ||
    lower.includes('member count') ||
    lower.includes('members are approved')
  ) {
    return {
      toolName: 'get_member_statistics',
      params: {},
      confidence: 0.9,
    };
  }

  // 10. Video Stats: "Show video statistics", "Video stats", "How many videos"
  if (
    lower.includes('video statistics') ||
    lower.includes('video stats') ||
    lower.includes('how many videos') ||
    lower.includes('video count')
  ) {
    return {
      toolName: 'get_video_statistics',
      params: {},
      confidence: 0.9,
    };
  }

  // 11. Notification commands: "Send a notification to all Frontend Developers: ...", "Notify role Backend: ..."
  if (lower.includes('notification') || lower.includes('notify')) {
    const roleNotifyMatch = text.match(/(?:send\s+(?:a\s+)?notification|notify)\s+(?:to\s+)?(?:all\s+)?(.+?)(?::|\s+saying\s+|\s+with\s+message\s+)(.+)/i);
    if (roleNotifyMatch) {
      const rolePart = roleNotifyMatch[1].trim();
      const messagePart = roleNotifyMatch[2].trim();

      return {
        toolName: 'notify_role_members',
        params: {
          roleName: rolePart,
          title: `Announcement for ${rolePart}`,
          message: messagePart,
        },
        confidence: 0.95,
      };
    }

    const singleNotifyMatch = text.match(/(?:send\s+(?:a\s+)?notification|notify)\s+(?:to\s+)?(.+?)(?::|\s+saying\s+|\s+with\s+message\s+)(.+)/i);
    if (singleNotifyMatch) {
      const identifier = singleNotifyMatch[1].replace(/^member\s+/i, '').trim();
      return {
        toolName: 'send_notification',
        params: {
          identifier,
          title: 'Portal Notification',
          message: singleNotifyMatch[2].trim(),
        },
        confidence: 0.95,
      };
    }
  }

  const editVideoMatch = text.match(/(?:edit|update|change)\s+(?:the\s+)?video\s+(.+?)\s+(title|purpose|priority|category|difficulty|status)\s+to\s+(.+)$/i);
  if (editVideoMatch) {
    const field = editVideoMatch[2].toLowerCase();
    return {
      toolName: 'edit_video',
      params: { videoTitle: editVideoMatch[1].trim(), [field]: editVideoMatch[3].trim() },
      confidence: 0.9,
    };
  }

  // 12. Role Members List: "Show all Frontend Developers", "Show Frontend Developers", "List Backend Developers"
  const roles = await db.role.findMany({ select: { id: true, name: true } });
  for (const r of roles) {
    const rolePattern = new RegExp(`^(?:show|list|get|find|view|all)\\s+(?:all\\s+)?${r.name}`, 'i');
    if (rolePattern.test(text) || lower === r.name.toLowerCase() || lower === `all ${r.name.toLowerCase()}`) {
      // Check if user specifically asked for videos or members
      if (lower.includes('video') || lower.includes('course') || lower.includes('training')) {
        return {
          toolName: 'list_videos',
          params: {
            roleId: r.id,
            roleName: r.name,
            priority: lower.includes('required') ? 'Required' : undefined,
          },
          confidence: 0.9,
        };
      }

      return {
        toolName: 'list_members',
        params: { roleId: r.id, roleName: r.name },
        confidence: 0.9,
      };
    }
  }

  // 12. Video List with filters: "Show required Backend videos", "Show all videos", "List videos", "Show React videos"
  if (lower.includes('video') || lower.includes('courses')) {
    // Check archive / publish commands first!
    if (lower.startsWith('archive') || lower.includes('archive video') || lower.includes('remove the') || lower.includes('delete the')) {
      const archiveTarget = text.replace(/^(?:archive(?:\s+this|\s+the)?|remove(?:\s+this|\s+the)?|delete(?:\s+this|\s+the)?)\s+/i, '').replace(/video/i, '').trim();
      return {
        toolName: 'archive_video',
        params: { videoTitle: archiveTarget },
        confidence: 0.9,
      };
    }

    if (lower.startsWith('publish') || lower.includes('publish the') || lower.includes('publish video')) {
      const publishTarget = text.replace(/^(?:publish(?:\s+this|\s+the)?)\s+/i, '').replace(/video|draft/i, '').trim();
      return {
        toolName: 'publish_video',
        params: { videoTitle: publishTarget || undefined },
        confidence: 0.9,
      };
    }

    // Role detection
    let targetRoleId = undefined;
    for (const r of roles) {
      if (lower.includes(r.name.toLowerCase())) {
        targetRoleId = r.id;
        break;
      }
    }

    const isRequired = lower.includes('required');
    const status = lower.includes('draft') ? 'Draft' : lower.includes('archive') ? 'Archived' : 'Published';

    // Search query: extract keyword if any
    let search = undefined;
    const searchMatch = text.match(/(?:videos?|courses?)\s+(?:about|on|matching|named)?\s+([a-zA-Z0-9_\s]+)/i);
    if (searchMatch && !lower.includes('all') && !lower.includes('required')) {
      search = searchMatch[1].trim();
    }

    return {
      toolName: 'list_videos',
      params: {
        roleId: targetRoleId,
        priority: isRequired ? 'Required' : undefined,
        status,
        search,
      },
      confidence: 0.85,
    };
  }

  // 13. Archive video fallback: "Archive this video", "Archive React video"
  if (lower.startsWith('archive')) {
    const target = text.replace(/^archive\s+/i, '').replace(/video/i, '').trim();
    return {
      toolName: 'archive_video',
      params: { videoTitle: target },
      confidence: 0.85,
    };
  }

  // 14. Publish video fallback: "Publish the latest draft", "Publish video"
  if (lower.startsWith('publish')) {
    const target = text.replace(/^publish\s+/i, '').replace(/the\s+latest\s+draft/i, '').replace(/video/i, '').trim();
    return {
      toolName: 'publish_video',
      params: { videoTitle: target || undefined },
      confidence: 0.85,
    };
  }


  // 16. Show member details: "Show member Arun", "Who is Arun?", "Get member TV-001"
  const memberGetMatch = text.match(/(?:show|get|view|who is)\s+(?:member\s+)?([a-zA-Z0-9_-]+(?:\s+[a-zA-Z0-9_-]+)?)$/i);
  if (memberGetMatch) {
    const ident = memberGetMatch[1].trim();
    if (!ident.toLowerCase().includes('all') && !ident.toLowerCase().includes('pending') && !ident.toLowerCase().includes('statistic')) {
      return {
        toolName: 'get_member',
        params: { identifier: ident },
        confidence: 0.8,
      };
    }
  }

  // 17. List members fallback: "Show all members", "List members", "Members"
  if (lower.includes('members') || lower === 'members' || lower.includes('list members')) {
    return {
      toolName: 'list_members',
      params: {},
      confidence: 0.8,
    };
  }

  // 18. System Settings: "Show system settings", "System settings", "Get settings"
  if (lower.includes('system setting') || lower.includes('website setting') || lower === 'settings') {
    return {
      toolName: 'get_system_settings',
      params: {},
      confidence: 0.85,
    };
  }

  return null;
}
