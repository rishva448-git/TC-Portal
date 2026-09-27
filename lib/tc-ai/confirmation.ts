import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type { ToolName, PendingConfirmation, ToolContext } from './types';
import {
  findVideoByIdOrTitle,
  findUserByIdentifier,
  findRoleByIdOrName,
} from './tools';
import { db } from '@/lib/db';
import { extractYouTubeId, fetchVerifiedYouTubeMetadata, isValidYouTubeUrl } from '@/lib/youtube';
import { prepareBulkMemberApproval } from './bulk-tools';

export interface ConfirmationConfig {
  requiresConfirmation: boolean;
  destructive: boolean;
  prepare: (context: ToolContext, params: any) => Promise<{
    prompt: string;
    summary: string;
    previewData?: any;
    sanitizedParams: any;
  } | null>;
}

interface ConfirmationTicket {
  id: string;
  userId: string;
  toolName: ToolName;
  params: any;
  expiresAt: number;
}

function confirmationSecret() {
  const secret = process.env.TC_AI_CONFIRMATION_SECRET || process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('Set TC_AI_CONFIRMATION_SECRET or JWT_SECRET in production before using TC AI confirmations.');
  }
  return secret || 'dev-jwt-secret-change-me';
}

function signConfirmation(ticket: ConfirmationTicket) {
  const payload = Buffer.from(JSON.stringify(ticket)).toString('base64url');
  const signature = createHmac('sha256', confirmationSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export async function verifyPendingConfirmation(
  context: ToolContext,
  token: string,
  expectedId: string
): Promise<Pick<ConfirmationTicket, 'toolName' | 'params'> | null> {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  const expectedSignature = createHmac('sha256', confirmationSecret()).update(payload).digest();
  let suppliedSignature: Buffer;
  try {
    suppliedSignature = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (suppliedSignature.length !== expectedSignature.length || !timingSafeEqual(suppliedSignature, expectedSignature)) {
    return null;
  }

  try {
    const ticket = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as ConfirmationTicket;
    if (
      ticket.id !== expectedId ||
      ticket.userId !== context.currentUser.id ||
      ticket.expiresAt < Date.now() ||
      (!CONFIRMATION_POLICIES[ticket.toolName] && !CONFIRMATION_REQUIRED_TOOLS.has(ticket.toolName))
    ) {
      return null;
    }
    const consumed = await db.systemSetting.deleteMany({
      where: { key: `tc_ai_confirmation:${ticket.id}`, value: token },
    });
    if (consumed.count !== 1) return null;
    return { toolName: ticket.toolName, params: ticket.params };
  } catch {
    return null;
  }
}

export const CONFIRMATION_POLICIES: Partial<Record<ToolName, ConfirmationConfig>> = {
  archive_video: {
    requiresConfirmation: true,
    destructive: true,
    prepare: async (context, params) => {
      const video = await findVideoByIdOrTitle(params.videoId || params.videoTitle || '');
      const title = video ? video.title : params.videoTitle || 'this video';
      return {
        prompt: `This will archive '**${title}**'. Continue?`,
        summary: `Archive video '${title}'`,
        previewData: video
          ? {
              id: video.id,
              title: video.title,
              thumbnailUrl: video.thumbnailUrl,
              status: 'Archived',
              roleName: video.role ? video.role.name : 'All Members',
            }
          : { title },
        sanitizedParams: video ? { videoId: video.id } : params,
      };
    },
  },

  suspend_member: {
    requiresConfirmation: true,
    destructive: true,
    prepare: async (context, params) => {
      const user = await findUserByIdentifier(params.identifier);
      if (!user) return null;
      const name = user.profile?.fullName || user.email;
      const memberId = user.profile?.memberId || 'N/A';
      return {
        prompt: `This will suspend member **${name}** (${memberId}). Continue?`,
        summary: `Suspend member ${name} (${memberId})`,
        previewData: {
          id: user.id,
          fullName: name,
          email: user.email,
          memberId,
          position: user.profile?.position,
          currentStatus: user.status,
          nextStatus: 'SUSPENDED',
        },
        sanitizedParams: { identifier: user.id },
      };
    },
  },

  reject_member: {
    requiresConfirmation: true,
    destructive: true,
    prepare: async (context, params) => {
      const user = await findUserByIdentifier(params.identifier);
      if (!user) return null;
      const name = user.profile?.fullName || user.email;
      const memberId = user.profile?.memberId || 'N/A';
      return {
        prompt: `This will reject registration for member **${name}** (${memberId}). Continue?`,
        summary: `Reject member ${name}`,
        previewData: {
          id: user.id,
          fullName: name,
          email: user.email,
          memberId,
          nextStatus: 'REJECTED',
        },
        sanitizedParams: { identifier: user.id },
      };
    },
  },

  notify_role_members: {
    requiresConfirmation: true,
    destructive: false,
    prepare: async (context, params) => {
      const roleInput = params.roleId || params.roleName || '';
      let targetRole = null;
      if (roleInput && roleInput.toUpperCase() !== 'ALL') {
        targetRole = await findRoleByIdOrName(roleInput);
      }
      const invalidRole = Boolean(roleInput && roleInput.toUpperCase() !== 'ALL' && !targetRole);

      const memberWhere: any = { role: 'MEMBER', status: 'APPROVED' };
      if (targetRole) {
        memberWhere.profile = { roleId: targetRole.id };
      }

      const count = invalidRole ? 0 : await db.user.count({ where: memberWhere });
      const targetRoleName = targetRole?.name || (invalidRole ? roleInput : 'All Members');

      return {
        prompt: `This will send a notification to **${count}** member(s) of **${targetRoleName}**. Continue?`,
        summary: `Bulk notification to ${count} members (${targetRoleName})`,
        previewData: {
          recipientCount: count,
          targetRole: targetRoleName,
          title: params.title,
          message: params.message,
        },
        sanitizedParams: {
          roleId: targetRole?.id || null,
          roleName: invalidRole ? roleInput : targetRoleName,
          title: params.title,
          message: params.message,
        },
      };
    },
  },

  update_system_setting: {
    requiresConfirmation: true,
    destructive: true,
    prepare: async (context, params) => {
      return {
        prompt: `This will update system setting '**${params.key}**' to \`${params.value}\`. Continue?`,
        summary: `Update system setting '${params.key}'`,
        previewData: {
          key: params.key,
          newValue: params.value,
        },
        sanitizedParams: { key: params.key, value: params.value },
      };
    },
  },

  add_video: {
    requiresConfirmation: true,
    destructive: false,
    prepare: async (context, params) => {
      const { youtubeUrl } = params;
      if (!youtubeUrl) return null;

      if (!isValidYouTubeUrl(youtubeUrl)) return null;
      const videoId = extractYouTubeId(youtubeUrl);
      if (!videoId) return null;

      const meta = await fetchVerifiedYouTubeMetadata(youtubeUrl);
      if (!meta) return null;
      const title = params.title?.trim() || meta?.title?.trim();
      if (!title) return null;
      const thumbnail = meta?.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      let roleName = params.roleName || 'All Members';
      let roleId = null;
      if (params.roleId || params.roleName) {
        const role = await findRoleByIdOrName(params.roleId || params.roleName);
        if (role) {
          roleId = role.id;
          roleName = role.name;
        }
      }

      const prompt = `I found the YouTube video and prepared it for **${roleName}** training.\n\n**Title**: ${title}\n**Role**: ${roleName}\n**Status**: ${params.status || 'Published'}\n**Priority**: ${params.priority || 'Normal'}\n\nDo you want me to add it?`;

      return {
        prompt,
        summary: `Add '${title}' to ${roleName}`,
        previewData: {
          title,
          youtubeUrl,
          thumbnailUrl: thumbnail,
          roleName,
          roleId,
          category: params.category || 'Technical',
          difficulty: params.difficulty || 'Intermediate',
          priority: params.priority || 'Normal',
          status: params.status || 'Published',
          duration: params.duration || '15m',
          purpose: params.purpose,
        },
        sanitizedParams: {
          ...params,
          title,
          roleId,
          roleName,
          youtubeUrl,
        },
      };
    },
  },

  approve_member: {
    requiresConfirmation: true,
    destructive: false,
    prepare: async (context, params) => {
      const user = await findUserByIdentifier(params.identifier);
      if (!user) return null;
      if (user.status === 'APPROVED') return null; // Already approved, no need for confirm flow

      const name = user.profile?.fullName || user.email;
      const memberId = user.profile?.memberId || 'N/A';
      return {
        prompt: `Ready to approve member **${name}** (${memberId}) and send welcome notification. Continue?`,
        summary: `Approve member ${name}`,
        previewData: {
          id: user.id,
          fullName: name,
          email: user.email,
          memberId,
          position: user.profile?.position || 'Member',
          status: 'PENDING',
        },
        sanitizedParams: { identifier: user.id },
      };
    },
  },
  bulk_add_videos: {
    requiresConfirmation: true,
    destructive: false,
    prepare: async (_context, params) => {
      const videos = Array.isArray(params.videos) ? params.videos : [];
      const roleCounts = new Map<string, number>();
      videos.forEach((video: any) => {
        const roleName = video.roleName || 'Role missing';
        roleCounts.set(roleName, (roleCounts.get(roleName) || 0) + 1);
      });
      const rolePlan = Array.from(roleCounts, ([name, count]) => `- ${name}: ${count}`).join('\n');
      return {
        prompt: `${videos.length} videos are prepared for bulk upload.\n\n${rolePlan || 'No role assignments were provided.'}\n\nEvery video will be validated individually. Continue?`,
        summary: `Bulk add ${videos.length} training videos`,
        sanitizedParams: { videos },
        previewData: { affectedCount: videos.length, roles: Array.from(roleCounts, ([name, count]) => ({ name, count })) },
      };
    },
  },
  bulk_update_videos: {
    requiresConfirmation: true,
    destructive: false,
    prepare: async (_context, params) => {
      const selected = [];
      const missing = [];
      for (const item of params.items || []) {
        const video = await findVideoByIdOrTitle(item.identifier);
        if (video) selected.push({ ...item, identifier: video.id, title: video.title, roleName: video.role?.name || 'All Members' });
        else missing.push(item);
      }
      const roleCounts = new Map<string, number>();
      selected.forEach((item) => roleCounts.set(item.roleName, (roleCounts.get(item.roleName) || 0) + 1));
      const plan = Array.from(roleCounts, ([name, count]) => `- ${name}: ${count}`).join('\n');
      return {
        prompt: `This will update ${selected.length} verified video(s).\n${plan}${missing.length ? `\nNot found (will fail individually): ${missing.map((item: any) => item.identifier || 'missing identifier').join(', ')}` : ''}\nContinue?`,
        summary: `Bulk update ${selected.length} videos; ${missing.length} not found`,
        sanitizedParams: { items: [...selected.map(({ identifier, updates }) => ({ identifier, updates })), ...missing] },
        previewData: { affectedCount: selected.length, items: selected.map(({ title, roleName }) => ({ title, roleName })) },
      };
    },
  },
  bulk_archive_videos: {
    requiresConfirmation: true,
    destructive: true,
    prepare: async (_context, params) => {
      const selected = [];
      const missing = [];
      for (const identifier of params.identifiers || []) {
        const video = await findVideoByIdOrTitle(identifier);
        if (video) selected.push(video);
        else missing.push(identifier);
      }
      const titles = selected.map((video, index) => `${index + 1}. ${video.title}`).join('\n');
      const notFound = missing.length ? `\nNot found (will not be changed): ${missing.join(', ')}` : '';
      return {
        prompt: `${selected.length} verified videos are selected for archiving. This hides them from active training.\n${titles}${notFound}\n\nPlease confirm: ARCHIVE ${selected.length} VIDEOS.`,
        summary: `Bulk archive ${selected.length} videos`,
        sanitizedParams: { identifiers: [...selected.map((video) => video.id), ...missing] },
        previewData: { affectedCount: selected.length },
      };
    },
  },
  bulk_publish_videos: {
    requiresConfirmation: true,
    destructive: false,
    prepare: async (_context, params) => {
      const selected = [];
      const missing = [];
      for (const identifier of params.identifiers || []) {
        const video = await findVideoByIdOrTitle(identifier);
        if (video && video.status !== 'Archived') selected.push(video);
        else missing.push(identifier);
      }
      return {
        prompt: `This will publish ${selected.length} verified video(s):\n${selected.map((video, index) => `${index + 1}. ${video.title}`).join('\n') || 'No publishable videos were found.'}${missing.length ? `\nUnavailable or archived (will fail individually): ${missing.join(', ')}` : ''}\nContinue?`,
        summary: `Bulk publish ${selected.length} videos; ${missing.length} unavailable`,
        sanitizedParams: { identifiers: [...selected.map((video) => video.id), ...missing] },
        previewData: { affectedCount: selected.length },
      };
    },
  },
  bulk_assign_role: {
    requiresConfirmation: true,
    destructive: false,
    prepare: async (_context, params) => {
      const selected = [];
      const invalid = [];
      for (const item of params.items || []) {
        const video = await findVideoByIdOrTitle(item.identifier);
        const role = item.roleName ? await findRoleByIdOrName(item.roleName) : null;
        if (video && (role || /^all(?: members)?$/i.test(item.roleName || ''))) {
          selected.push({ identifier: video.id, videoTitle: video.title, roleName: role?.name || 'All Members' });
        } else invalid.push(item);
      }
      const counts = new Map<string, number>();
      selected.forEach((item) => counts.set(item.roleName, (counts.get(item.roleName) || 0) + 1));
      const rolePlan = Array.from(counts, ([name, count]) => `- ${name}: ${count}`).join('\n');
      return {
        prompt: `This will assign ${selected.length} verified video(s) to their requested roles.\n${rolePlan || 'No valid video and role pairs were found.'}${invalid.length ? `\nInvalid pairs (will fail individually): ${invalid.map((item: any) => `${item.identifier || 'missing video'} → ${item.roleName || 'missing role'}`).join(', ')}` : ''}\nContinue?`,
        summary: `Bulk assign ${selected.length} videos; ${invalid.length} invalid pairs`,
        sanitizedParams: { items: [...selected.map(({ identifier, roleName }) => ({ identifier, roleName })), ...invalid] },
        previewData: { affectedCount: selected.length },
      };
    },
  },
  bulk_create_notifications: {
    requiresConfirmation: true,
    destructive: false,
    prepare: async (_context, params) => {
      const selected = [];
      const invalid = [];
      for (const item of params.items || []) {
        const user = await findUserByIdentifier(item.identifier);
        if (user?.role === 'MEMBER' && user.status === 'APPROVED') {
          selected.push({ ...item, identifier: user.id, fullName: user.profile?.fullName || user.email });
        } else invalid.push(item);
      }
      const names = selected.map((item, index) => `${index + 1}. ${item.fullName}`).join('\n');
      return {
        prompt: `This will send ${selected.length} notification(s) to these approved members:\n${names || 'No approved members matched.'}${invalid.length ? `\nInvalid or unapproved (will fail individually): ${invalid.map((item: any) => item.identifier || 'missing member').join(', ')}` : ''}\nContinue?`,
        summary: `Bulk notification to ${selected.length} members; ${invalid.length} invalid`,
        sanitizedParams: { items: [...selected.map(({ identifier, title, message }) => ({ identifier, title, message })), ...invalid] },
        previewData: { recipientCount: selected.length },
      };
    },
  },
  bulk_approve_members: {
    requiresConfirmation: true,
    destructive: false,
    prepare: async () => {
      const pending = await prepareBulkMemberApproval();
      return {
        prompt: `Found ${pending.identifiers.length} pending member(s).\n\n${pending.preview}\n\nAction: Approve ${pending.identifiers.length} member(s) and send welcome notifications. Confirmation required: YES. Continue?`,
        summary: `Approve ${pending.identifiers.length} pending members`,
        sanitizedParams: { identifiers: pending.identifiers },
        previewData: { affectedCount: pending.identifiers.length },
      };
    },
  },
};

const CONFIRMATION_REQUIRED_TOOLS = new Set<ToolName>([
  'add_video', 'edit_video', 'archive_video', 'publish_video', 'assign_video_to_role',
  'approve_member', 'suspend_member', 'reject_member', 'update_member_role',
  'update_member_profile', 'send_notification', 'notify_role_members', 'update_system_setting',
  'bulk_add_videos', 'bulk_update_videos', 'bulk_archive_videos', 'bulk_publish_videos',
  'bulk_assign_role', 'bulk_create_notifications', 'bulk_approve_members',
]);

function describeAction(toolName: ToolName, params: any) {
  const target = params.videoTitle || params.videoId || params.identifier || 'the selected record';
  switch (toolName) {
    case 'edit_video': return `update video '${target}'`;
    case 'publish_video': return `publish video '${target === 'the selected record' ? 'the latest draft' : target}'`;
    case 'assign_video_to_role': return `assign video '${target}' to ${params.roleName || 'the selected role'}`;
    case 'update_member_role': return `change ${target}'s role to ${params.roleName || 'the selected role'}`;
    case 'update_member_profile': return `update the profile for ${target}`;
    case 'send_notification': return `send a notification to ${target}`;
    case 'add_video': return 'add this YouTube video to training';
    default: return `${toolName.replaceAll('_', ' ')} for ${target}`;
  }
}

export async function createPendingConfirmation(
  context: ToolContext,
  toolName: ToolName,
  params: any
): Promise<PendingConfirmation | null> {
  const policy = CONFIRMATION_POLICIES[toolName];
  if (!policy && !CONFIRMATION_REQUIRED_TOOLS.has(toolName)) return null;

  const prepared = policy
    ? await policy.prepare(context, params)
    : {
        prompt: `This will ${describeAction(toolName, params)}. Continue?`,
        summary: describeAction(toolName, params),
        sanitizedParams: params,
      };
  if (!prepared) return null;

  const id = randomUUID();
  const ticket: ConfirmationTicket = {
    id,
    userId: context.currentUser.id,
    toolName,
    params: prepared.sanitizedParams,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  const token = signConfirmation(ticket);
  await db.systemSetting.create({ data: { key: `tc_ai_confirmation:${id}`, value: token } });

  return {
    id,
    token,
    toolName,
    params: prepared.sanitizedParams,
    summary: prepared.summary,
    prompt: prepared.prompt,
    destructive: policy?.destructive ?? ['archive_video', 'suspend_member', 'reject_member', 'update_system_setting'].includes(toolName),
    previewData: prepared.previewData,
  };
}
