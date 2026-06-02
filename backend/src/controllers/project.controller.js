import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isProjectManager = (user) => ['ADMIN'].includes(user?.role);

const canAccessProject = async (projectId, user) => {
    if (isProjectManager(user)) {
        return true;
    }

    const membership = await prisma.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId,
                userId: user.userId
            }
        }
    });

    return Boolean(membership);
};

export const createProject = async (req, res) => {
    try {
        const { name, description, startDate, endDate } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'El nombre del proyecto es requerido'
            });
        }

        const parsedStartDate = startDate ? new Date(startDate) : null;
        const parsedEndDate = endDate ? new Date(endDate) : null;

        if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
            return res.status(400).json({
                success: false,
                message: 'La fecha límite no puede ser menor a la fecha de inicio'
            });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                startDate: parsedStartDate,
                endDate: parsedEndDate,

                phases: {
                    create: [
                        {
                            name: 'Por hacer',
                            order: 1
                        },
                        {
                            name: 'En proceso',
                            order: 2
                        },
                        {
                            name: 'Finalizado',
                            order: 3
                        }
                    ]
                },
                members: {
                    create: {
                        userId: req.user.userId
                    }
                }
            },

            include: {
                phases: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: `Proyecto "${name}" creado exitosamente`,
            project
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: 'Error al crear el proyecto'
        });
    }
};

export const getProjects = async (req, res) => {
    try {
        const where = isProjectManager(req.user)
            ? {}
            : {
                members: {
                    some: {
                        userId: req.user.userId
                    }
                }
            };

        const projects = await prisma.project.findMany({
            where,
            include: {
                phases: {
                    orderBy: { order: 'asc' }
                },
                members: true
            },

            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            projects
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Error al obtener los proyectos'
        });
    }
};

export const getProjectSummary = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                phases: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        order: true
                    }
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                },
                tasks: {
                    include: {
                        phase: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        timeLogs: {
                            select: {
                                timeSpent: true
                            }
                        }
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        const hasAccess = await canAccessProject(id, req.user);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a este proyecto'
            });
        }

        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(
            (task) => task.phase?.name?.toLowerCase() === 'finalizado'
        ).length;
        const progressPercentage = totalTasks
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        const tasksByPhase = project.phases.map((phase) => {
            const count = project.tasks.filter(
                (task) => task.phase?.id === phase.id
            ).length;

            return {
                phaseId: phase.id,
                name: phase.name,
                total: count,
                percentage: totalTasks ? Math.round((count / totalTasks) * 100) : 0
            };
        });

        const estimatedHours = project.tasks.reduce(
            (total, task) => total + (task.estimatedHours || 0),
            0
        );
        const realMinutes = project.tasks.reduce(
            (total, task) =>
                total + task.timeLogs.reduce(
                    (taskTotal, log) => taskTotal + (log.timeSpent || 0),
                    0
                ),
            0
        );
        const realHours = Math.round((realMinutes / 60) * 10) / 10;

        const assignedExecutorIds = new Set(
            project.tasks
                .map((task) => task.assigneeId)
                .filter(Boolean)
        );
        const activeExecutors = project.members.filter(
            (member) =>
                member.user.role === 'EXECUTOR' &&
                assignedExecutorIds.has(member.user.id)
        );

        res.json({
            success: true,
            project: {
                id: project.id,
                name: project.name
            },
            summary: {
                totalTasks,
                completedTasks,
                progressPercentage,
                activeExecutors: activeExecutors.length,
                tasksByPhase,
                time: {
                    estimatedHours,
                    realHours,
                    realMinutes
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener resumen del proyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen del proyecto'
        });
    }
};

export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, startDate, endDate } = req.body;
        const parsedStartDate = startDate ? new Date(startDate) : null;
        const parsedEndDate = endDate ? new Date(endDate) : null;

        if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
            return res.status(400).json({
                success: false,
                message: 'La fecha límite no puede ser menor a la fecha de inicio'
            });
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                name, 
                description,
                startDate: parsedStartDate,
                endDate: parsedEndDate
            },
            include: {
                phases: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        res.json({
            success: true,
            message: `Proyecto "${name}" actualizado exitosamente`,
            project
        })
    } catch {
        res.status(500).json({ success: false, message: 'Error al actualizar el proyecto' });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.project.delete({ where: { id } });

        res.json({ success: true, message: 'Proyecto eliminado exitosamente' });  
    } catch {
        res.status(500).json({ success: false, message: 'Error al eliminar proyecto'});
    }
};

