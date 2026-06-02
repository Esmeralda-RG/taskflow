import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createProject,
    getProjects,
    getProjectSummary,
    updateProject,
    deleteProject
} from '../project.controller.js';

const mockPrisma = vi.hoisted(() => ({
    project: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    projectMember: {
        findUnique: vi.fn()
    },
    phase: {
        findFirst: vi.fn(),
        findMany: vi.fn()
    }
}));

vi.mock('@prisma/client', () => ({ PrismaClient: vi.fn(() => mockPrisma) }));

const makeRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

const adminUser = { userId: 'u1', role: 'ADMIN', email: 'admin@test.com' };
const leaderUser = { userId: 'u2', role: 'LEADER', email: 'leader@test.com' };
const executorUser = { userId: 'u3', role: 'EXECUTOR', email: 'exec@test.com' };

describe('createProject', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si no se proporciona nombre', async () => {
        const req = { body: {}, user: adminUser };
        const res = makeRes();

        await createProject(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('retorna 400 si la fecha fin es anterior a la fecha inicio', async () => {
        const req = {
            body: { name: 'P1', startDate: '2026-06-10', endDate: '2026-06-01' },
            user: adminUser
        };
        const res = makeRes();

        await createProject(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('crea el proyecto y retorna 201', async () => {
        const project = { id: 'p1', name: 'P1', phases: [] };
        mockPrisma.project.create.mockResolvedValue(project);

        const req = { body: { name: 'P1' }, user: adminUser };
        const res = makeRes();

        await createProject(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, project }));
    });
});

describe('getProjects', () => {
    beforeEach(() => vi.clearAllMocks());

    it('admin obtiene todos los proyectos (sin filtro)', async () => {
        mockPrisma.project.findMany.mockResolvedValue([{ id: 'p1' }]);

        const req = { user: adminUser };
        const res = makeRes();

        await getProjects(req, res);

        expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: {} })
        );
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('ejecutor sólo obtiene los proyectos donde es miembro', async () => {
        mockPrisma.project.findMany.mockResolvedValue([]);

        const req = { user: executorUser };
        const res = makeRes();

        await getProjects(req, res);

        const call = mockPrisma.project.findMany.mock.calls[0][0];
        expect(call.where).toHaveProperty('members');
    });
});

describe('getProjectSummary', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 404 si el proyecto no existe', async () => {
        mockPrisma.project.findUnique.mockResolvedValue(null);

        const req = { params: { id: 'p-none' }, user: adminUser };
        const res = makeRes();

        await getProjectSummary(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 403 si el ejecutor no tiene acceso al proyecto', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1', tasks: [], phases: [], members: [] });
        mockPrisma.projectMember.findUnique.mockResolvedValue(null);

        const req = { params: { id: 'p1' }, user: executorUser };
        const res = makeRes();

        await getProjectSummary(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('retorna el resumen del proyecto para un admin', async () => {
        const project = {
            id: 'p1',
            name: 'P1',
            tasks: [
                {
                    phase: { id: 'ph1', name: 'Finalizado' },
                    estimatedHours: 8,
                    assigneeId: 'u3',
                    timeLogs: [{ timeSpent: 300 }]
                }
            ],
            phases: [{ id: 'ph1', name: 'Finalizado', order: 1 }],
            members: [{ user: { id: 'u3', role: 'EXECUTOR' } }]
        };

        mockPrisma.project.findUnique.mockResolvedValue(project);

        const req = { params: { id: 'p1' }, user: adminUser };
        const res = makeRes();

        await getProjectSummary(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                summary: expect.objectContaining({
                    totalTasks: 1,
                    completedTasks: 1,
                    progressPercentage: 100
                })
            })
        );
    });
});

describe('updateProject', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si la fecha fin es anterior a la fecha inicio', async () => {
        const req = {
            params: { id: 'p1' },
            body: { name: 'P1', startDate: '2026-06-10', endDate: '2026-05-01' },
            user: adminUser
        };
        const res = makeRes();

        await updateProject(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('actualiza el proyecto y retorna 200', async () => {
        mockPrisma.project.update.mockResolvedValue({ id: 'p1', name: 'Updated', phases: [] });

        const req = { params: { id: 'p1' }, body: { name: 'Updated' }, user: adminUser };
        const res = makeRes();

        await updateProject(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('deleteProject', () => {
    beforeEach(() => vi.clearAllMocks());

    it('elimina el proyecto y retorna 200', async () => {
        mockPrisma.project.delete.mockResolvedValue({});

        const req = { params: { id: 'p1' }, user: adminUser };
        const res = makeRes();

        await deleteProject(req, res);

        expect(mockPrisma.project.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});
