import type { UserWithProfile } from '@/lib/auth';

export type ToolName =
  | 'add_video'
  | 'edit_video'
  | 'archive_video'
  | 'publish_video'
  | 'get_video'
  | 'list_videos'
  | 'assign_video_to_role'
  | 'list_members'
  | 'get_member'
  | 'approve_member'
  | 'suspend_member'
  | 'reject_member'
  | 'update_member_role'
  | 'update_member_profile'
  | 'get_member_watch_history'
  | 'get_training_completion'
  | 'send_notification'
  | 'notify_role_members'
  | 'get_system_settings'
  | 'update_system_setting'
  | 'get_member_statistics'
  | 'get_video_statistics'
  | 'get_pending_members';

export interface ToolContext {
  currentUser: UserWithProfile;
}

export interface ActionCard {
  type:
    | 'video_preview'
    | 'video_list'
    | 'member_card'
    | 'member_list'
    | 'stats_widget'
    | 'training_completion'
    | 'notification_summary'
    | 'settings_view';
  title?: string;
  data: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  message: string;
  card?: ActionCard;
  auditAction?: string;
  error?: string;
}

export interface PendingConfirmation {
  id: string;
  toolName: ToolName;
  params: any;
  summary: string;
  prompt: string;
  destructive: boolean;
  previewData?: any;
}

export interface ToolCallRecord {
  toolName: ToolName;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  description?: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: ToolCallRecord[];
  card?: ActionCard;
  pendingConfirmation?: PendingConfirmation | null;
}

export interface ChatRequestPayload {
  message: string;
  history?: ChatMessage[];
  confirmation?: {
    id: string;
    confirmed: boolean;
    toolName: ToolName;
    params: any;
  };
}

export interface ChatResponsePayload {
  success: boolean;
  message: string;
  toolCalls?: ToolCallRecord[];
  card?: ActionCard;
  pendingConfirmation?: PendingConfirmation | null;
  error?: string;
}
