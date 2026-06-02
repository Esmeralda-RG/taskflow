import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const COMMENT_INTERACTIONS = new Set([
    'APROBADO',
    'DESAPROBADO',
    'DUDA'
]);

const isProjectManager = (user) => ['ADMIN', 'LEADER'].includes(user?.role);

const parseOptionalDate = (value) => (value ? new Date(value) : null);

const hasInvalidDateRange = (startDate, endDate) =>
    startDate && endDate && endDate < startDate;

const getProjectMembership = (projectId, userId) =>
    prisma.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId,
                userId
            }
        }
    });

const canAccessProject = async (projectId, user) => {
    if (isProjectManager(user)) {
        return true;
    }

    return Boolean(await getProjectMembership(projectId, user.userId));
};

const ensureAssigneeIsProjectMember = async (projectId, assigneeId) => {
    if (!assigneeId) {
        return true;
    }

    return Boolean(await getProjectMembership(projectId, assigneeId));
};

const canAccessTask = async (taskId, user) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
            id: true,
            assigneeId: true,
            projectId: true
        }
    });

    if (!task) {
        return { allowed: false, status: 404, message: 'Tarea no encontrada' };
    }

    if (['ADMIN', 'LEADER'].includes(user.role) || task.assigneeId === user.userId) {
        return { allowed: true, task };
    }

    const projectMember = await prisma.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId: task.projectId,
                userId: user.userId
            }
        }
    });

    if (!projectMember) {
        return { allowed: false, status: 403, message: 'No tienes acceso a esta tarea' };
    }

    return { allowed: true, task };
};

export const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            phaseId,
            projectId,
            assigneeId,
            estimatedHours,
            startDate,
            endDate
        } = req.body;

        if (!title || !phaseId || !projectId) {
            return res.status(400).json({ success: false, error: 'Titulo, fase y proyecto son requeridos' });
        }

        const parsedStartDate = parseOptionalDate(startDate);
        const parsedEndDate = parseOptionalDate(endDate);

        if (hasInvalidDateRange(parsedStartDate, parsedEndDate)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha límite no puede ser menor a la fecha de inicio'
            });
        }

        const assigneeIsMember = await ensureAssigneeIsProjectMember(projectId, assigneeId);

        if (!assigneeIsMember) {
            return res.status(400).json({
                success: false,
                message: 'El responsable debe ser miembro del proyecto'
            });
        }

        let parsedEstimatedHours = 0;
        if (estimatedHours !== undefined && estimatedHours !== null && estimatedHours !== '') {
            const n = Math.round(Number(estimatedHours));
            parsedEstimatedHours = Number.isFinite(n) ? n : 0;
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                phaseId,
                projectId,
                assigneeId: assigneeId || null,
                estimatedHours: parsedEstimatedHours,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                status: 'Por hacer',
            },
            include: {
                assignee: { select: { id: true, name: true } },
                phase: true,
                timeLogs: true
            }
        });
        res.status(201).json({ success: true, message: 'Tarea creada exitosamente', task });
    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({ success: false, error: 'Error al crear tarea' });
    }
};

const validateTaskAndProject = async (id, assigneeId) => {
    const currentTask = await prisma.task.findUnique({
        where: { id },
        select: { projectId: true }
    });

    if (!currentTask) {
        return { valid: false, status: 404, message: 'Tarea no encontrada' };
    }

    if (assigneeId) {
        const assigneeIsMember = await ensureAssigneeIsProjectMember(currentTask.projectId, assigneeId);
        if (!assigneeIsMember) {
            return { valid: false, status: 400, message: 'El responsable debe ser miembro del proyecto' };
        }
    }

    return { valid: true };
};

const parseEstimatedHours = (estimatedHours) => {
    if (estimatedHours === null || estimatedHours === '') return 0;
    const n = Math.round(Number(estimatedHours));
    return Number.isFinite(n) ? n : 0;
};

const buildUpdateData = (body, parsedStartDate, parsedEndDate) => {
    const { title, description, phaseId, assigneeId, estimatedHours, startDate, endDate } = body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    
    if (startDate !== undefined) updateData.startDate = parsedStartDate;
    if (endDate !== undefined) updateData.endDate = parsedEndDate;
    
    if (estimatedHours !== undefined) {
        updateData.estimatedHours = parseEstimatedHours(estimatedHours);
    }

    if (phaseId) {
        updateData.phase = { connect: { id: phaseId } };
    }

    if (assigneeId !== undefined) {
        updateData.assignee = assigneeId 
            ? { connect: { id: assigneeId } }
            : { disconnect: true };
    }

    return updateData;
};

export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, assigneeId } = req.body;

        const parsedStartDate = parseOptionalDate(startDate);
        const parsedEndDate = parseOptionalDate(endDate);

        if (hasInvalidDateRange(parsedStartDate, parsedEndDate)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha límite no puede ser menor a la fecha de inicio'
            });
        }

        const validation = await validateTaskAndProject(id, assigneeId);
        if (!validation.valid) {
            return res.status(validation.status).json({ success: false, message: validation.message });
        }

        const updateData = buildUpdateData(req.body, parsedStartDate, parsedEndDate);

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                assignee: true,
                phase: true,
                timeLogs: true
            }
        });

        return res.json({ success: true, message: 'Tarea actualizada exitosamente', task });
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Error al actualizar tarea' 
        });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.task.delete({ where: { id } });
        res.json({ success: true, message: 'Tarea eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar tarea' });
    }
};

