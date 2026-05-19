import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const createUser = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email, contraseña y rol son requeridos'
            });
        }

        // Verificar si el email ya existe 
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                role: role.toUpperCase() 
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        });

        res.status(201).json({
            success: true,
            message: `Usuario ${user.email} creado exitosamente`,
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    } 
};

export const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, users });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, name } = req.body;

        if (req.user.userId === id && role && role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'No puedes cambiar tu propio rol de administrador'
            });
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                role: role?.toUpperCase(),
                name
            }
        });

        res.json({ success: true, message: 'Usuario actualizado exitosamente', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.userId === id) {
            return res.status(403).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta'
            });
        }

        await prisma.user.delete({ where: { id } });
        res.json({ success: true, message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
    }
};