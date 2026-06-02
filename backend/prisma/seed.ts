import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const phaseNames = ['Por hacer', 'En proceso', 'Finalizado'];

async function upsertUser(email: string, name: string, role: 'ADMIN' | 'LEADER' | 'EXECUTOR', password: string) {
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role
    },
    create: {
      email,
      password,
      name,
      role
    }
  });
}

async function ensureProject(name: string, description: string, startOffsetDays: number, endOffsetDays: number) {
  const existingProject = await prisma.project.findFirst({
    where: { name }
  });

  if (existingProject) {
    return existingProject;
  }

  return prisma.project.create({
    data: {
      name,
      description,
      startDate: new Date(Date.now() + startOffsetDays * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + endOffsetDays * 24 * 60 * 60 * 1000)
    }
  });
}

async function ensurePhases(projectId: string) {
  const phases = [];

  for (let index = 0; index < phaseNames.length; index += 1) {
    const phase = await prisma.phase.upsert({
      where: {
        projectId_name: {
          projectId,
          name: phaseNames[index]
        }
      },
      update: {
        order: index + 1
      },
      create: {
        name: phaseNames[index],
        order: index + 1,
        projectId
      }
    });

    phases.push(phase);
  }

  return phases;
}

async function ensureMember(projectId: string, userId: string) {
  return prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    },
    update: {},
    create: {
      projectId,
      userId
    }
  });
}

async function ensureTask(data: {
  title: string;
  description: string;
  projectId: string;
  phaseId: string;
  assigneeId?: string;
  estimatedHours: number;
  startOffsetDays: number;
  endOffsetDays: number;
}) {
  const existingTask = await prisma.task.findFirst({
    where: {
      projectId: data.projectId,
      title: data.title
    }
  });

  if (existingTask) {
    return existingTask;
  }

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      phaseId: data.phaseId,
      assigneeId: data.assigneeId,
      estimatedHours: data.estimatedHours,
      startDate: new Date(Date.now() + data.startOffsetDays * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + data.endOffsetDays * 24 * 60 * 60 * 1000)
    }
  });
}

async function ensureComment(taskId: string, userId: string, content: string, interaction: 'APROBADO' | 'DESAPROBADO' | 'DUDA') {
  const existingComment = await prisma.comment.findFirst({
    where: {
      taskId,
      userId,
      content
    }
  });

  if (existingComment) {
    return existingComment;
  }

  return prisma.comment.create({
    data: {
      taskId,
      userId,
      content,
      interaction
    }
  });
}

async function ensureTimeLog(taskId: string, userId: string, timeSpent: number, description: string) {
  const existingLog = await prisma.taskTimeLog.findFirst({
    where: {
      taskId,
      userId,
      description
    }
  });

  if (existingLog) {
    return existingLog;
  }

  return prisma.taskTimeLog.create({
    data: {
      taskId,
      userId,
      timeSpent,
      description
    }
  });
}

async function main() {
  console.log('Iniciando seed de datos...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await upsertUser('admin@taskflow.com', 'Administrador', 'ADMIN', hashedPassword);
  const leader = await upsertUser('leader@taskflow.com', 'Jota López', 'LEADER', hashedPassword);
  const leaderTwo = await upsertUser('leader2@taskflow.com', 'Lina Torres', 'LEADER', hashedPassword);
  const executor = await upsertUser('executor@taskflow.com', 'Esmeralda Rivas', 'EXECUTOR', hashedPassword);
  const executorTwo = await upsertUser('executor2@taskflow.com', 'Carlos Vega', 'EXECUTOR', hashedPassword);
  const executorThree = await upsertUser('executor3@taskflow.com', 'Mariana Ruiz', 'EXECUTOR', hashedPassword);

  const alpha = await ensureProject('Proyecto Alpha', 'Proyecto piloto para TaskFlow', -3, 30);
  const beta = await ensureProject('Proyecto Beta', 'Implementación de dashboards y seguimiento', -1, 45);

  const alphaPhases = await ensurePhases(alpha.id);
  const betaPhases = await ensurePhases(beta.id);

  for (const user of [admin, leader, executor, executorTwo]) {
    await ensureMember(alpha.id, user.id);
  }

  for (const user of [leaderTwo, executor, executorTwo, executorThree]) {
    await ensureMember(beta.id, user.id);
  }

  const [alphaTodo, alphaProgress, alphaDone] = alphaPhases;
  const [betaTodo, betaProgress] = betaPhases;

  const tasks = [
    await ensureTask({
      title: 'Configurar autenticación JWT',
      description: 'Implementar login, token y middleware de autorización.',
      projectId: alpha.id,
      phaseId: alphaDone.id,
      assigneeId: executor.id,
      estimatedHours: 6,
      startOffsetDays: -3,
      endOffsetDays: -1
    }),
    await ensureTask({
      title: 'Diseñar tablero Kanban',
      description: 'Crear columnas por fase y tarjetas de tarea.',
      projectId: alpha.id,
      phaseId: alphaProgress.id,
      assigneeId: executor.id,
      estimatedHours: 5,
      startOffsetDays: -1,
      endOffsetDays: 4
    }),
    await ensureTask({
      title: 'Crear seed representativo',
      description: 'Poblar usuarios, proyectos, tareas y comentarios.',
      projectId: alpha.id,
      phaseId: alphaTodo.id,
      assigneeId: executorTwo.id,
      estimatedHours: 3,
      startOffsetDays: 0,
      endOffsetDays: 5
    }),
    await ensureTask({
      title: 'Implementar dashboard de avance',
      description: 'Resumen por fase, avance y comparación de tiempos.',
      projectId: beta.id,
      phaseId: betaProgress.id,
      assigneeId: executorThree.id,
      estimatedHours: 7,
      startOffsetDays: 0,
      endOffsetDays: 8
    }),
    await ensureTask({
      title: 'Probar carga de adjuntos',
      description: 'Validar formatos permitidos y descarga desde comentarios.',
      projectId: beta.id,
      phaseId: betaTodo.id,
      assigneeId: executorTwo.id,
      estimatedHours: 4,
      startOffsetDays: 1,
      endOffsetDays: 10
    })
  ];

  await ensureComment(tasks[0].id, leader.id, 'Autenticación revisada y aprobada.', 'APROBADO');
  await ensureComment(tasks[1].id, executor.id, 'Pendiente ajustar detalle visual en móvil.', 'DUDA');
  await ensureComment(tasks[3].id, leaderTwo.id, 'Comparativa de tiempo lista para revisión.', 'APROBADO');

  await ensureTimeLog(tasks[0].id, executor.id, 360, 'Implementación completa');
  await ensureTimeLog(tasks[1].id, executor.id, 150, 'Diseño inicial del tablero');
  await ensureTimeLog(tasks[3].id, executorThree.id, 210, 'Dashboard base');

  console.log('Seed completado exitosamente.');
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
