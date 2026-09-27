import { db } from '@/lib/db';
import { COMPANY_KNOWLEDGE, findCompanyRole } from './company-knowledge';

export async function answerCompanyAssistantRequest(message: string): Promise<string | null> {
  const text = message.trim();
  const lower = text.toLowerCase();

  if (/(who (is|founded)|founder|ceo|slogan|company focus|what (does|is) techveons|services|company roles|departments)/i.test(text)) {
    const roleNames = COMPANY_KNOWLEDGE.roles.map((role) => `- ${role.name}`).join('\n');
    return `**${COMPANY_KNOWLEDGE.company}**\nFounder: **${COMPANY_KNOWLEDGE.founder.name}**, ${COMPANY_KNOWLEDGE.founder.title}\nSlogan: **${COMPANY_KNOWLEDGE.slogan}**\n\nFocus areas: ${COMPANY_KNOWLEDGE.focusAreas.join(', ')}.\nPlatforms: ${COMPANY_KNOWLEDGE.platforms.join(', ')}.\n\nCompany roles:\n${roleNames}\n\n${COMPANY_KNOWLEDGE.guidanceNote}`;
  }

  const role = COMPANY_KNOWLEDGE.roles.find((candidate) => lower.includes(candidate.name.toLowerCase())) ||
    COMPANY_KNOWLEDGE.roles.find((candidate) => {
      const match = findCompanyRole(candidate.name);
      return match && candidate.name === match.name && candidate.name.split(/[ &]/).some((part) => part.length > 5 && lower.includes(part.toLowerCase()));
    });

  if (/training content.*missing|missing.*training|training gaps|content gaps/i.test(text)) {
    const [roles, requiredVideos] = await Promise.all([
      db.role.findMany({ select: { id: true, name: true } }),
      db.video.findMany({ where: { status: 'Published', priority: 'Required' }, select: { roleId: true, title: true } }),
    ]);
    const gaps = roles.filter((item) => !requiredVideos.some((video) => video.roleId === item.id || video.roleId === null));
    if (gaps.length === 0) {
      return `The current database has at least one published Required video for each of its ${roles.length} roles. This checks portal records only; it does not assess the quality or completeness of their content.`;
    }
    return `**Training content gaps from current portal records**\nNo published Required video is assigned to or shared with these roles:\n${gaps.map((item) => `- ${item.name}`).join('\n')}\n\nThis is a database inventory, not an assessment of training quality.`;
  }

  if (/pending work|today'?s work|today'?s tasks|work for all departments|tasks for all departments/i.test(text)) {
    const [pendingMembers, drafts, requiredGaps] = await Promise.all([
      db.user.count({ where: { role: 'MEMBER', status: 'PENDING' } }),
      db.video.count({ where: { status: 'Draft' } }),
      db.role.findMany({ select: { id: true, name: true } }),
    ]);
    const requiredRoleIds = new Set((await db.video.findMany({ where: { status: 'Published', priority: 'Required' }, select: { roleId: true } })).map((video) => video.roleId));
    const missing = requiredGaps.filter((item) => !requiredRoleIds.has(item.id) && !requiredRoleIds.has(null));
    return `**Today's portal work (live records)**\n- Pending member approvals: **${pendingMembers}**\n- Draft videos awaiting review: **${drafts}**\n- Roles without published Required training: **${missing.length}**\n\n**Suggested team tasks**\n${COMPANY_KNOWLEDGE.roles.map((item) => `**${item.name}**\n- ${item.exampleTasks[0]}`).join('\n')}`;
  }

  if (/task|work|inniku|today/i.test(lower) && (role || /team|department/i.test(lower))) {
    const selectedRoles = role ? [role] : COMPANY_KNOWLEDGE.roles;
    return selectedRoles.map((item) => `**${item.name}**\n${item.exampleTasks.map((task) => `- ${task}`).join('\n')}`).join('\n\n') +
      `\n\nThese are suggested tasks from editable starter guidance, not assignments already stored in the portal.`;
  }

  if (/training plan|learning path|weekly training|30.day|learn next|skills should i learn/i.test(text)) {
    const requestedLength = Math.max(1, Math.min(84, Number(text.match(/(\d+)\s*(?:day|week)/i)?.[1] || (lower.includes('weekly') ? 1 : 4))));
    const isDayPlan = /day/i.test(text);
    const weekCount = isDayPlan ? Math.max(1, Math.round(requestedLength / 7)) : requestedLength;
    const selectedRoles = role ? [role] : COMPANY_KNOWLEDGE.roles;
    const plans = selectedRoles.map((selectedRole) => {
      const topics = selectedRole.trainingRequirements;
      const schedule = Array.from({ length: weekCount }, (_, index) => {
        const topic = topics[index % topics.length];
        const level = index < Math.ceil(weekCount / 3) ? 'Beginner' : index < Math.ceil((weekCount * 2) / 3) ? 'Intermediate' : 'Advanced';
        return `Week ${index + 1} (${level}): ${topic}\n- Study the fundamentals and take notes\n- Complete a small practical exercise\n- Review the result and record questions`;
      });
      return `**${selectedRole.name}**\n${schedule.join('\n\n')}`;
    });
    const planTitle = isDayPlan ? `${requestedLength}-day training plan (${weekCount} weekly blocks)` : `${weekCount}-week training plan`;
    return `**${planTitle}**\n\n${plans.join('\n\n')}\n\nThis is a suggested plan based on editable starter guidance, not an existing company policy.`;
  }

  if (/what skills|recommended skills|role skills|skills for/i.test(text) && role) {
    return `**Suggested skills for ${role.name}**\n${role.recommendedSkills.map((skill) => `- ${skill}`).join('\n')}\n\n${COMPANY_KNOWLEDGE.guidanceNote}`;
  }

  if (/\b(what|who|when|where|how|tell me about)\b.*\b(company|techveons|founder|clients?|customers?|history|revenue|objectives?|polic(?:y|ies)|business(?: model)?|mission|vision|pricing|projects?)\b/i.test(text)) {
    return 'That information is not available in the Techveons company knowledge base. Please provide the confirmed details so they can be added to the centralized company knowledge configuration.';
  }

  return null;
}