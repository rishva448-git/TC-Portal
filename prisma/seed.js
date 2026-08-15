const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  console.log('🌱 Starting Techveons database seeding...');

  // Clear existing records
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.watchHistory.deleteMany();
  await db.video.deleteMany();
  await db.memberProfile.deleteMany();
  await db.user.deleteMany();
  await db.role.deleteMany();
  await db.systemSetting.deleteMany();

  // Seed System Settings
  await db.systemSetting.createMany({
    data: [
      { key: 'company_name', value: 'Techveons Creations' },
      { key: 'announcement', value: 'Welcome to the Techveons Employee Digital Identity & Skill Platform 🚀' },
      { key: 'primary_color', value: '#2563eb' },
      { key: 'training_required_per_week', value: '2' },
    ],
  });

  // Seed 6 Company Roles
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
  for (const r of roleData) {
    const createdRole = await db.role.create({ data: r });
    roles.push(createdRole);
  }

  console.log(`✅ Created ${roles.length} company roles.`);

  // Password hash for admin account (use the provided admin credentials)
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Phoenixzz@2010', 10);

  // Seed Admin Account (real admin only)
  const adminUser = await db.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || 'rishva448@gmail.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'APPROVED',
      profile: {
        create: {
          memberId: 'TV-000',
          fullName: 'Rishva (Founder & Admin)',
          phone: '+91 9876543210',
          email: process.env.ADMIN_EMAIL || 'rishva448@gmail.com',
          profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          company: 'Techveons Creations',
          position: 'Founder & Head of Tech',
          roleId: roles[0].id,
          bio: 'Platform owner and administrator.',
          skills: JSON.stringify(['Leadership', 'Product']),
          status: 'APPROVED',
        },
      },
    },
  });

  console.log(`✅ Created Admin account: ${adminUser.email} (use your real admin credentials)`);

  // Audit Log sample entries
  await db.auditLog.createMany({
    data: [
      { userId: adminUser.id, action: 'SYSTEM_INITIALIZED', target: 'Techveons Platform', metadata: 'Initial seed data loaded' },
      { userId: adminUser.id, action: 'MEMBER_APPROVED', target: 'TV-001 (Guru)', metadata: 'Assigned AI Automation role' },
      { userId: adminUser.id, action: 'VIDEO_PUBLISHED', target: 'n8n Automation Beginner Tutorial', metadata: 'Assigned to AI Automation' },
    ],
  });

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
