import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCustomPhase, getProjectWorkload } from '../project.controller.js';

const mockPrisma = vi.hoisted(() => ({
    project: { findUnique: vi.fn() },
    projectMember: { findUnique: vi.fn() },
    phase: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
    },
    $transaction: vi.fn()
}));

vi.mock('@prisma/client', () => ({ PrismaClient: vi.fn(() => mockPrisma) }));

const makeRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
const adminUser = { userId: 'u1', role: 'ADMIN' };

const baseProject = {
    id: 'p1',
    name: 'P1',
    members: [{ user: { id: 'u3', name: 'Carlos', email: 'c@c.com', role: 'EXECUTOR' } }],
    phases: [{ name: 'Por hacer' }, { name: 'En proceso' }, { name: 'Finalizado' }],
    tasks: []
};

describe('addCustomPhase', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si el nombre está vacío', async () => {
        const req = { params: { id: 'p1' }, body: { name: '   ' }, user: adminUser };
        const res = makeRes();

        await addCustomPhase(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 404 si el proyecto no existe', async () => {
        mockPrisma.project.findUnique.mockResolvedValue(null);

        const req = { params: { id: 'p-none' }, body: { name: 'Revisión' }, user: adminUser };
        const res = makeRes();

        await addCustomPhase(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 409 si ya existe una fase con ese nombre', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
        mockPrisma.phase.findFirst.mockResolvedValue({ id: 'ph1', name: 'Revisión' });

        const req = { params: { id: 'p1' }, body: { name: 'Revisión' }, user: adminUser };
        const res = makeRes();

        await addCustomPhase(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    it('crea la fase al final y retorna 201', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
        mockPrisma.phase.findFirst.mockResolvedValue(null);
        mockPrisma.phase.findMany.mockResolvedValue([
            { id: 'ph1', name: 'Por hacer', order: 1 },
            { id: 'ph2', name: 'En proceso', order: 2 }
        ]);
        const newPhase = { id: 'ph3', name: 'Revisión', order: 3, projectId: 'p1' };
        mockPrisma.$transaction.mockResolvedValue(newPhase);

        const req = { params: { id: 'p1' }, body: { name: 'Revisión' }, user: adminUser };
        const res = makeRes();

        await addCustomPhase(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, phase: newPhase }));
    });

    it('inserta la fase en la posición indicada', async () => {
        mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
        mockPrisma.phase.findFirst.mockResolvedValue(null);
        mockPrisma.phase.findMany.mockResolvedValue([
            { id: 'ph1', name: 'Por hacer', order: 1 },
            { id: 'ph2', name: 'En proceso', order: 2 },
            { id: 'ph3', name: 'Finalizado', order: 3 }
        ]);
        const newPhase = { id: 'ph4', name: 'Revisión', order: 2, projectId: 'p1' };
        mockPrisma.$transaction.mockResolvedValue(newPhase);

        const req = { params: { id: 'p1' }, body: { name: 'Revisión', order: 2 }, user: adminUser };
        const res = makeRes();

        await addCustomPhase(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });
});

describe('getProjectWorkload', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 404 si el proyecto no existe', async () => {
        mockPrisma.project.findUnique.mockResolvedValue(null);

        const req = { params: { id: 'p-none' }, user: adminUser };
        const res = makeRes();

        await getProjectWorkload(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna la carga laboral con miembros y tareas asignadas', async () => {
        const project = {
            ...baseProject,
            tasks: [
                {
                    id: 't1',
                    estimatedHours: 8,
                    assignee: { id: 'u3', name: 'Carlos', email: 'c@c.com', role: 'EXECUTOR' },
                    phase: { id: 'ph1', name: 'En proceso' }
                }
            ]
        };
        mockPrisma.project.findUnique.mockResolvedValue(project);

        const req = { params: { id: 'p1' }, user: adminUser };
        const res = makeRes();

        await getProjectWorkload(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                workload: expect.arrayContaining([
                    expect.objectContaining({
                        user: expect.objectContaining({ name: 'Carlos' }),
                        assignedTasks: 1,
                        pendingEstimatedHours: 8
                    })
                ])
            })
        );
    });

    it('excluye horas de tareas finalizadas del pendiente', async () => {
        const project = {
            ...baseProject,
            tasks: [
                {
                    id: 't1',
                    estimatedHours: 5,
                    assignee: { id: 'u3', name: 'Carlos', email: 'c@c.com', role: 'EXECUTOR' },
                    phase: { id: 'ph3', name: 'Finalizado' }
                }
            ]
        };
        mockPrisma.project.findUnique.mockResolvedValue(project);

        const req = { params: { id: 'p1' }, user: adminUser };
        const res = makeRes();

        await getProjectWorkload(req, res);

        const workload = res.json.mock.calls[0][0].workload;
        const carlos = workload.find(w => w.user.name === 'Carlos');
        expect(carlos.pendingEstimatedHours).toBe(0);
    });

    it('retorna 500 si falla la base de datos', async () => {
        mockPrisma.project.findUnique.mockRejectedValue(new Error('DB error'));

        const req = { params: { id: 'p1' }, user: adminUser };
        const res = makeRes();

        await getProjectWorkload(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
