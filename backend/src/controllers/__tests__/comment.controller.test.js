import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canAccessComment, uploadCommentAttachments } from '../comment.controller.js';

const mockPrisma = vi.hoisted(() => ({
    comment: { findUnique: vi.fn() },
    projectMember: { findUnique: vi.fn() },
    attachment: { create: vi.fn() },
    $transaction: vi.fn()
}));

vi.mock('@prisma/client', () => ({ PrismaClient: vi.fn(() => mockPrisma) }));

const makeRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
const adminUser = { userId: 'u1', role: 'ADMIN' };
const executorUser = { userId: 'u3', role: 'EXECUTOR' };

const baseComment = {
    id: 'c1',
    taskId: 't1',
    task: { id: 't1', assigneeId: 'u3', projectId: 'p1' }
};

describe('canAccessComment', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 404 si el comentario no existe', async () => {
        mockPrisma.comment.findUnique.mockResolvedValue(null);

        const result = await canAccessComment('c-none', adminUser);

        expect(result.allowed).toBe(false);
        expect(result.status).toBe(404);
    });

    it('permite acceso a ADMIN sin verificar membresía', async () => {
        mockPrisma.comment.findUnique.mockResolvedValue(baseComment);

        const result = await canAccessComment('c1', adminUser);

        expect(result.allowed).toBe(true);
        expect(mockPrisma.projectMember.findUnique).not.toHaveBeenCalled();
    });

    it('permite acceso al ejecutor asignado a la tarea', async () => {
        mockPrisma.comment.findUnique.mockResolvedValue(baseComment);

        const assigneeUser = { userId: 'u3', role: 'EXECUTOR' };
        const result = await canAccessComment('c1', assigneeUser);

        expect(result.allowed).toBe(true);
    });

    it('retorna 403 si el ejecutor no es miembro del proyecto', async () => {
        const otherComment = { ...baseComment, task: { ...baseComment.task, assigneeId: 'u99' } };
        mockPrisma.comment.findUnique.mockResolvedValue(otherComment);
        mockPrisma.projectMember.findUnique.mockResolvedValue(null);

        const result = await canAccessComment('c1', executorUser);

        expect(result.allowed).toBe(false);
        expect(result.status).toBe(403);
    });

    it('permite acceso al ejecutor que es miembro del proyecto', async () => {
        const otherComment = { ...baseComment, task: { ...baseComment.task, assigneeId: 'u99' } };
        mockPrisma.comment.findUnique.mockResolvedValue(otherComment);
        mockPrisma.projectMember.findUnique.mockResolvedValue({ projectId: 'p1', userId: 'u3' });

        const result = await canAccessComment('c1', executorUser);

        expect(result.allowed).toBe(true);
    });
});

describe('uploadCommentAttachments', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si no hay archivos adjuntos', async () => {
        const req = {
            params: { id: 'c1' },
            comment: baseComment,
            files: [],
            user: adminUser
        };
        const res = makeRes();

        await uploadCommentAttachments(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('retorna 201 con los adjuntos creados', async () => {
        const attachment = { id: 'a1', fileName: 'doc.pdf', fileUrl: '/uploads/comments/doc.pdf' };
        mockPrisma.$transaction.mockResolvedValue([attachment]);

        const req = {
            params: { id: 'c1' },
            comment: baseComment,
            files: [{ originalname: 'doc.pdf', filename: 'doc.pdf' }],
            user: adminUser
        };
        const res = makeRes();

        await uploadCommentAttachments(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, attachments: [attachment] })
        );
    });

    it('retorna 404 si no hay acceso al comentario', async () => {
        mockPrisma.comment.findUnique.mockResolvedValue(null);

        const req = {
            params: { id: 'c-none' },
            files: [{ originalname: 'doc.pdf', filename: 'doc.pdf' }],
            user: adminUser
        };
        const res = makeRes();

        await uploadCommentAttachments(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 500 si falla la transacción', async () => {
        mockPrisma.$transaction.mockRejectedValue(new Error('DB error'));

        const req = {
            params: { id: 'c1' },
            comment: baseComment,
            files: [{ originalname: 'doc.pdf', filename: 'doc.pdf' }],
            user: adminUser
        };
        const res = makeRes();

        await uploadCommentAttachments(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
