import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUser, getUsers, updateUser, deleteUser } from '../user.controller.js';

const mockPrisma = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    }
}));

vi.mock('@prisma/client', () => ({ PrismaClient: vi.fn(() => mockPrisma) }));
vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('$hashed$'),
        compare: vi.fn().mockResolvedValue(true)
    }
}));

const makeRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

describe('createUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si faltan campos requeridos', async () => {
        const req = { body: { email: 'a@a.com' } };
        const res = makeRes();

        await createUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('retorna 400 si el email ya existe', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

        const req = { body: { email: 'dup@a.com', password: '123', role: 'LEADER', name: 'Test' } };
        const res = makeRes();

        await createUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'El email ya está registrado' }));
    });

    it('retorna 201 con el usuario creado', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'new@a.com', name: 'New', role: 'LEADER' });

        const req = { body: { email: 'new@a.com', password: 'pass', role: 'LEADER', name: 'New' } };
        const res = makeRes();

        await createUser(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('getUsers', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna la lista de usuarios', async () => {
        const users = [{ id: 'u1', email: 'a@a.com', role: 'ADMIN', name: 'A', createdAt: new Date() }];
        mockPrisma.user.findMany.mockResolvedValue(users);

        const req = {};
        const res = makeRes();

        await getUsers(req, res);

        expect(res.json).toHaveBeenCalledWith({ success: true, users });
    });

    it('retorna 500 si falla la base de datos', async () => {
        mockPrisma.user.findMany.mockRejectedValue(new Error('DB error'));

        const req = {};
        const res = makeRes();

        await getUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('updateUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 403 si el usuario intenta cambiar su propio rol', async () => {
        const req = { params: { id: 'u1' }, body: { role: 'LEADER' }, user: { userId: 'u1' } };
        const res = makeRes();

        await updateUser(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('actualiza el usuario correctamente', async () => {
        mockPrisma.user.update.mockResolvedValue({ id: 'u2', name: 'Updated', role: 'LEADER' });

        const req = { params: { id: 'u2' }, body: { name: 'Updated', role: 'LEADER' }, user: { userId: 'u1' } };
        const res = makeRes();

        await updateUser(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('deleteUser', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 403 si el usuario intenta eliminarse a sí mismo', async () => {
        const req = { params: { id: 'u1' }, user: { userId: 'u1' } };
        const res = makeRes();

        await deleteUser(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('elimina el usuario y retorna 200', async () => {
        mockPrisma.user.delete.mockResolvedValue({});

        const req = { params: { id: 'u2' }, user: { userId: 'u1' } };
        const res = makeRes();

        await deleteUser(req, res);

        expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u2' } });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});
