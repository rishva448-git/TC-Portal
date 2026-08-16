const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required for safe seeding.');
  }

  console.log('🌱 Starting safe Techveons database seeding...');

  const settings = [
    { key: 'company_name', value: 'Techveons Creations' },
    { key: 'announcement', value: 'Welcome to the Techveons Employee Digital Identity & Skill Platform 🚀' },
    { key: 'primary_color', value: '#2563eb' },
    { key: 'training_required_per_week', value: '2' },
  ];

  for (const setting of settings) {
    await db.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  const roleData = [
    {
      name: 'AI Automation & AI Agents',
      description: 'Focuses on n8n workflows, autonomous AI agents, API integrations, and business process automation.',
      recommendedSkills: JSON.stringify(['n8n', 'AI Agents', 'APIs', 'Workflow Automation', 'OpenAI API', 'Webhooks', 'Prompt Engineering']),
    },
    {
      name: 'Frontend Developer',
      description: 'Builds pixel-perfect, highly responsive, performant user interfaces using HTML, CSS, React, and Next.js.',
      recommendedSkills: JSON.stringify(['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS', 'Git', 'Responsive Design']),
    },
    {
      name: 'Backend Developer',
      description: 'Designs secure REST APIs, databases, authentication, server architecture, and cloud deployment.',
      recommendedSkills: JSON.stringify(['Node.js', 'APIs', 'Databases', 'Authentication', 'Security', 'Backend Architecture', 'Deployment', 'PostgreSQL']),
    },
    {
      name: 'UI/UX & Graphic Designer',
      description: 'Creates intuitive user flows, visual design systems, brand guidelines, and creative marketing visual assets.',
      recommendedSkills: JSON.stringify(['Figma', 'UI Design', 'UX Research', 'Typography', 'Branding', 'Graphic Design', 'Design Systems']),
    },
    {
      name: 'Video Editor',
      description: 'Produces high-impact videos, YouTube edits, reels, motion graphics, color correction, and audio mastering.',
      recommendedSkills: JSON.stringify(['Premiere Pro', 'DaVinci Resolve', 'CapCut', 'Motion Graphics', 'Color Grading', 'Sound Design', 'Storytelling']),
    },
    {
      name: 'Sales & Marketing',
      description: 'Drives business development, lead generation, client communication, content marketing, and customer acquisition.',
      recommendedSkills: JSON.stringify(['Lead Generation', 'Sales', 'Cold Outreach', 'Client Communication', 'Social Media Marketing', 'Copywriting', 'Branding']),
    },
  ];

  const roles = [];
  for (const item of roleData) {
    const role = await db.role.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
    roles.push(role);
  }

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const adminUser = await db.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'APPROVED',
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'APPROVED',
      profile: {
        create: {
          memberId: 'TV-000',
          fullName: 'Rishva (Founder & Admin)',
          phone: '+91 9876543210',
          email: adminEmail,
          profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          company: 'Techveons Creations',
          position: 'Founder & Head of Tech',
          roleId: roles[0]?.id ?? null,
          bio: 'Platform owner and administrator.',
          skills: JSON.stringify(['Leadership', 'Product']),
          status: 'APPROVED',
        },
      },
    },
    include: { profile: true },
  });

  console.log(`✅ Seed ensured admin account: ${adminUser.email}`);

  await db.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZED',
      target: 'Techveons Platform',
      metadata: JSON.stringify({ source: 'seed' }),
    },
  });

  console.log('🎉 Safe seeding completed successfully.');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
