import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addMemberToProject, getProjectMembers, removeMemberFromProject } from '../projectMember.controller.js';

const mockPrisma = vi.hoisted(() => ({
    project: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    projectMember: {
        upsert: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn()
    },
    task: { updateMany: vi.fn() },
    $transaction: vi.fn()
}));

vi.mock('@prisma/client', () => ({ PrismaClient: vi.fn(() => mockPrisma) }));

const makeRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

describe('addMemberToProject', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si faltan projectId o userId', async () => {
        const req = { params: {}, body: {} };
        const res = makeRes();

        await addMemberToProject(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 404 si el proyecto no existe', async () => {
        mockPrisma.project.findUnique.mockResolvedValue(null);

        const req = { params: { projectId: 'p1' }, body: { userId: 'u1' } };
        const res = makeRes();

        await addMemberToProject(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Proyecto no encontrado.' }));
    });

    it('retorna 404 si el usuario no existe', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const req = { params: { projectId: 'p1' }, body: { userId: 'u-none' } };
        const res = makeRes();

        await addMemberToProject(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Usuario no encontrado.' }));
    });

    it('asigna al usuario y retorna 201', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
        mockPrisma.projectMember.upsert.mockResolvedValue({ projectId: 'p1', userId: 'u1' });

        const req = { params: { projectId: 'p1' }, body: { userId: 'u1' } };
        const res = makeRes();

        await addMemberToProject(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('getProjectMembers', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna la lista de miembros', async () => {
        const members = [{ user: { id: 'u1', name: 'User', email: 'u@a.com', role: 'EXECUTOR' } }];
        mockPrisma.projectMember.findMany.mockResolvedValue(members);

        const req = { params: { projectId: 'p1' } };
        const res = makeRes();

        await getProjectMembers(req, res);

        expect(res.json).toHaveBeenCalledWith({ success: true, members });
    });
});

describe('removeMemberFromProject', () => {
    beforeEach(() => vi.clearAllMocks());

    it('remueve al miembro y retorna 200', async () => {
        mockPrisma.$transaction.mockResolvedValue([]);

        const req = { params: { projectId: 'p1', userId: 'u1' } };
        const res = makeRes();

        await removeMemberFromProject(req, res);

        expect(mockPrisma.$transaction).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});
