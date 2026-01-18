import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env['DATABASE_URL']!,
  }),
});

const rooms = [
  {
    id: uuid(),
    name: 'Art Studio',
    description: 'A creative space for digital artists and designers',
  },
  {
    id: uuid(),
    name: 'Music Room',
    description: 'Collaborate on music production and composition',
  },
  {
    id: uuid(),
    name: 'Design Hub',
    description: 'Perfect for UI/UX designers and graphic artists',
  },
  {
    id: uuid(),
    name: 'Coding Dojo',
    description: 'For programmers to pair and share knowledge',
  },
  {
    id: uuid(),
    name: "Writer's Den",
    description: 'A quiet space for writers to create and edit',
  },
  {
    id: uuid(),
    name: 'Game Dev Lab',
    description: 'Build and test games with your team',
  },
  {
    id: uuid(),
    name: '3D Modeling',
    description: 'Create and share 3D models and animations',
  },
  {
    id: uuid(),
    name: 'Photo Studio',
    description: 'Edit and enhance your photography',
  },
  {
    id: uuid(),
    name: 'Video Editing',
    description: 'Collaborate on video projects and edits',
  },
  {
    id: uuid(),
    name: 'Podcast Studio',
    description: 'Record and produce podcasts with your team',
  },
  {
    id: uuid(),
    name: 'UI/UX Workshop',
    description: 'Design and prototype user interfaces',
  },
  {
    id: uuid(),
    name: 'Data Science Lab',
    description: 'Analyze data and build ML models',
  },
  {
    id: uuid(),
    name: 'VR Space',
    description: 'Experience and create virtual reality content',
  },
  {
    id: uuid(),
    name: 'Animation Studio',
    description: 'Create 2D and 3D animations',
  },
  {
    id: uuid(),
    name: 'Web Design',
    description: 'Design and develop responsive websites',
  },
  {
    id: uuid(),
    name: 'Mobile App Dev',
    description: 'Build cross-platform mobile applications',
  },
  {
    id: uuid(),
    name: 'AI Research',
    description: 'Experiment with artificial intelligence',
  },
  {
    id: uuid(),
    name: 'Blockchain Hub',
    description: 'Develop decentralized applications',
  },
  {
    id: uuid(),
    name: 'Cloud Computing',
    description: 'Work with cloud infrastructure',
  },
  {
    id: uuid(),
    name: 'Cyber Security',
    description: 'Test and improve system security',
  },
  {
    id: uuid(),
    name: 'IoT Lab',
    description: 'Internet of Things development space',
  },
  {
    id: uuid(),
    name: 'Robotics Workshop',
    description: 'Build and program robots',
  },
  {
    id: uuid(),
    name: 'AR Studio',
    description: 'Create augmented reality experiences',
  },
  {
    id: uuid(),
    name: 'DevOps Dojo',
    description: 'Automate deployment and operations',
  },
  {
    id: uuid(),
    name: 'Startup Incubator',
    description: 'Collaborate on new business ideas',
  },
];

async function main() {
  await prisma.room.createMany({
    data: rooms,
  });

  await prisma.roomMember.createMany({
    data: rooms.map((room) => ({
      room_id: room.id,
      user_id: 'c1533c8d-dc85-4fd5-8595-c2810cfd007b',
      role: 'ADMIN',
    })),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
