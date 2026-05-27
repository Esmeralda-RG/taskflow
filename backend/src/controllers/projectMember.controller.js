import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const addMemberToProject = async (req, res) => {
    try {
        const { projectId, userId } = req.body;

        if (!projectId || !userId) {
            return res.status(400).json({ success: false, error: "Project ID y User ID son requeridos." });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return res.status(404).json({ success: false, error: "Proyecto no encontrado." });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ success: false, error: "Usuario no encontrado." });
        }

        const member = await prisma.projectMember.upsert({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
            update: {},
            create: {
                projectId,
                userId,
            },
        });

        res.status(201).json({ success: true, message: "Usuario asignado al proyecto exitosamente.", member });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Error al asignar usuario al proyecto." });
    }
};

export const getProjectMembers = async (req, res) => {
    try {
        const { projectId } = req.params;

        const members = await prisma.projectMember.findMany({
            where: { projectId },
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
        });

        res.json({ success: true, members });
    } catch {
        res.status(500).json({ success: false, error: "Error al obtener miembros del proyecto." });
    }
};

export const removeMemberFromProject = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } }
    });

    res.json({ success: true, message: 'Usuario removido del proyecto correctamente' });
  } catch {
    res.status(500).json({ success: false, message: 'Error al remover miembro del proyecto' });
  }
};