export const getTaskByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const hasAccess = await canAccessProject(projectId, req.user);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a este proyecto'
            });
        }

        const tasks = await prisma.task.findMany({
            where: { projectId },
            include: {
                assignee: { select: { id: true, name: true } },
                phase: true,
                timeLogs: {
                    select: {
                        id: true,
                        timeSpent: true,
                        description: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const today = new Date();
        const tasksWithStatus = tasks.map(task => ({
            ...task,
            totalTimeSpent: task.timeLogs.reduce(
                (total, log) => total + (log.timeSpent || 0),
                0
            ),
            isOverdue: task.endDate && new Date(task.endDate) < today && task.phase.name !== 'Finalizado'
        }));


        res.json({ success: true, tasks: tasksWithStatus });
    } catch (error) {
        console.error('Error al obtener tareas por proyecto:', error);
        res.status(500).json({ success: false, error: 'Error al obtener tareas por proyecto' });
    }
};

export const assignTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { assigneeId } = req.body;

        const currentTask = await prisma.task.findUnique({
            where: { id },
            select: { projectId: true }
        });

        if (!currentTask) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }

        const assigneeIsMember = await ensureAssigneeIsProjectMember(currentTask.projectId, assigneeId);

        if (!assigneeIsMember) {
            return res.status(400).json({
                success: false,
                message: 'El responsable debe ser miembro del proyecto'
            });
        }

        const task = await prisma.task.update({
            where: { id },
            data: { assigneeId: assigneeId || null },
            include: { assignee: true, phase: true }
        });

        res.json({ success: true, message: assigneeId ? 'Responsable asignado exitosamente' : 'Tarea sin responsable', task });
    } catch (error) {
        console.error('Error al asignar tarea:', error);
        res.status(500).json({ success: false, error: 'Error al asignar responsable' });
    }
};

export const logTime = async (req, res) => {
    try {
        const { id } = req.params;
        const { timeSpent, description } = req.body;
        const minutes = Number.parseInt(timeSpent, 10);

        if (!Number.isInteger(minutes) || minutes <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El tiempo registrado debe ser mayor a 0 minutos'
            });
        }

        const task = await prisma.task.findUnique({
            where: { id },
            select: {
                id: true,
                assigneeId: true
            }
        });

        if (!task) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }

        if (task.assigneeId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Solo el ejecutor asignado puede registrar tiempo'
            });
        }

        const timeLog = await prisma.taskTimeLog.create({
            data: {
                taskId: id,
                userId: req.user.userId,
                timeSpent: minutes,
                description
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(201).json({ success: true, message: 'Tiempo registrado exitosamente', timeLog });
    } catch (error) {
        console.error('Error al registrar tiempo:', error);
        res.status(500).json({ success: false, error: 'Error al registrar tiempo' });
    }
};

export const moveTaskToPhase = async (req, res) => {
    try {
        const { id } = req.params;
        const { phaseId } = req.body;

        if(!phaseId) {
            return res.status(400).json({ success: false, error: 'Fase es requerida' });
        }

        const currentTask = await prisma.task.findUnique({
            where: { id },
            select: {
                id: true,
                assigneeId: true,
                projectId: true
            }
        });

        if (!currentTask) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }

        if (!isProjectManager(req.user) && currentTask.assigneeId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Solo el responsable o un administrador/líder puede mover la tarea'
            });
        }

        const phase = await prisma.phase.findUnique({
            where: { id: phaseId },
            select: {
                id: true,
                name: true,
                projectId: true
            }
        });

        if (phase?.projectId !== currentTask.projectId) {
    return res.status(400).json({
        success: false,
        message: 'La fase no pertenece al proyecto de la tarea'
    });
}

        const task = await prisma.task.update({
            where: { id },
            data: {
                phaseId,
                status: phase.name
            },
            include: { 
                phase: true,
                assignee: { select: { id: true, name: true, email: true } }
            }
        });

        res.json({ success: true, message: `Tarea movida a fase "${task.phase.name}"`, task });
    } catch (error) {
        console.error('Error al mover tarea:', error);
        res.status(500).json({ success: false, error: 'Error al mover tarea' });
    }
};

export const createTaskComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, interaction } = req.body;
        const commentContent = content?.trim();

        if (!commentContent || !interaction) {
            return res.status(400).json({
                success: false,
                message: 'El comentario requiere texto e interacción'
            });
        }

        if (!COMMENT_INTERACTIONS.has(interaction)) {
            return res.status(400).json({
                success: false,
                message: 'La interacción debe ser Aprobado, Desaprobado o Duda'
            });
        }

        const access = await canAccessTask(id, req.user);

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                message: access.message
            });
        }

        const comment = await prisma.comment.create({
            data: {
                content: commentContent,
                interaction,
                taskId: id,
                userId: req.user.userId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                attachments: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Comentario agregado exitosamente',
            comment
        });
    } catch (error) {
        console.error('Error al crear comentario:', error);
        res.status(500).json({ success: false, message: 'Error al crear comentario' });
    }
};

export const getTaskComments = async (req, res) => {
    try {
        const { id } = req.params;

        const access = await canAccessTask(id, req.user);

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                message: access.message
            });
        }

        const comments = await prisma.comment.findMany({
            where: { taskId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                attachments: true
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json({ success: true, comments });
    } catch (error) {
        console.error('Error al listar comentarios:', error);
        res.status(500).json({ success: false, message: 'Error al listar comentarios' });
    }
};
