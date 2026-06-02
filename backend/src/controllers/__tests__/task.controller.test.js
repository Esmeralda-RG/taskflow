import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTask, getTaskByProject, logTime, moveTaskToPhase, deleteTask } from '../task.controller.js';

const mockPrisma = vi.hoisted(() => ({
    task: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    projectMember: {
        findUnique: vi.fn()
    },
    taskTimeLog: {
        create: vi.fn()
    },
    phase: {
        findUnique: vi.fn()
    },
    comment: {
        create: vi.fn(),
        findMany: vi.fn()
    }
}));

vi.mock('@prisma/client', () => ({ PrismaClient: vi.fn(() => mockPrisma) }));

const makeRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

const adminUser = { userId: 'u1', role: 'ADMIN' };
const leaderUser = { userId: 'u2', role: 'LEADER' };
const executorUser = { userId: 'u3', role: 'EXECUTOR' };

describe('createTask', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si faltan título, fase o proyecto', async () => {
        const req = { body: { description: 'desc' }, user: adminUser };
        const res = makeRes();

        await createTask(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 si la fecha fin es anterior a la fecha inicio', async () => {
        const req = {
            body: { title: 'T1', phaseId: 'ph1', projectId: 'p1', startDate: '2026-06-10', endDate: '2026-06-01' },
            user: adminUser
        };
        const res = makeRes();

        await createTask(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 si el responsable no es miembro del proyecto', async () => {
        mockPrisma.projectMember.findUnique.mockResolvedValue(null);

        const req = {
            body: { title: 'T1', phaseId: 'ph1', projectId: 'p1', assigneeId: 'u99' },
            user: adminUser
        };
        const res = makeRes();

        await createTask(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'El responsable debe ser miembro del proyecto' }));
    });

    it('crea la tarea y retorna 201', async () => {
        mockPrisma.projectMember.findUnique.mockResolvedValue({ projectId: 'p1', userId: 'u3' });
        mockPrisma.task.create.mockResolvedValue({
            id: 't1', title: 'T1', phase: { name: 'Por hacer' }, assignee: null, timeLogs: []
        });

        const req = {
            body: { title: 'T1', phaseId: 'ph1', projectId: 'p1', assigneeId: 'u3' },
            user: adminUser
        };
        const res = makeRes();

        await createTask(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('getTaskByProject', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 403 si el ejecutor no es miembro del proyecto', async () => {
        mockPrisma.projectMember.findUnique.mockResolvedValue(null);

        const req = { params: { projectId: 'p1' }, user: executorUser };
        const res = makeRes();

        await getTaskByProject(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('retorna tareas con flag isOverdue para admin', async () => {
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        mockPrisma.task.findMany.mockResolvedValue([
            {
                id: 't1',
                title: 'Overdue Task',
                endDate: yesterday,
                phase: { name: 'Por hacer' },
                timeLogs: []
            }
        ]);

        const req = { params: { projectId: 'p1' }, user: adminUser };
        const res = makeRes();

        await getTaskByProject(req, res);

        const { tasks } = res.json.mock.calls[0][0];
        expect(tasks[0].isOverdue).toBe(true);
    });

    it('no marca como vencida una tarea sin fecha límite', async () => {
        mockPrisma.task.findMany.mockResolvedValue([
            { id: 't2', title: 'T2', endDate: null, phase: { name: 'Por hacer' }, timeLogs: [] }
        ]);

        const req = { params: { projectId: 'p1' }, user: adminUser };
        const res = makeRes();

        await getTaskByProject(req, res);

        const { tasks } = res.json.mock.calls[0][0];
        expect(tasks[0].isOverdue).toBeFalsy();
    });
});

describe('logTime', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si el tiempo es 0 o negativo', async () => {
        const req = { params: { id: 't1' }, body: { timeSpent: 0 }, user: executorUser };
        const res = makeRes();

        await logTime(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 si timeSpent no es un número entero', async () => {
        const req = { params: { id: 't1' }, body: { timeSpent: 'abc' }, user: executorUser };
        const res = makeRes();

        await logTime(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 404 si la tarea no existe', async () => {
        mockPrisma.task.findUnique.mockResolvedValue(null);

        const req = { params: { id: 't-none' }, body: { timeSpent: 60 }, user: executorUser };
        const res = makeRes();

        await logTime(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 403 si el usuario no es el responsable', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', assigneeId: 'u99' });

        const req = { params: { id: 't1' }, body: { timeSpent: 60 }, user: executorUser };
        const res = makeRes();

        await logTime(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('registra tiempo y retorna 201', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', assigneeId: 'u3' });
        mockPrisma.taskTimeLog.create.mockResolvedValue({ id: 'tl1', timeSpent: 60 });

        const req = { params: { id: 't1' }, body: { timeSpent: 60, description: 'trabajo' }, user: executorUser };
        const res = makeRes();

        await logTime(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('moveTaskToPhase', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si no se proporciona phaseId', async () => {
        const req = { params: { id: 't1' }, body: {}, user: adminUser };
        const res = makeRes();

        await moveTaskToPhase(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 404 si la tarea no existe', async () => {
        mockPrisma.task.findUnique.mockResolvedValue(null);

        const req = { params: { id: 't-none' }, body: { phaseId: 'ph2' }, user: adminUser };
        const res = makeRes();

        await moveTaskToPhase(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 403 si el ejecutor no es el responsable', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', assigneeId: 'u99', projectId: 'p1' });

        const req = { params: { id: 't1' }, body: { phaseId: 'ph2' }, user: executorUser };
        const res = makeRes();

        await moveTaskToPhase(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('mueve la tarea a otra fase', async () => {
        mockPrisma.task.findUnique.mockResolvedValue({ id: 't1', assigneeId: 'u1', projectId: 'p1' });
        mockPrisma.phase.findUnique.mockResolvedValue({ id: 'ph2', name: 'En proceso', projectId: 'p1' });
        mockPrisma.task.update.mockResolvedValue({
            id: 't1',
            phase: { id: 'ph2', name: 'En proceso' },
            assignee: null
        });

        const req = { params: { id: 't1' }, body: { phaseId: 'ph2' }, user: adminUser };
        const res = makeRes();

        await moveTaskToPhase(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('deleteTask', () => {
    beforeEach(() => vi.clearAllMocks());

    it('elimina la tarea y retorna 200', async () => {
        mockPrisma.task.delete.mockResolvedValue({});

        const req = { params: { id: 't1' }, user: adminUser };
        const res = makeRes();

        await deleteTask(req, res);

        expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});
