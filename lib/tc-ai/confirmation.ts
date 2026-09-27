import { randomUUID } from 'crypto';
import type { ToolName, PendingConfirmation, ToolContext } from './types';
import {
  findVideoByIdOrTitle,
  findUserByIdentifier,
  findRoleByIdOrName,
} from './tools';
import { db } from '@/lib/db';
import { extractYouTubeId, fetchYouTubeMetadata } from '@/lib/youtube';

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

      const memberWhere: any = { role: 'MEMBER', status: 'APPROVED' };
      if (targetRole) {
        memberWhere.profile = { roleId: targetRole.id };
      }

      const count = await db.user.count({ where: memberWhere });
      const targetRoleName = targetRole ? targetRole.name : 'All Members';

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
          roleName: targetRoleName,
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

      const videoId = extractYouTubeId(youtubeUrl);
      if (!videoId) return null;

      const meta = await fetchYouTubeMetadata(youtubeUrl);
      const title = params.title || meta?.title || `Training Course (${videoId})`;
      const thumbnail = meta?.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      let roleName = 'All Members';
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
};

export async function createPendingConfirmation(
  context: ToolContext,
  toolName: ToolName,
  params: any
): Promise<PendingConfirmation | null> {
  const policy = CONFIRMATION_POLICIES[toolName];
  if (!policy || !policy.requiresConfirmation) return null;

  const prepared = await policy.prepare(context, params);
  if (!prepared) return null;

  return {
    id: randomUUID(),
    toolName,
    params: prepared.sanitizedParams,
    summary: prepared.summary,
    prompt: prepared.prompt,
    destructive: policy.destructive,
    previewData: prepared.previewData,
  };
}
