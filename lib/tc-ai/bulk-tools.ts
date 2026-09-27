import { db } from '@/lib/db';
import { extractYouTubeId, fetchVerifiedYouTubeMetadata, getYouTubeThumbnail, isValidYouTubeUrl } from '@/lib/youtube';
import type { ToolContext, ToolResult } from './types';
import { auditedWrite, findRoleByIdOrName, findUserByIdentifier, findVideoByIdOrTitle } from './tools';

type BulkItemResult = { index: number; target: string; success: boolean; message: string; id?: string };

async function runItems<T>(items: T[], targetOf: (item: T) => string, action: (item: T, index: number) => Promise<string>): Promise<ToolResult> {
  if (!Array.isArray(items) || items.length === 0) return { success: false, message: 'Provide at least one item for the bulk action.' };
  if (items.length > 50) return { success: false, message: 'A bulk request is limited to 50 items. Split larger work into smaller batches.' };

  const results: BulkItemResult[] = [];
  for (const [index, item] of items.entries()) {
    const target = targetOf(item);
    try {
      const id = await action(item, index);
      results.push({ index: index + 1, target, success: true, message: 'Completed', id });
    } catch (error) {
      results.push({
        index: index + 1,
        target,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown item failure',
      });
    }
  }

  const succeeded = results.filter((item) => item.success).length;
  const failures = results.filter((item) => !item.success);
  const failureText = failures.length
    ? `\n\nFailures:\n${failures.map((item) => `${item.index}. ${item.target}: ${item.message}`).join('\n')}`
    : '';
  const itemSummary = results.map((item) =>
    `${item.index}. [${item.success ? 'SUCCESS' : 'FAILED'}] ${item.target}: ${item.message}`
  ).join('\n');
  return {
    success: failures.length === 0,
    data: results,
    message: `${items.length} items requested. Successfully completed: ${succeeded}. Failed: ${failures.length}.\n\nResults:\n${itemSummary}${failureText}`,
  };
}

function requireAdmin(context: ToolContext) {
  if (context.currentUser.role !== 'ADMIN') throw new Error('Administrator access is required for bulk operations.');
}

export async function bulkAddVideosTool(context: ToolContext, params: { videos?: Array<Record<string, any>> }): Promise<ToolResult> {
  requireAdmin(context);
  return runItems(params.videos || [], (video) => video.title || video.youtubeUrl || 'Video', async (video, index) => {
    if (typeof video.youtubeUrl !== 'string' || !isValidYouTubeUrl(video.youtubeUrl)) throw new Error('Invalid YouTube URL.');
    const youtubeVideoId = extractYouTubeId(video.youtubeUrl);
    if (!youtubeVideoId) throw new Error('Could not extract a valid YouTube video ID.');
    const metadata = await fetchVerifiedYouTubeMetadata(video.youtubeUrl);
    if (!metadata) throw new Error('YouTube could not verify that this is a working public video URL.');
    const title = typeof video.title === 'string' ? video.title.trim() : metadata.title;
    if (!title) throw new Error('Missing title; YouTube metadata did not provide one.');
    if (typeof video.purpose !== 'string' || !video.purpose.trim()) throw new Error('Missing purpose explaining why this video should be watched.');
    if (!['Beginner', 'Intermediate', 'Advanced'].includes(video.difficulty)) throw new Error('Difficulty is not verified; choose Beginner, Intermediate, or Advanced before upload.');

    let roleId: string | null = null;
    let roleName = video.roleName || 'All Members';
    if (video.roleName && !/^all(?: members)?$/i.test(video.roleName)) {
      const role = await findRoleByIdOrName(video.roleName);
      if (!role) throw new Error(`Missing role: '${video.roleName}' does not match a portal role.`);
      roleId = role.id;
      roleName = role.name;
    } else if (video.roleId) {
      const role = await findRoleByIdOrName(video.roleId);
      if (!role) throw new Error(`Missing role: '${video.roleId}' does not match a portal role.`);
      roleId = role.id;
      roleName = role.name;
    }

    const created = await auditedWrite(context, 'TC_AI_BULK_VIDEO_CREATED', title, {
      videoId: youtubeVideoId,
      roleId,
      roleName,
      batchIndex: index + 1,
      sourceUrl: video.youtubeUrl,
    }, (transaction) => transaction.video.create({
      data: {
        title,
        youtubeUrl: video.youtubeUrl,
        youtubeVideoId,
        thumbnailUrl: metadata?.thumbnailUrl || getYouTubeThumbnail(youtubeVideoId),
        purpose: video.purpose.trim(),
        description: typeof video.description === 'string' ? video.description : metadata?.authorName ? `Course by ${metadata.authorName}` : null,
        roleId,
        category: video.category || 'Technical',
        difficulty: video.difficulty || 'Beginner',
        priority: video.priority || 'Normal',
        status: video.status || 'Draft',
        duration: video.duration || '15m',
        createdBy: context.currentUser.profile?.fullName || 'Admin',
      },
      select: { id: true },
    }));
    return created.id;
  });
}

export async function bulkUpdateVideosTool(context: ToolContext, params: { items?: Array<{ identifier: string; updates: Record<string, any> }> }): Promise<ToolResult> {
  requireAdmin(context);
  return runItems(params.items || [], (item) => item.identifier || 'Video', async (item) => {
    if (!item.identifier || !item.updates || typeof item.updates !== 'object') throw new Error('Provide a video identifier and updates.');
    const video = await findVideoByIdOrTitle(item.identifier);
    if (!video) throw new Error('Video not found.');
    const allowed = ['title', 'purpose', 'description', 'category', 'difficulty', 'priority', 'status', 'duration'];
    const data = Object.fromEntries(Object.entries(item.updates).filter(([key]) => allowed.includes(key)));
    if (Object.keys(data).length === 0) throw new Error('No supported video fields were provided.');
    const updated = await auditedWrite(context, 'TC_AI_BULK_VIDEO_UPDATED', video.title, {
      videoId: video.id,
      updates: data,
    }, (transaction) => transaction.video.update({ where: { id: video.id }, data, select: { id: true } }));
    return updated.id;
  });
}

