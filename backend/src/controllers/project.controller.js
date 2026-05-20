import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createProject = async (req, res) => {
    try {
        const { name, description, startDate, endDate } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'El nombre del proyecto es requerido'
            });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,

                startDate: startDate
                    ? new Date(startDate)
                    : null,

                endDate: endDate
                    ? new Date(endDate)
                    : null,

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
                }
            },

            include: {
                phases: true
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

        const projects = await prisma.project.findMany({
            include: {
                phases: true,
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