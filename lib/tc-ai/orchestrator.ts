import { randomUUID } from 'crypto';
import type {
  ToolContext,
  ChatMessage,
  ChatResponsePayload,
  PendingConfirmation,
  ToolName,
} from './types';
import { executeTool } from './registry';
import { createPendingConfirmation } from './confirmation';
import { parseNaturalLanguageCommand, isAffirmativeResponse, isNegativeResponse } from './nlu';
import { callGeminiIfAvailable } from './gemini';

export async function processAiMessage(
  context: ToolContext,
  message: string,
  history: ChatMessage[] = [],
  confirmationPayload?: {
    id: string;
    confirmed: boolean;
    toolName: ToolName;
    params: any;
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

  // ----------------------------------------------------
  // CASE 1: Explicit Confirmation from UI action button
  // ----------------------------------------------------
  if (confirmationPayload) {
    const { confirmed, toolName, params } = confirmationPayload;

    if (!confirmed) {
      return {
        success: true,
        message: 'Action cancelled. No database changes were made.',
        toolCalls: [{ toolName, status: 'cancelled', description: 'User cancelled action' }],
      };
    }

    // Execute the confirmed action
    const result = await executeTool(context, toolName, params);
    return {
      success: result.success,
      message: result.message,
      card: result.card,
      toolCalls: [
        {
          toolName,
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
      return {
        success: true,
        message: 'Action cancelled. No changes were made.',
        toolCalls: [{ toolName: pending.toolName, status: 'cancelled' }],
        pendingConfirmation: null,
      };
    }

    if (isAffirmativeResponse(message)) {
      const result = await executeTool(context, pending.toolName, pending.params);
      return {
        success: result.success,
        message: result.message,
        card: result.card,
        toolCalls: [
          {
            toolName: pending.toolName,
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
  let targetTool: { toolName: ToolName; params: any } | null = null;

  // Try Gemini first if API key is configured
  targetTool = await callGeminiIfAvailable(
    message,
    history.map((h) => ({ role: h.role, content: h.content }))
  );

  // Fallback to deterministic NLU
  if (!targetTool) {
    const parsed = await parseNaturalLanguageCommand(message);
    if (parsed) {
      targetTool = {
        toolName: parsed.toolName,
        params: parsed.params,
      };
    }
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