export async function bulkArchiveVideosTool(context: ToolContext, params: { identifiers?: string[] }): Promise<ToolResult> {
  requireAdmin(context);
  return runItems(params.identifiers || [], (identifier) => identifier, async (identifier) => {
    const video = await findVideoByIdOrTitle(identifier);
    if (!video) throw new Error('Video not found.');
    const archived = await auditedWrite(context, 'TC_AI_BULK_VIDEO_ARCHIVED', video.title, { videoId: video.id },
      (transaction) => transaction.video.update({ where: { id: video.id }, data: { status: 'Archived' }, select: { id: true } }));
    return archived.id;
  });
}

export async function bulkPublishVideosTool(context: ToolContext, params: { identifiers?: string[] }): Promise<ToolResult> {
  requireAdmin(context);
  return runItems(params.identifiers || [], (identifier) => identifier, async (identifier) => {
    const video = await findVideoByIdOrTitle(identifier);
    if (!video) throw new Error('Video not found.');
    if (video.status === 'Archived') throw new Error('Archived videos cannot be published by this action.');
    const published = await auditedWrite(context, 'TC_AI_BULK_VIDEO_PUBLISHED', video.title, { videoId: video.id },
      (transaction) => transaction.video.update({ where: { id: video.id }, data: { status: 'Published' }, select: { id: true } }));
    return published.id;
  });
}

export async function bulkAssignRoleTool(context: ToolContext, params: { items?: Array<{ identifier: string; roleName: string }> }): Promise<ToolResult> {
  requireAdmin(context);
  return runItems(params.items || [], (item) => item.identifier || 'Video', async (item) => {
    if (!item.identifier || !item.roleName) throw new Error('Provide a video identifier and target role.');
    const video = await findVideoByIdOrTitle(item.identifier);
    if (!video) throw new Error('Video not found.');
    const role = /^all(?: members)?$/i.test(item.roleName) ? null : await findRoleByIdOrName(item.roleName);
    if (!role && !/^all(?: members)?$/i.test(item.roleName)) throw new Error(`Missing role: '${item.roleName}' does not match a portal role.`);
    const updated = await auditedWrite(context, 'TC_AI_BULK_VIDEO_ROLE_ASSIGNED', video.title, {
      videoId: video.id,
      roleId: role?.id || null,
      roleName: role?.name || 'All Members',
    }, (transaction) => transaction.video.update({ where: { id: video.id }, data: { roleId: role?.id || null }, select: { id: true } }));
    return updated.id;
  });
}

export async function bulkCreateNotificationsTool(context: ToolContext, params: { items?: Array<{ identifier: string; title: string; message: string }> }): Promise<ToolResult> {
  requireAdmin(context);
  return runItems(params.items || [], (item) => item.identifier || 'Member', async (item) => {
    if (!item.identifier || !item.title?.trim() || !item.message?.trim()) throw new Error('Member, notification title, and message are required.');
    const user = await findUserByIdentifier(item.identifier);
    if (!user || user.role !== 'MEMBER' || user.status !== 'APPROVED') throw new Error('Approved member not found.');
    const notification = await auditedWrite(context, 'TC_AI_BULK_NOTIFICATION_SENT', user.profile?.fullName || user.email, {
      userId: user.id,
      title: item.title.trim(),
    }, (transaction) => transaction.notification.create({
      data: { userId: user.id, title: item.title.trim(), message: item.message.trim() },
      select: { id: true },
    }));
    return notification.id;
  });
}

export async function bulkApproveMembersTool(context: ToolContext, params: { identifiers?: string[] }): Promise<ToolResult> {
  requireAdmin(context);
  return runItems(params.identifiers || [], (identifier) => identifier, async (identifier) => {
    const user = await findUserByIdentifier(identifier);
    if (!user || user.role !== 'MEMBER') throw new Error('Member not found.');
    if (user.status !== 'PENDING') throw new Error(`Member is ${user.status.toLowerCase()}, not pending.`);
    await auditedWrite(context, 'TC_AI_BULK_MEMBER_APPROVED', user.profile?.fullName || user.email, {
      userId: user.id,
      memberId: user.profile?.memberId,
      previousStatus: user.status,
    }, async (transaction) => {
      await transaction.user.update({ where: { id: user.id }, data: { status: 'APPROVED' } });
      if (user.profile) await transaction.memberProfile.update({ where: { id: user.profile.id }, data: { status: 'APPROVED' } });
      await transaction.notification.create({
        data: {
          userId: user.id,
          title: 'Account Approved',
          message: 'Your Techveons account has been approved. You can now access your training and portal features.',
        },
      });
    });
    return user.id;
  });
}

export async function prepareBulkMemberApproval(): Promise<{ identifiers: string[]; preview: string }> {
  const users = await db.user.findMany({
    where: { role: 'MEMBER', status: 'PENDING' },
    include: { profile: { select: { fullName: true, memberId: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const preview = users.length
    ? users.map((user, index) => `${index + 1}. ${user.profile?.fullName || user.email} (${user.profile?.memberId || user.email})`).join('\n')
    : 'No pending members were found.';
  return { identifiers: users.map((user) => user.id), preview };
}