export const addCustomPhase = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const { name, order } = req.body;
        const phaseName = name?.trim();

        if (!phaseName) {
            return res.status(400).json({ success: false, message: 'El nombre de la fase es requerido' });
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
        }

        const existingPhases = await prisma.phase.findFirst({
            where: {
                projectId,
                name: {
                    equals: phaseName,
                    mode: 'insensitive'
                }
            }
        });

        if (existingPhases) {
            return res.status(409).json({ success: false, message: 'Ya existe una fase con ese nombre en este proyecto' });
        }

        const existingProjectPhases = await prisma.phase.findMany({
            where: { projectId },
            orderBy: { order: 'asc' }
        });

        const requestedOrder = typeof order === 'number' ? order : Number.parseInt(order, 10);
        const newOrder = Number.isInteger(requestedOrder)
            ? Math.min(Math.max(requestedOrder, 1), existingProjectPhases.length + 1)
            : existingProjectPhases.length + 1;

        const phase = await prisma.$transaction(async (tx) => {
            await Promise.all(
                existingProjectPhases
                    .filter((phase) => phase.order >= newOrder)
                    .map((phase) =>
                        tx.phase.update({
                            where: { id: phase.id },
                            data: { order: phase.order + 1 }
                        })
                    )
            );

            return tx.phase.create({
                data: {
                    name: phaseName,
                    order: newOrder,
                    project: { connect: { id: projectId } }
                }
            });
        });

        res.status(201).json({ success: true, message: `Fase ${phaseName} agregada con éxito`, phase });

    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'Ya existe una fase con ese nombre en este proyecto' });
        }
        res.status(500).json({ success: false, message: 'Error al agregar la fase personalizada' });
    }
};

export const updatePhase = async (req, res) => {
    try {
        const { projectId, phaseId } = req.params;
        const phaseName = req.body.name?.trim();

        if (!phaseName) {
            return res.status(400).json({ success: false, message: 'El nombre de la fase es requerido' });
        }

        const existing = await prisma.phase.findFirst({
            where: {
                projectId,
                name: { equals: phaseName, mode: 'insensitive' },
                NOT: { id: phaseId }
            }
        });

        if (existing) {
            return res.status(409).json({ success: false, message: 'Ya existe una fase con ese nombre en este proyecto' });
        }

        const phase = await prisma.phase.update({
            where: { id: phaseId },
            data: { name: phaseName }
        });

        res.json({ success: true, message: 'Fase actualizada', phase });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar la fase' });
    }
};

export const deletePhase = async (req, res) => {
    try {
        const { projectId, phaseId } = req.params;

        const phase = await prisma.phase.findUnique({
            where: { id: phaseId },
            include: { tasks: { select: { id: true } } }
        });

        if (!phase || phase.projectId !== projectId) {
            return res.status(404).json({ success: false, message: 'Fase no encontrada' });
        }

        const tasksDeleted = phase.tasks.length;

        await prisma.phase.delete({ where: { id: phaseId } });

        res.json({ success: true, message: 'Fase eliminada', tasksDeleted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al eliminar la fase' });
    }
};

export const getProjectWorkload = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                },
                phases: {
                    orderBy: { order: 'asc' },
                    select: {
                        name: true
                    }
                },
                tasks: {
                    include: {
                        assignee: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        },
                        phase: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        const statusTemplate = project.phases.reduce((acc, phase) => {
            acc[phase.name] = 0;
            return acc;
        }, {});

        const workloadByUser = new Map(
            project.members.map((member) => [
                member.user.id,
                {
                    user: {
                        id: member.user.id,
                        name: member.user.name,
                        email: member.user.email,
                        role: member.user.role
                    },
                    assignedTasks: 0,
                    pendingEstimatedHours: 0,
                    status: { ...statusTemplate }
                }
            ])
        );

        project.tasks.forEach((task) => {
            if (!task.assignee) {
                return;
            }

            if (!workloadByUser.has(task.assignee.id)) {
                workloadByUser.set(task.assignee.id, {
                    user: {
                        id: task.assignee.id,
                        name: task.assignee.name,
                        email: task.assignee.email,
                        role: task.assignee.role
                    },
                    assignedTasks: 0,
                    pendingEstimatedHours: 0,
                    status: { ...statusTemplate }
                });
            }

            const userWorkload = workloadByUser.get(task.assignee.id);
            const statusName = task.phase?.name || task.status || 'Sin estado';

            userWorkload.assignedTasks += 1;
            userWorkload.status[statusName] = (userWorkload.status[statusName] || 0) + 1;

            if (statusName.toLowerCase() !== 'finalizado') {
                userWorkload.pendingEstimatedHours += task.estimatedHours || 0;
            }
        });

        const workload = Array.from(workloadByUser.values()).sort((a, b) =>
            (a.user.name || a.user.email).localeCompare(b.user.name || b.user.email)
        );

        res.json({
            success: true,
            project: {
                id: project.id,
                name: project.name
            },
            workload
        });
    } catch (error) {
        console.error('Error al obtener carga laboral:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener carga laboral'
        });
    }
};
