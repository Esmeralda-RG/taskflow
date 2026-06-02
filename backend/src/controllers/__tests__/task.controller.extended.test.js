import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateTask, assignTask, createTaskComment, getTaskComments } from '../task.controller.js';

const mockPrisma = vi.hoisted(() => ({
    task: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    projectMember: { findUnique: vi.fn() },
    taskTimeLog: { create: vi.fn() },
    phase: { findUnique: vi.fn() },
    comment: { create: vi.fn(), findMany: vi.fn() }
}));

vi.mock('@prisma/client', () => ({ PrismaClient: vi.fn(() => mockPrisma) }));

const makeRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

const adminUser = { userId: 'u1', role: 'ADMIN' };
const executorUser = { userId: 'u3', role: 'EXECUTOR' };

describe('updateTask', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si la fecha fin es anterior a la fecha inicio', async () => {
        const req = {
            params: { id: 't1' },
            body: { startDate: '2026-06-10', endDate: '2026-06-01' },
            user: adminUser
        };
        const res = makeRes();

        await updateTask(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 404 si la tarea no existe', async () => {
        mockPrisma.task.findUnique.mockResolvedValue(null);

        const req = {
            params: { id: 't-none' },
            body: { title: 'New Title' },
            user: adminUser
        };
        const res = makeRes();

        await updateTask(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 400 si el responsable no es miembro del proyecto', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', projectId: 'p1' });
        mockPrisma.projectMember.findUnique.mockResolvedValue(null);

        const req = {
            params: { id: 't1' },
            body: { assigneeId: 'u99' },
            user: adminUser
        };
        const res = makeRes();

        await updateTask(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('actualiza la tarea y retorna 200', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', projectId: 'p1' });
        mockPrisma.task.update.mockResolvedValue({
            id: 't1', title: 'Updated', phase: {}, assignee: null, timeLogs: []
        });

        const req = {
            params: { id: 't1' },
            body: { title: 'Updated' },
            user: adminUser
        };
        const res = makeRes();

        await updateTask(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('assignTask', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 404 si la tarea no existe', async () => {
        mockPrisma.task.findUnique.mockResolvedValue(null);

        const req = { params: { id: 't-none' }, body: { assigneeId: 'u3' }, user: adminUser };
        const res = makeRes();

        await assignTask(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 400 si el responsable no es miembro del proyecto', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', projectId: 'p1' });
        mockPrisma.projectMember.findUnique.mockResolvedValue(null);

        const req = { params: { id: 't1' }, body: { assigneeId: 'u99' }, user: adminUser };
        const res = makeRes();

        await assignTask(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('asigna el responsable y retorna 200', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', projectId: 'p1' });
        mockPrisma.projectMember.findUnique.mockResolvedValue({ projectId: 'p1', userId: 'u3' });
        mockPrisma.task.update.mockResolvedValue({ id: 't1', assignee: { id: 'u3' }, phase: {} });

        const req = { params: { id: 't1' }, body: { assigneeId: 'u3' }, user: adminUser };
        const res = makeRes();

        await assignTask(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('permite desasignar pasando assigneeId vacío', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', projectId: 'p1' });
        mockPrisma.task.update.mockResolvedValue({ id: 't1', assignee: null, phase: {} });

        const req = { params: { id: 't1' }, body: { assigneeId: '' }, user: adminUser };
        const res = makeRes();

        await assignTask(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Tarea sin responsable' })
        );
    });
});

describe('createTaskComment', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si falta contenido o interacción', async () => {
        const req = { params: { id: 't1' }, body: { content: '' }, user: adminUser };
        const res = makeRes();

        await createTaskComment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 si la interacción no es válida', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', assigneeId: 'u3', projectId: 'p1' });

        const req = {
            params: { id: 't1' },
            body: { content: 'Buen trabajo', interaction: 'INVALIDA' },
            user: adminUser
        };
        const res = makeRes();

        await createTaskComment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 404 si la tarea no existe', async () => {
        mockPrisma.task.findUnique.mockResolvedValue(null);

        const req = {
            params: { id: 't-none' },
            body: { content: 'Buen trabajo', interaction: 'APROBADO' },
            user: adminUser
        };
        const res = makeRes();

        await createTaskComment(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('crea el comentario y retorna 201', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', assigneeId: 'u3', projectId: 'p1' });
        mockPrisma.comment.create.mockResolvedValue({
            id: 'c1', content: 'Buen trabajo', interaction: 'APROBADO',
            user: { id: 'u1', name: 'Admin', email: 'a@a.com' }, attachments: []
        });

        const req = {
            params: { id: 't1' },
            body: { content: 'Buen trabajo', interaction: 'APROBADO' },
            user: adminUser
        };
        const res = makeRes();

        await createTaskComment(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('getTaskComments', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 403 si el ejecutor no tiene acceso a la tarea', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', assigneeId: 'u99', projectId: 'p1' });
        mockPrisma.projectMember.findUnique.mockResolvedValue(null);

        const req = { params: { id: 't1' }, user: executorUser };
        const res = makeRes();

        await getTaskComments(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('retorna los comentarios de la tarea', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', assigneeId: 'u1', projectId: 'p1' });
        const comments = [
            { id: 'c1', content: 'OK', interaction: 'APROBADO', user: { id: 'u1' }, attachments: [] }
        ];
        mockPrisma.comment.findMany.mockResolvedValue(comments);

        const req = { params: { id: 't1' }, user: adminUser };
        const res = makeRes();

        await getTaskComments(req, res);

        expect(res.json).toHaveBeenCalledWith({ success: true, comments });
    });
});
