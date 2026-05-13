import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // === USUARIOS ===
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.com' },
    update: {},
    create: {
      email: 'admin@taskflow.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  const leader = await prisma.user.upsert({
    where: { email: 'leader@taskflow.com' },
    update: {},
    create: {
      email: 'leader@taskflow.com',
      password: hashedPassword,
      name: 'Jota López',
      role: 'LEADER',
    },
  });

  const executor = await prisma.user.upsert({
    where: { email: 'executor@taskflow.com' },
    update: {},
    create: {
      email: 'executor@taskflow.com',
      password: hashedPassword,
      name: 'Esmeralda Rivas',
      role: 'EXECUTOR',
    },
  });

  console.log('✅ Usuarios creados');

  // === PROYECTO (usamos findFirst + create para evitar error de unique) ===
  let project = await prisma.project.findFirst({
    where: { name: 'Proyecto Alpha' }
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Proyecto Alpha',
        description: 'Proyecto piloto para TaskFlow',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('✅ Proyecto creado');
  } else {
    console.log('✅ Proyecto Alpha ya existía');
  }

  // === FASES ===
  const phaseNames = ['Por hacer', 'En proceso', 'Finalizado'];

  for (let i = 0; i < phaseNames.length; i++) {
    await prisma.phase.upsert({
      where: {
        projectId_name: {
          projectId: project.id,
          name: phaseNames[i]
        }
      },
      update: {},
      create: {
        name: phaseNames[i],
        order: i + 1,
        projectId: project.id,
      },
    });
  }

  console.log('✅ Fases creadas');
  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
