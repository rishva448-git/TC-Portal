import { db } from '@/lib/db';
import { extractYouTubeId, getYouTubeThumbnail, fetchYouTubeMetadata } from '@/lib/youtube';
import type { ToolContext, ToolResult, ActionCard } from './types';

// Helper: Require Admin permission
function requireAdmin(context: ToolContext, toolName: string) {
  if (!context.currentUser || context.currentUser.role !== 'ADMIN') {
    throw new Error(`Unauthorized: '${toolName}' requires administrative privileges.`);
  }
}

// Helper: Log audit action
async function createAuditLog(
  context: ToolContext,
  action: string,
  target: string,
  metadata?: Record<string, any>
) {
  try {
    await db.auditLog.create({
      data: {
        userId: context.currentUser.id,
        action,
        target,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error('AuditLog creation failed:', error);
  }
}

// Helper: Find Role by ID or Name
export async function findRoleByIdOrName(identifier: string) {
  if (!identifier || identifier.toUpperCase() === 'ALL') return null;

  // Try exact ID match first
  let role = await db.role.findUnique({ where: { id: identifier } });
  if (role) return role;

  // Try name match (case-insensitive)
  const allRoles = await db.role.findMany();
  const lower = identifier.toLowerCase().trim();
  role = allRoles.find((r) => r.name.toLowerCase() === lower) || null;
  if (role) return role;

  // Try partial match
  role = allRoles.find((r) => r.name.toLowerCase().includes(lower) || lower.includes(r.name.toLowerCase())) || null;
  return role;
}

// Helper: Find User/Member by Identifier (TV-001, email, name, or userId)
export async function findUserByIdentifier(identifier: string) {
  if (!identifier) return null;
  const trimmed = identifier.trim();

  // Try User.id direct lookup
  let user = await db.user.findUnique({
    where: { id: trimmed },
    include: { profile: true },
  });
  if (user) return user;

  // Try email direct lookup
  user = await db.user.findUnique({
    where: { email: trimmed.toLowerCase() },
    include: { profile: true },
  });
  if (user) return user;

  // Try MemberProfile memberId (e.g. TV-001)
  const profileByMemberId = await db.memberProfile.findUnique({
    where: { memberId: trimmed.toUpperCase() },
    include: { user: { include: { profile: true } } },
  });
  if (profileByMemberId?.user) return profileByMemberId.user;

  // Try MemberProfile fullName match
  const allUsers = await db.user.findMany({
    include: { profile: true },
  });

  const lower = trimmed.toLowerCase();
  // Exact name match
  user = allUsers.find((u) => u.profile?.fullName.toLowerCase() === lower) || null;
  if (user) return user;

  // Partial name match (e.g. "Arun" in "Arun Kumar")
  user = allUsers.find((u) => u.profile?.fullName.toLowerCase().includes(lower)) || null;
  return user;
}

// Helper: Find Video by ID or Title
export async function findVideoByIdOrTitle(identifier: string) {
  if (!identifier) return null;
  const trimmed = identifier.trim();

  // Direct ID
  let video = await db.video.findUnique({
    where: { id: trimmed },
    include: { role: true },
  });
  if (video) return video;

  // Title search
  const videos = await db.video.findMany({
    include: { role: true },
  });

  const lower = trimmed.toLowerCase();
  video = videos.find((v) => v.title.toLowerCase() === lower) || null;
  if (video) return video;

  video = videos.find((v) => v.title.toLowerCase().includes(lower)) || null;
  return video;
}

// ==========================================
// 1. VIDEO TOOLS
// ==========================================

export async function addVideoTool(
  context: ToolContext,
  params: {
    youtubeUrl: string;
    roleId?: string | null;
    roleName?: string | null;
    title?: string;
    description?: string;
    purpose?: string;
    category?: string;
    difficulty?: string;
    priority?: string;
    duration?: string;
    status?: string;
  }
): Promise<ToolResult> {
  requireAdmin(context, 'add_video');

  const { youtubeUrl } = params;
  if (!youtubeUrl) {
    return { success: false, message: 'YouTube URL is required to add a video.' };
  }

  const youtubeVideoId = extractYouTubeId(youtubeUrl);
  if (!youtubeVideoId) {
    return { success: false, message: 'Invalid YouTube URL. Please provide a valid YouTube watch link.' };
  }

  // Fetch real YouTube metadata (title, author, thumbnail)
  const meta = await fetchYouTubeMetadata(youtubeUrl);
  const finalTitle = params.title || meta?.title || `Training Video (${youtubeVideoId})`;
  const finalThumbnail = meta?.thumbnailUrl || getYouTubeThumbnail(youtubeVideoId);

  // Resolve Role
  let targetRoleId: string | null = null;
  let targetRoleName = 'All Members';

  if (params.roleId && params.roleId !== 'ALL') {
    const role = await findRoleByIdOrName(params.roleId);
    if (role) {
      targetRoleId = role.id;
      targetRoleName = role.name;
    }
  } else if (params.roleName && params.roleName.toUpperCase() !== 'ALL') {
    const role = await findRoleByIdOrName(params.roleName);
    if (role) {
      targetRoleId = role.id;
      targetRoleName = role.name;
    }
  }

  const finalPurpose =
    params.purpose ||
    (targetRoleId
      ? `Mandatory training course for ${targetRoleName} role development.`
      : 'Core professional skill training for all company members.');

  const createdVideo = await db.video.create({
    data: {
      title: finalTitle,
      youtubeUrl,
      youtubeVideoId,
      thumbnailUrl: finalThumbnail,
      purpose: finalPurpose,
      description: params.description || (meta?.authorName ? `Course by ${meta.authorName}` : ''),
      roleId: targetRoleId,
      category: params.category || 'Technical',
      difficulty: params.difficulty || 'Intermediate',
      priority: params.priority || 'Normal',
      status: params.status || 'Published',
      duration: params.duration || '15m',
      createdBy: context.currentUser.profile?.fullName || 'Admin',
    },
    include: { role: true },
  });

  await createAuditLog(context, 'TC_AI_VIDEO_CREATED', createdVideo.title, {
    videoId: createdVideo.id,
    youtubeUrl,
    roleId: targetRoleId,
    roleName: targetRoleName,
  });

  const card: ActionCard = {
    type: 'video_preview',
    title: createdVideo.title,
    data: {
      id: createdVideo.id,
      title: createdVideo.title,
      thumbnailUrl: createdVideo.thumbnailUrl,
      youtubeUrl: createdVideo.youtubeUrl,
      roleName: targetRoleName,
      status: createdVideo.status,
      priority: createdVideo.priority,
      duration: createdVideo.duration,
      purpose: createdVideo.purpose,
    },
  };

  return {
    success: true,
    data: createdVideo,
    message: `✅ Video added successfully to **${targetRoleName}** training.\n\n**Title**: ${createdVideo.title}\n**Status**: ${createdVideo.status}\n**Priority**: ${createdVideo.priority}`,
    card,
    auditAction: 'TC_AI_VIDEO_CREATED',
  };
}

export async function editVideoTool(
  context: ToolContext,
  params: {
    videoId?: string;
    videoTitle?: string;
    title?: string;
    youtubeUrl?: string;
    purpose?: string;
    description?: string;
    roleId?: string | null;
    roleName?: string | null;
    category?: string;
    difficulty?: string;
    priority?: string;
    status?: string;
    duration?: string;
  }
): Promise<ToolResult> {
  requireAdmin(context, 'edit_video');

  const video = await findVideoByIdOrTitle(params.videoId || params.videoTitle || '');
  if (!video) {
    return { success: false, message: `Video not found with identifier '${params.videoId || params.videoTitle}'.` };
  }

  const updateData: any = {};
  if (params.title !== undefined) updateData.title = params.title;
  if (params.purpose !== undefined) updateData.purpose = params.purpose;
  if (params.description !== undefined) updateData.description = params.description;
  if (params.category !== undefined) updateData.category = params.category;
  if (params.difficulty !== undefined) updateData.difficulty = params.difficulty;
  if (params.priority !== undefined) updateData.priority = params.priority;
  if (params.status !== undefined) updateData.status = params.status;
  if (params.duration !== undefined) updateData.duration = params.duration;

  if (params.youtubeUrl) {
    const vidId = extractYouTubeId(params.youtubeUrl);
    if (vidId) {
      updateData.youtubeUrl = params.youtubeUrl;
      updateData.youtubeVideoId = vidId;
      updateData.thumbnailUrl = getYouTubeThumbnail(vidId);
    }
  }

  if (params.roleId !== undefined || params.roleName !== undefined) {
    const role = await findRoleByIdOrName((params.roleId || params.roleName || '') as string);
    updateData.roleId = role ? role.id : null;
  }

  const updatedVideo = await db.video.update({
    where: { id: video.id },
    data: updateData,
    include: { role: true },
  });

  await createAuditLog(context, 'TC_AI_VIDEO_UPDATED', updatedVideo.title, {
    videoId: updatedVideo.id,
    updates: updateData,
  });

  return {
    success: true,
    data: updatedVideo,
    message: `✅ Video '${updatedVideo.title}' updated successfully.`,
    auditAction: 'TC_AI_VIDEO_UPDATED',
  };
}

export async function archiveVideoTool(
  context: ToolContext,
  params: { videoId?: string; videoTitle?: string }
): Promise<ToolResult> {
  requireAdmin(context, 'archive_video');

  const video = await findVideoByIdOrTitle(params.videoId || params.videoTitle || '');
  if (!video) {
    return { success: false, message: `Video not found with identifier '${params.videoId || params.videoTitle}'.` };
  }

  const archived = await db.video.update({
    where: { id: video.id },
    data: { status: 'Archived' },
  });

  await createAuditLog(context, 'TC_AI_VIDEO_ARCHIVED', archived.title, {
    videoId: archived.id,
  });

  return {
    success: true,
    data: archived,
    message: `📦 Video '${archived.title}' has been archived.`,
    auditAction: 'TC_AI_VIDEO_ARCHIVED',
  };
}

export async function publishVideoTool(
  context: ToolContext,
  params: { videoId?: string; videoTitle?: string }
): Promise<ToolResult> {
  requireAdmin(context, 'publish_video');

  let video = await findVideoByIdOrTitle(params.videoId || params.videoTitle || '');
  if (!video) {
    // If no video was specified, check for latest draft
    video = await db.video.findFirst({
      where: { status: 'Draft' },
      orderBy: { createdAt: 'desc' },
      include: { role: true },
    });
  }

  if (!video) {
    return { success: false, message: 'No draft video found to publish.' };
  }

  const published = await db.video.update({
    where: { id: video.id },
    data: { status: 'Published' },
    include: { role: true },
  });

  await createAuditLog(context, 'TC_AI_VIDEO_PUBLISHED', published.title, {
    videoId: published.id,
  });

  return {
    success: true,
    data: published,
    message: `🚀 Video '${published.title}' is now published and active.`,
    auditAction: 'TC_AI_VIDEO_PUBLISHED',
  };
}

export async function getVideoTool(
  context: ToolContext,
  params: { videoId?: string; videoTitle?: string }
): Promise<ToolResult> {
  const video = await findVideoByIdOrTitle(params.videoId || params.videoTitle || '');
  if (!video) {
    return { success: false, message: `Video not found for '${params.videoId || params.videoTitle}'.` };
  }

  const [watchStats, totalWatches] = await Promise.all([
    db.watchHistory.groupBy({
      by: ['completed'],
      where: { videoId: video.id },
      _count: { id: true },
    }),
    db.watchHistory.count({ where: { videoId: video.id } }),
  ]);

  const completed = watchStats.find((w) => w.completed)?._count.id || 0;

  const card: ActionCard = {
    type: 'video_preview',
    title: video.title,
    data: {
      ...video,
      roleName: video.role ? video.role.name : 'All Members',
      totalWatches,
      completed,
    },
  };

  return {
    success: true,
    data: video,
    message: `Found video **${video.title}** (${video.status}, Assigned to: ${video.role ? video.role.name : 'All Members'}).`,
    card,
  };
}

export async function listVideosTool(
  context: ToolContext,
  params: {
    roleId?: string;
    roleName?: string;
    category?: string;
    difficulty?: string;
    priority?: string;
    status?: string;
    search?: string;
    limit?: number;
  }
): Promise<ToolResult> {
  const whereClause: any = {};

  if (params.status && params.status !== 'ALL') {
    whereClause.status = params.status;
  } else if (!params.status) {
    // Default to published unless admin asks otherwise
    whereClause.status = 'Published';
  }

  if (params.roleId || params.roleName) {
    const role = await findRoleByIdOrName(params.roleId || params.roleName || '');
    if (role) {
      whereClause.roleId = role.id;
    }
  }

  if (params.category && params.category !== 'ALL') whereClause.category = params.category;
  if (params.difficulty && params.difficulty !== 'ALL') whereClause.difficulty = params.difficulty;
  if (params.priority && params.priority !== 'ALL') whereClause.priority = params.priority;

  if (params.search) {
    whereClause.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { purpose: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const limit = Math.min(25, Math.max(1, params.limit || 10));

  const videos = await db.video.findMany({
    where: whereClause,
    include: { role: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const formatted = videos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    youtubeUrl: v.youtubeUrl,
    roleName: v.role ? v.role.name : 'All Members',
    category: v.category,
    priority: v.priority,
    difficulty: v.difficulty,
    status: v.status,
    duration: v.duration,
  }));

  const card: ActionCard = {
    type: 'video_list',
    title: `Videos (${videos.length})`,
    data: formatted,
  };

  const videoTitles = formatted.map((v, i) => `${i + 1}. **${v.title}** (${v.roleName} • ${v.priority})`).join('\n');

  return {
    success: true,
    data: formatted,
    message: formatted.length > 0
      ? `Found **${formatted.length}** video(s):\n\n${videoTitles}`
      : 'No videos found matching the criteria.',
    card,
  };
}

export async function assignVideoToRoleTool(
  context: ToolContext,
  params: { videoId?: string; videoTitle?: string; roleId?: string; roleName?: string }
): Promise<ToolResult> {
  requireAdmin(context, 'assign_video_to_role');

  const video = await findVideoByIdOrTitle(params.videoId || params.videoTitle || '');
  if (!video) {
    return { success: false, message: `Video not found for '${params.videoId || params.videoTitle}'.` };
  }

  let roleId: string | null = null;
  let targetName = 'All Members';

  if (params.roleId || params.roleName) {
    const role = await findRoleByIdOrName(params.roleId || params.roleName || '');
    if (role) {
      roleId = role.id;
      targetName = role.name;
    }
  }

  const updated = await db.video.update({
    where: { id: video.id },
    data: { roleId },
    include: { role: true },
  });

  await createAuditLog(context, 'TC_AI_VIDEO_UPDATED', updated.title, {
    action: 'ASSIGN_ROLE',
    newRoleId: roleId,
    newRoleName: targetName,
  });

  return {
    success: true,
    data: updated,
    message: `✅ Video '${updated.title}' has been assigned to **${targetName}**.`,
    auditAction: 'TC_AI_VIDEO_UPDATED',
  };
}

// ==========================================
// 2. MEMBER TOOLS
// ==========================================

export async function listMembersTool(
  context: ToolContext,
  params: {
    status?: string;
    roleId?: string;
    roleName?: string;
    search?: string;
    limit?: number;
  }
): Promise<ToolResult> {
  requireAdmin(context, 'list_members');

  const whereClause: any = { role: 'MEMBER' };

  if (params.status && params.status !== 'ALL') {
    whereClause.status = params.status;
  }

  if (params.roleId || params.roleName) {
    const role = await findRoleByIdOrName(params.roleId || params.roleName || '');
    if (role) {
      whereClause.profile = { roleId: role.id };
    }
  }

  if (params.search) {
    whereClause.OR = [
      { email: { contains: params.search, mode: 'insensitive' } },
      { profile: { fullName: { contains: params.search, mode: 'insensitive' } } },
      { profile: { memberId: { contains: params.search, mode: 'insensitive' } } },
      { profile: { position: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const limit = Math.min(50, Math.max(1, params.limit || 20));

  const [members, roles] = await Promise.all([
    db.user.findMany({
      where: whereClause,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    db.role.findMany({ select: { id: true, name: true } }),
  ]);

  const roleMap = new Map(roles.map((r) => [r.id, r.name]));

  const formatted = members.map((m) => ({
    id: m.id,
    email: m.email,
    status: m.status,
    memberId: m.profile?.memberId || 'N/A',
    fullName: m.profile?.fullName || 'Member',
    position: m.profile?.position || 'Unassigned',
    roleName: m.profile?.roleId ? roleMap.get(m.profile.roleId) || 'Member' : 'Unassigned',
    profilePhoto: m.profile?.profilePhoto || null,
    joiningDate: m.profile?.joiningDate || m.createdAt,
  }));

  const card: ActionCard = {
    type: 'member_list',
    title: `Members (${formatted.length})`,
    data: formatted,
  };

  const memberLines = formatted
    .map((m, i) => `${i + 1}. **${m.fullName}** (${m.memberId}) — ${m.roleName} • Status: \`${m.status}\``)
    .join('\n');

  return {
    success: true,
    data: formatted,
    message: formatted.length > 0
      ? `Found **${formatted.length}** member(s):\n\n${memberLines}`
      : 'No members found matching the specified filters.',
    card,
  };
}

export async function getMemberTool(
  context: ToolContext,
  params: { identifier: string }
): Promise<ToolResult> {
  const isSelf =
    context.currentUser.id === params.identifier ||
    context.currentUser.email === params.identifier?.toLowerCase() ||
    context.currentUser.profile?.memberId === params.identifier?.toUpperCase();

  if (context.currentUser.role !== 'ADMIN' && !isSelf) {
    throw new Error('Forbidden: You can only view your own member profile.');
  }

  const user = await findUserByIdentifier(params.identifier);
  if (!user) {
    return { success: false, message: `Member not found for '${params.identifier}'.` };
  }

  let roleName = 'Unassigned';
  if (user.profile?.roleId) {
    const role = await db.role.findUnique({ where: { id: user.profile.roleId } });
    if (role) roleName = role.name;
  }

  const [watchStats, totalWatched] = await Promise.all([
    db.watchHistory.groupBy({
      by: ['completed'],
      where: { userId: user.id },
      _count: { id: true },
    }),
    db.watchHistory.count({ where: { userId: user.id } }),
  ]);

  const completed = watchStats.find((w) => w.completed)?._count.id || 0;

  const memberData = {
    id: user.id,
    email: user.email,
    status: user.status,
    memberId: user.profile?.memberId || 'N/A',
    fullName: user.profile?.fullName || 'Member',
    position: user.profile?.position || 'Unassigned',
    phone: user.profile?.phone,
    roleName,
    company: user.profile?.company,
    joiningDate: user.profile?.joiningDate,
    stats: {
      totalWatched,
      completed,
      completionRate: totalWatched > 0 ? Math.round((completed / totalWatched) * 100) : 0,
    },
  };

  const card: ActionCard = {
    type: 'member_card',
    title: memberData.fullName,
    data: memberData,
  };

  return {
    success: true,
    data: memberData,
    message: `**${memberData.fullName}** (${memberData.memberId})\n- **Role**: ${roleName}\n- **Status**: ${user.status}\n- **Email**: ${user.email}\n- **Completed Trainings**: ${completed}/${totalWatched}`,
    card,
  };
}

export async function approveMemberTool(
  context: ToolContext,
  params: { identifier: string }
): Promise<ToolResult> {
  requireAdmin(context, 'approve_member');

  const user = await findUserByIdentifier(params.identifier);
  if (!user) {
    return { success: false, message: `Member not found for '${params.identifier}'.` };
  }

  if (user.status === 'APPROVED') {
    return { success: true, message: `Member **${user.profile?.fullName || user.email}** is already approved.` };
  }

  await db.user.update({
    where: { id: user.id },
    data: { status: 'APPROVED' },
  });

  if (user.profile) {
    await db.memberProfile.update({
      where: { id: user.profile.id },
      data: { status: 'APPROVED' },
    });
  }

  // Create real Notification
  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Account Approved! 🎉',
      message:
        'Your Techveons digital identity account has been approved by the admin. You now have full access to your personalized role dashboard and training videos!',
    },
  });

  const targetName = `${user.profile?.memberId || user.email} (${user.profile?.fullName || 'Member'})`;
  await createAuditLog(context, 'TC_AI_MEMBER_APPROVED', targetName, {
    userId: user.id,
    previousStatus: user.status,
  });

  return {
    success: true,
    data: { id: user.id, status: 'APPROVED' },
    message: `✅ Member **${user.profile?.fullName || user.email}** (${user.profile?.memberId || 'ID'}) has been approved successfully. Welcome notification sent.`,
    auditAction: 'TC_AI_MEMBER_APPROVED',
  };
}

export async function suspendMemberTool(
  context: ToolContext,
  params: { identifier: string }
): Promise<ToolResult> {
  requireAdmin(context, 'suspend_member');

  const user = await findUserByIdentifier(params.identifier);
  if (!user) {
    return { success: false, message: `Member not found for '${params.identifier}'.` };
  }

  await db.user.update({
    where: { id: user.id },
    data: { status: 'SUSPENDED' },
  });

  if (user.profile) {
    await db.memberProfile.update({
      where: { id: user.profile.id },
      data: { status: 'SUSPENDED' },
    });
  }

  const targetName = `${user.profile?.memberId || user.email} (${user.profile?.fullName || 'Member'})`;
  await createAuditLog(context, 'TC_AI_MEMBER_SUSPENDED', targetName, {
    userId: user.id,
    previousStatus: user.status,
  });

  return {
    success: true,
    data: { id: user.id, status: 'SUSPENDED' },
    message: `⚠️ Member **${user.profile?.fullName || user.email}** (${user.profile?.memberId || 'ID'}) has been suspended.`,
    auditAction: 'TC_AI_MEMBER_SUSPENDED',
  };
}

export async function rejectMemberTool(
  context: ToolContext,
  params: { identifier: string }
): Promise<ToolResult> {
  requireAdmin(context, 'reject_member');

  const user = await findUserByIdentifier(params.identifier);
  if (!user) {
    return { success: false, message: `Member not found for '${params.identifier}'.` };
  }

  await db.user.update({
    where: { id: user.id },
    data: { status: 'REJECTED' },
  });

  if (user.profile) {
    await db.memberProfile.update({
      where: { id: user.profile.id },
      data: { status: 'REJECTED' },
    });
  }

  const targetName = `${user.profile?.memberId || user.email} (${user.profile?.fullName || 'Member'})`;
  await createAuditLog(context, 'TC_AI_MEMBER_REJECTED', targetName, {
    userId: user.id,
    previousStatus: user.status,
  });

  return {
    success: true,
    data: { id: user.id, status: 'REJECTED' },
    message: `❌ Member registration for **${user.profile?.fullName || user.email}** has been rejected.`,
    auditAction: 'TC_AI_MEMBER_REJECTED',
  };
}

export async function updateMemberRoleTool(
  context: ToolContext,
  params: { identifier: string; roleId?: string; roleName?: string }
): Promise<ToolResult> {
  requireAdmin(context, 'update_member_role');

  const user = await findUserByIdentifier(params.identifier);
  if (!user || !user.profile) {
    return { success: false, message: `Member not found for '${params.identifier}'.` };
  }

  const role = await findRoleByIdOrName(params.roleId || params.roleName || '');
  if (!role) {
    return { success: false, message: `Role not found for '${params.roleId || params.roleName}'.` };
  }

  const updatedProfile = await db.memberProfile.update({
    where: { id: user.profile.id },
    data: {
      roleId: role.id,
      position: role.name,
    },
  });

  const targetName = `${user.profile.memberId} (${user.profile.fullName})`;
  await createAuditLog(context, 'TC_AI_MEMBER_ROLE_CHANGED', targetName, {
    userId: user.id,
    newRoleId: role.id,
    newRoleName: role.name,
  });

  return {
    success: true,
    data: updatedProfile,
    message: `✅ Role for **${user.profile.fullName}** changed to **${role.name}**.`,
    auditAction: 'TC_AI_MEMBER_ROLE_CHANGED',
  };
}

export async function updateMemberProfileTool(
  context: ToolContext,
  params: {
    identifier: string;
    fullName?: string;
    phone?: string;
    bio?: string;
    position?: string;
    skills?: string[] | string;
  }
): Promise<ToolResult> {
  requireAdmin(context, 'update_member_profile');

  const user = await findUserByIdentifier(params.identifier);
  if (!user || !user.profile) {
    return { success: false, message: `Member not found for '${params.identifier}'.` };
  }

  const profileData: any = {};
  if (params.fullName !== undefined) profileData.fullName = params.fullName;
  if (params.phone !== undefined) profileData.phone = params.phone;
  if (params.bio !== undefined) profileData.bio = params.bio;
  if (params.position !== undefined) profileData.position = params.position;
  if (params.skills !== undefined) {
    profileData.skills = typeof params.skills === 'string' ? params.skills : JSON.stringify(params.skills);
  }

  const updated = await db.memberProfile.update({
    where: { id: user.profile.id },
    data: profileData,
  });

  await createAuditLog(context, 'TC_AI_MEMBER_UPDATED', `${updated.memberId} (${updated.fullName})`, profileData);

  return {
    success: true,
    data: updated,
    message: `✅ Profile for **${updated.fullName}** updated successfully.`,
    auditAction: 'TC_AI_MEMBER_UPDATED',
  };
}

// ==========================================
// 3. WATCH HISTORY & TRAINING COMPLETION
// ==========================================

export async function getMemberWatchHistoryTool(
  context: ToolContext,
  params: { identifier: string }
): Promise<ToolResult> {
  const isSelf =
    context.currentUser.id === params.identifier ||
    context.currentUser.email === params.identifier?.toLowerCase() ||
    context.currentUser.profile?.memberId === params.identifier?.toUpperCase();

  if (context.currentUser.role !== 'ADMIN' && !isSelf) {
    throw new Error('Forbidden: You can only view your own watch history.');
  }

  const user = await findUserByIdentifier(params.identifier);
  if (!user) {
    return { success: false, message: `Member not found for '${params.identifier}'.` };
  }

  const history = await db.watchHistory.findMany({
    where: { userId: user.id },
    include: {
      video: {
        include: { role: { select: { name: true } } },
      },
    },
    orderBy: { lastWatchedAt: 'desc' },
    take: 20,
  });

  const formatted = history.map((h) => ({
    id: h.id,
    videoTitle: h.video.title,
    thumbnailUrl: h.video.thumbnailUrl,
    progressPercentage: h.progressPercentage,
    completed: h.completed,
    roleName: h.video.role ? h.video.role.name : 'All Members',
    lastWatchedAt: h.lastWatchedAt,
  }));

  const card: ActionCard = {
    type: 'training_completion',
    title: `Watch History: ${user.profile?.fullName || user.email}`,
    data: {
      member: user.profile?.fullName,
      history: formatted,
      totalCount: formatted.length,
      completedCount: formatted.filter((f) => f.completed).length,
    },
  };

  const lines = formatted
    .map((h, i) => `${i + 1}. **${h.videoTitle}** — ${h.progressPercentage}% ${h.completed ? '✅ Completed' : '⏳ In Progress'}`)
    .join('\n');

  return {
    success: true,
    data: formatted,
    message: formatted.length > 0
      ? `Training history for **${user.profile?.fullName || user.email}**:\n\n${lines}`
      : `No watch history recorded yet for **${user.profile?.fullName || user.email}**.`,
    card,
  };
}

export async function getTrainingCompletionTool(
  context: ToolContext,
  params: { roleId?: string; roleName?: string; requiredOnly?: boolean }
): Promise<ToolResult> {
  requireAdmin(context, 'get_training_completion');

  let targetRole = null;
  if (params.roleId || params.roleName) {
    targetRole = await findRoleByIdOrName(params.roleId || params.roleName || '');
  }

  const videoWhere: any = { status: 'Published' };
  if (targetRole) {
    videoWhere.OR = [{ roleId: targetRole.id }, { roleId: null }];
  }
  if (params.requiredOnly) {
    videoWhere.priority = 'Required';
  }

  const requiredVideos = await db.video.findMany({
    where: videoWhere,
    select: { id: true, title: true, priority: true, roleId: true },
  });

  const memberWhere: any = { role: 'MEMBER', status: 'APPROVED' };
  if (targetRole) {
    memberWhere.profile = { roleId: targetRole.id };
  }

  const members = await db.user.findMany({
    where: memberWhere,
    include: {
      profile: true,
      watchHistory: {
        where: { completed: true },
      },
    },
  });

  const videoIdSet = new Set(requiredVideos.map((v) => v.id));
  const totalRequired = requiredVideos.length;

  const incompleteMembers: any[] = [];
  const completedMembers: any[] = [];

  for (const member of members) {
    const completedRequiredCount = member.watchHistory.filter((h) => videoIdSet.has(h.videoId)).length;
    const isComplete = totalRequired > 0 && completedRequiredCount >= totalRequired;

    const record = {
      id: member.id,
      name: member.profile?.fullName || member.email,
      memberId: member.profile?.memberId || 'N/A',
      completedCount: completedRequiredCount,
      totalRequired,
      percentage: totalRequired > 0 ? Math.round((completedRequiredCount / totalRequired) * 100) : 100,
    };

    if (isComplete) {
      completedMembers.push(record);
    } else {
      incompleteMembers.push(record);
    }
  }

  const card: ActionCard = {
    type: 'training_completion',
    title: targetRole ? `${targetRole.name} Training Progress` : 'Overall Training Completion',
    data: {
      totalRequiredVideos: totalRequired,
      totalApprovedMembers: members.length,
      incompleteCount: incompleteMembers.length,
      completedCount: completedMembers.length,
      incompleteMembers,
      completedMembers,
    },
  };

  let message = `📊 **Training Completion Report**\n- Target: **${targetRole ? targetRole.name : 'All Roles'}**\n- Total Required Videos: **${totalRequired}**\n- Approved Members: **${members.length}**\n- Fully Completed: **${completedMembers.length}**\n- Incomplete: **${incompleteMembers.length}**`;

  if (incompleteMembers.length > 0) {
    message += `\n\n**Members with pending required training:**\n` +
      incompleteMembers
        .slice(0, 10)
        .map((m) => `• **${m.name}** (${m.memberId}) — ${m.completedCount}/${m.totalRequired} completed (${m.percentage}%)`)
        .join('\n');
    if (incompleteMembers.length > 10) {
      message += `\n*...and ${incompleteMembers.length - 10} more members.*`;
    }
  } else {
    message += `\n\n🎉 All approved members have completed required training!`;
  }

  return {
    success: true,
    data: { incompleteMembers, completedMembers, totalRequired },
    message,
    card,
  };
}

// ==========================================
// 4. NOTIFICATION TOOLS
// ==========================================

export async function sendNotificationTool(
  context: ToolContext,
  params: { identifier: string; title: string; message: string }
): Promise<ToolResult> {
  requireAdmin(context, 'send_notification');

  const { title, message } = params;
  if (!title || !message) {
    return { success: false, message: 'Notification title and message are required.' };
  }

  const user = await findUserByIdentifier(params.identifier);
  if (!user) {
    return { success: false, message: `Member not found for '${params.identifier}'.` };
  }

  const notification = await db.notification.create({
    data: {
      userId: user.id,
      title,
      message,
    },
  });

  const targetName = `${user.profile?.memberId || user.email} (${user.profile?.fullName || 'Member'})`;
  await createAuditLog(context, 'TC_AI_NOTIFICATION_SENT', targetName, {
    notificationId: notification.id,
    title,
    userId: user.id,
  });

  return {
    success: true,
    data: notification,
    message: `📨 Notification sent to **${user.profile?.fullName || user.email}**.\n\n**Title**: ${title}\n**Message**: ${message}`,
    auditAction: 'TC_AI_NOTIFICATION_SENT',
  };
}

export async function notifyRoleMembersTool(
  context: ToolContext,
  params: { roleId?: string; roleName?: string; title: string; message: string }
): Promise<ToolResult> {
  requireAdmin(context, 'notify_role_members');

  const { title, message } = params;
  if (!title || !message) {
    return { success: false, message: 'Notification title and message are required.' };
  }

  let targetRole = null;
  const roleInput = params.roleId || params.roleName || '';
  if (roleInput && roleInput.toUpperCase() !== 'ALL') {
    targetRole = await findRoleByIdOrName(roleInput);
  }

  const memberWhere: any = { role: 'MEMBER', status: 'APPROVED' };
  if (targetRole) {
    memberWhere.profile = { roleId: targetRole.id };
  }

  const members = await db.user.findMany({
    where: memberWhere,
    select: { id: true, email: true },
  });

  if (members.length === 0) {
    return { success: false, message: `No approved members found in role '${targetRole?.name || 'All'}'.` };
  }

  // Create notifications in batch
  await db.notification.createMany({
    data: members.map((m) => ({
      userId: m.id,
      title,
      message,
    })),
  });

  const targetDescription = targetRole ? `Role: ${targetRole.name}` : 'All Approved Members';
  await createAuditLog(context, 'TC_AI_NOTIFICATION_SENT', targetDescription, {
    recipientCount: members.length,
    roleId: targetRole?.id || 'ALL',
    title,
  });

  return {
    success: true,
    data: { recipientCount: members.length },
    message: `📣 Notification successfully delivered to **${members.length}** member(s) of **${targetRole ? targetRole.name : 'All Members'}**.\n\n**Title**: ${title}`,
    auditAction: 'TC_AI_NOTIFICATION_SENT',
  };
}

// ==========================================
// 5. SYSTEM SETTINGS TOOLS
// ==========================================

export async function getSystemSettingsTool(
  context: ToolContext,
  params?: { key?: string }
): Promise<ToolResult> {
  requireAdmin(context, 'get_system_settings');

  if (params?.key) {
    const setting = await db.systemSetting.findUnique({ where: { key: params.key } });
    return {
      success: true,
      data: setting,
      message: setting
        ? `Setting **${params.key}**: \`${setting.value}\``
        : `Setting **${params.key}** not found.`,
    };
  }

  const settingsList = await db.systemSetting.findMany({ orderBy: { key: 'asc' } });
  const settingsObject: Record<string, string> = {};
  settingsList.forEach((s) => {
    // Mask sensitive keys like secrets/keys if any
    const isSensitive = s.key.toLowerCase().includes('key') || s.key.toLowerCase().includes('secret');
    settingsObject[s.key] = isSensitive ? `${s.value.substring(0, 4)}...***` : s.value;
  });

  const card: ActionCard = {
    type: 'settings_view',
    title: 'Platform Settings',
    data: settingsObject,
  };

  const lines = Object.entries(settingsObject)
    .map(([k, v]) => `• **${k}**: \`${v}\``)
    .join('\n');

  return {
    success: true,
    data: settingsObject,
    message: settingsList.length > 0 ? `⚙️ **Current System Settings:**\n\n${lines}` : 'No custom system settings found.',
    card,
  };
}

export async function updateSystemSettingTool(
  context: ToolContext,
  params: { key: string; value: string }
): Promise<ToolResult> {
  requireAdmin(context, 'update_system_setting');

  const { key, value } = params;
  if (!key || value === undefined) {
    return { success: false, message: 'Setting key and value are required.' };
  }

  const updated = await db.systemSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });

  await createAuditLog(context, 'TC_AI_SETTING_UPDATED', `Setting: ${key}`, {
    key,
    value: String(value),
  });

  return {
    success: true,
    data: updated,
    message: `⚙️ System setting **${key}** has been updated to \`${value}\`.`,
    auditAction: 'TC_AI_SETTING_UPDATED',
  };
}

// ==========================================
// 6. ANALYTICS TOOLS
// ==========================================

export async function getMemberStatisticsTool(context: ToolContext): Promise<ToolResult> {
  requireAdmin(context, 'get_member_statistics');

  const [statusCounts, roles, membersByRole] = await Promise.all([
    db.user.groupBy({
      by: ['status'],
      where: { role: 'MEMBER' },
      _count: { id: true },
    }),
    db.role.findMany({ select: { id: true, name: true } }),
    db.memberProfile.groupBy({
      by: ['roleId'],
      _count: { id: true },
    }),
  ]);

  const totalMembers = statusCounts.reduce((acc, c) => acc + c._count.id, 0);
  const approved = statusCounts.find((s) => s.status === 'APPROVED')?._count.id || 0;
  const pending = statusCounts.find((s) => s.status === 'PENDING')?._count.id || 0;
  const suspended = statusCounts.find((s) => s.status === 'SUSPENDED')?._count.id || 0;
  const rejected = statusCounts.find((s) => s.status === 'REJECTED')?._count.id || 0;

  const roleMap = new Map(roles.map((r) => [r.id, r.name]));
  const roleBreakdown = membersByRole.map((mbr) => ({
    roleName: mbr.roleId ? roleMap.get(mbr.roleId) || 'Unknown' : 'Unassigned',
    count: mbr._count.id,
  }));

  const card: ActionCard = {
    type: 'stats_widget',
    title: 'Member Statistics',
    data: {
      total: totalMembers,
      approved,
      pending,
      suspended,
      rejected,
      byRole: roleBreakdown,
    },
  };

  const roleLines = roleBreakdown.map((r) => `  - ${r.roleName}: **${r.count}**`).join('\n');

  return {
    success: true,
    data: { totalMembers, approved, pending, suspended, rejected, roleBreakdown },
    message: `👥 **Member Overview**\n- Total Members: **${totalMembers}**\n- Approved / Active: **${approved}**\n- Pending Approval: **${pending}**\n- Suspended: **${suspended}**\n- Rejected: **${rejected}**\n\n**Breakdown by Role:**\n${roleLines}`,
    card,
  };
}

export async function getVideoStatisticsTool(context: ToolContext): Promise<ToolResult> {
  requireAdmin(context, 'get_video_statistics');

  const [statusCounts, priorityCounts, categoryCounts, roles, videosByRole] = await Promise.all([
    db.video.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    db.video.groupBy({
      by: ['priority'],
      _count: { id: true },
    }),
    db.video.groupBy({
      by: ['category'],
      _count: { id: true },
    }),
    db.role.findMany({ select: { id: true, name: true } }),
    db.video.groupBy({
      by: ['roleId'],
      _count: { id: true },
    }),
  ]);

  const totalVideos = statusCounts.reduce((acc, c) => acc + c._count.id, 0);
  const published = statusCounts.find((s) => s.status === 'Published')?._count.id || 0;
  const draft = statusCounts.find((s) => s.status === 'Draft')?._count.id || 0;
  const archived = statusCounts.find((s) => s.status === 'Archived')?._count.id || 0;

  const roleMap = new Map(roles.map((r) => [r.id, r.name]));
  const roleBreakdown = videosByRole.map((vbr) => ({
    roleName: vbr.roleId ? roleMap.get(vbr.roleId) || 'Unknown' : 'All Members',
    count: vbr._count.id,
  }));

  const card: ActionCard = {
    type: 'stats_widget',
    title: 'Video Library Statistics',
    data: {
      total: totalVideos,
      published,
      draft,
      archived,
      byPriority: priorityCounts.map((p) => ({ priority: p.priority, count: p._count.id })),
      byCategory: categoryCounts.map((c) => ({ category: c.category, count: c._count.id })),
      byRole: roleBreakdown,
    },
  };

  return {
    success: true,
    data: { totalVideos, published, draft, archived, priorityCounts, categoryCounts, roleBreakdown },
    message: `📹 **Video Library Overview**\n- Total Videos: **${totalVideos}**\n- Published: **${published}**\n- Drafts: **${draft}**\n- Archived: **${archived}**\n\n**By Priority:**\n${priorityCounts.map((p) => `  - ${p.priority}: **${p._count.id}**`).join('\n')}`,
    card,
  };
}

export async function getPendingMembersTool(context: ToolContext): Promise<ToolResult> {
  requireAdmin(context, 'get_pending_members');

  const pendingUsers = await db.user.findMany({
    where: { role: 'MEMBER', status: 'PENDING' },
    include: { profile: true },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = pendingUsers.map((u) => ({
    id: u.id,
    email: u.email,
    memberId: u.profile?.memberId || 'N/A',
    fullName: u.profile?.fullName || 'Pending Member',
    position: u.profile?.position || 'Unassigned',
    joiningDate: u.profile?.joiningDate || u.createdAt,
    status: u.status,
  }));

  const card: ActionCard = {
    type: 'member_list',
    title: `Pending Approvals (${formatted.length})`,
    data: formatted,
  };

  const lines = formatted
    .map((m, i) => `${i + 1}. **${m.fullName}** (${m.email}) — Position: ${m.position}`)
    .join('\n');

  return {
    success: true,
    data: formatted,
    message: formatted.length > 0
      ? `⏳ **Pending Member Approvals (${formatted.length}):**\n\n${lines}\n\n*Say "Approve [Name]" to approve any member.*`
      : '✅ No pending member registrations awaiting approval.',
    card,
  };
}
