import type { ToolName, ToolContext, ToolResult } from './types';
import {
  addVideoTool,
  editVideoTool,
  archiveVideoTool,
  publishVideoTool,
  getVideoTool,
  listVideosTool,
  assignVideoToRoleTool,
  listMembersTool,
  getMemberTool,
  approveMemberTool,
  suspendMemberTool,
  rejectMemberTool,
  updateMemberRoleTool,
  updateMemberProfileTool,
  getMemberWatchHistoryTool,
  getTrainingCompletionTool,
  sendNotificationTool,
  notifyRoleMembersTool,
  getSystemSettingsTool,
  updateSystemSettingTool,
  getMemberStatisticsTool,
  getVideoStatisticsTool,
  getPendingMembersTool,
  getAuditLogsTool,
} from './tools';
import {
  bulkAddVideosTool,
  bulkUpdateVideosTool,
  bulkArchiveVideosTool,
  bulkPublishVideosTool,
  bulkAssignRoleTool,
  bulkCreateNotificationsTool,
  bulkApproveMembersTool,
} from './bulk-tools';

export async function executeTool(
  context: ToolContext,
  toolName: ToolName,
  params: any = {}
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'add_video':
        return await addVideoTool(context, params);
      case 'edit_video':
        return await editVideoTool(context, params);
      case 'archive_video':
        return await archiveVideoTool(context, params);
      case 'publish_video':
        return await publishVideoTool(context, params);
      case 'get_video':
        return await getVideoTool(context, params);
      case 'list_videos':
        return await listVideosTool(context, params);
      case 'assign_video_to_role':
        return await assignVideoToRoleTool(context, params);
      case 'list_members':
        return await listMembersTool(context, params);
      case 'get_member':
        return await getMemberTool(context, params);
      case 'approve_member':
        return await approveMemberTool(context, params);
      case 'suspend_member':
        return await suspendMemberTool(context, params);
      case 'reject_member':
        return await rejectMemberTool(context, params);
      case 'update_member_role':
        return await updateMemberRoleTool(context, params);
      case 'update_member_profile':
        return await updateMemberProfileTool(context, params);
      case 'get_member_watch_history':
        return await getMemberWatchHistoryTool(context, params);
      case 'get_training_completion':
        return await getTrainingCompletionTool(context, params);
      case 'send_notification':
        return await sendNotificationTool(context, params);
      case 'notify_role_members':
        return await notifyRoleMembersTool(context, params);
      case 'get_system_settings':
        return await getSystemSettingsTool(context, params);
      case 'update_system_setting':
        return await updateSystemSettingTool(context, params);
      case 'get_member_statistics':
        return await getMemberStatisticsTool(context);
      case 'get_video_statistics':
        return await getVideoStatisticsTool(context);
      case 'get_pending_members':
        return await getPendingMembersTool(context);
      case 'bulk_add_videos':
        return await bulkAddVideosTool(context, params);
      case 'bulk_update_videos':
        return await bulkUpdateVideosTool(context, params);
      case 'bulk_archive_videos':
        return await bulkArchiveVideosTool(context, params);
      case 'bulk_publish_videos':
        return await bulkPublishVideosTool(context, params);
      case 'bulk_assign_role':
        return await bulkAssignRoleTool(context, params);
      case 'bulk_create_notifications':
        return await bulkCreateNotificationsTool(context, params);
      case 'bulk_approve_members':
        return await bulkApproveMembersTool(context, params);
      case 'get_audit_logs':
        return await getAuditLogsTool(context, params);
      default:
        return {
          success: false,
          message: `Unknown tool '${toolName}'.`,
        };
    }
  } catch (error: any) {
    console.error(`Tool execution error [${toolName}]:`, error);
    return {
      success: false,
      message: error.message || `Failed to execute ${toolName}`,
      error: error.message,
    };
  }
}
