export interface CompanyRoleKnowledge {
  name: string;
  description: string;
  responsibilities: string[];
  recommendedSkills: string[];
  trainingRequirements: string[];
  exampleTasks: string[];
}

export const COMPANY_KNOWLEDGE = {
  company: 'Techveons Creations',
  founder: { name: 'Rishva', title: 'Founder & CEO' },
  slogan: 'Design. Develop. Deploy.',
  focusAreas: [
    'Web Development', 'App Development', 'UI/UX Design', 'Graphic Design',
    'Video Editing', 'Social Media Management', 'AI Automation', 'AI Agents',
    'Business Automation', 'Digital Marketing', 'Content Creation',
  ],
  platforms: ['TC Portal', 'TC AI'],
  roles: [
    {
      name: 'AI Automation & AI Agents',
      description: 'Starter role guidance for workflow automation and AI-assisted systems.',
      responsibilities: ['Map repeatable business processes', 'Build and test workflow automations', 'Integrate approved APIs and AI agents'],
      recommendedSkills: ['n8n', 'APIs', 'Webhooks', 'Workflow Automation', 'Prompt Engineering', 'AI Agents'],
      trainingRequirements: ['Workflow fundamentals', 'API and webhook basics', 'Testing, monitoring, and safe error handling'],
      exampleTasks: ['Document a manual process and its edge cases', 'Prototype an automation with test data'],
    },
    {
      name: 'Frontend Developer',
      description: 'Starter role guidance for accessible, responsive web interfaces.',
      responsibilities: ['Implement responsive page layouts', 'Connect interfaces to APIs', 'Test accessibility and browser behavior'],
      recommendedSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS', 'Git'],
      trainingRequirements: ['HTML and CSS fundamentals', 'JavaScript and React', 'Next.js, Git, and deployment basics'],
      exampleTasks: ['Build a responsive form from a design', 'Add loading, empty, and error states to a page'],
    },
    {
      name: 'Backend Developer',
      description: 'Starter role guidance for APIs, data storage, authentication, and server-side systems.',
      responsibilities: ['Design and implement API endpoints', 'Model and query application data', 'Apply authorization and input validation'],
      recommendedSkills: ['Node.js', 'REST APIs', 'PostgreSQL', 'Prisma', 'Authentication', 'Security', 'Testing'],
      trainingRequirements: ['HTTP and API fundamentals', 'Database modeling and SQL', 'Authentication, authorization, and deployment'],
      exampleTasks: ['Design an endpoint contract with validation rules', 'Add a database-backed API with tests'],
    },
    {
      name: 'UI/UX & Graphic Designer',
      description: 'Starter role guidance for user experience, interface, and graphic design work.',
      responsibilities: ['Map user flows and interface states', 'Create and maintain visual components', 'Prepare clear graphic assets for digital channels'],
      recommendedSkills: ['Figma', 'UI Design', 'UX Research', 'Typography', 'Color', 'Branding', 'Design Systems'],
      trainingRequirements: ['Layout and visual hierarchy', 'Prototyping and usability review', 'Asset export and handoff'],
      exampleTasks: ['Prototype a core workflow and its edge states', 'Prepare a reusable social post template'],
    },
    {
      name: 'Video Editor',
      description: 'Starter role guidance for editing and preparing video content.',
      responsibilities: ['Assemble footage into a clear narrative', 'Balance sound and color', 'Export platform-appropriate deliverables'],
      recommendedSkills: ['Premiere Pro', 'DaVinci Resolve', 'CapCut', 'Storytelling', 'Audio Editing', 'Color Correction'],
      trainingRequirements: ['Editing and timeline fundamentals', 'Audio and color basics', 'Export formats and review workflow'],
      exampleTasks: ['Create a short edit from supplied footage', 'Prepare captions and platform-specific exports'],
    },
    {
      name: 'Sales & Marketing',
      description: 'Starter role guidance for business development and digital marketing.',
      responsibilities: ['Research prospective audiences and leads', 'Prepare accurate outreach and campaign content', 'Track engagement and follow-up actions'],
      recommendedSkills: ['Lead Research', 'Client Communication', 'Copywriting', 'Social Media Marketing', 'Analytics', 'CRM'],
      trainingRequirements: ['Audience and offer fundamentals', 'Ethical outreach and communication', 'Campaign measurement basics'],
      exampleTasks: ['Draft an audience-specific outreach message', 'Summarize campaign performance from supplied metrics'],
    },
  ] satisfies CompanyRoleKnowledge[],
  guidanceNote: 'Role descriptions, responsibilities, skills, training, and tasks are editable starter guidance, not verified company policy. Ask the Founder to confirm policy-specific requirements.',
} as const;

export function findCompanyRole(name: string) {
  const normalized = name.toLowerCase().trim();
  return COMPANY_KNOWLEDGE.roles.find((role) =>
    role.name.toLowerCase() === normalized || role.name.toLowerCase().includes(normalized) || normalized.includes(role.name.toLowerCase())
  ) || null;
}