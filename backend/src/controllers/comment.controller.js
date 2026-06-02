import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const canAccessComment = async (commentId, user) => {
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
            task: {
                select: {
                    id: true,
                    assigneeId: true,
                    projectId: true
                }
            }
        }
    });

    if (!comment) {
        return { allowed: false, status: 404, message: 'Comentario no encontrado' };
    }

    if (['ADMIN', 'LEADER'].includes(user.role) || comment.task.assigneeId === user.userId) {
        return { allowed: true, comment };
    }

    const projectMember = await prisma.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId: comment.task.projectId,
                userId: user.userId
            }
        }
    });

    if (!projectMember) {
        return { allowed: false, status: 403, message: 'No tienes acceso a este comentario' };
    }

    return { allowed: true, comment };
};

export const uploadCommentAttachments = async (req, res) => {
    try {
        const { id } = req.params;
        const access = req.comment
            ? { allowed: true, comment: req.comment }
            : await canAccessComment(id, req.user);

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                message: access.message
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe adjuntar al menos un archivo'
            });
        }

        const attachments = await prisma.$transaction(
            req.files.map((file) =>
                prisma.attachment.create({
                    data: {
                        fileName: file.originalname,
                        fileUrl: `/uploads/comments/${file.filename}`,
                        taskId: access.comment.taskId,
                        commentId: id
                    }
                })
            )
        );

        res.status(201).json({
            success: true,
            message: 'Adjunto agregado exitosamente',
            attachments
        });
    } catch (error) {
        console.error('Error al cargar adjuntos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar adjuntos'
        });
    }
};
