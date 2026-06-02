import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../auth.middleware.js';

vi.mock('jsonwebtoken');

const makeRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
});

describe('authenticate', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 401 si no hay header Authorization', () => {
        const req = { headers: {} };
        const res = makeRes();
        const next = vi.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        expect(next).not.toHaveBeenCalled();
    });

    it('retorna 401 si el header no empieza con Bearer', () => {
        const req = { headers: { authorization: 'Basic abc123' } };
        const res = makeRes();
        const next = vi.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('retorna 401 si el token es inválido', () => {
        jwt.verify.mockImplementation(() => { throw new Error('invalid token'); });

        const req = { headers: { authorization: 'Bearer badtoken' } };
        const res = makeRes();
        const next = vi.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        expect(next).not.toHaveBeenCalled();
    });

    it('llama next() y adjunta user al request si el token es válido', () => {
        const decoded = { userId: 'u1', role: 'ADMIN', email: 'admin@test.com' };
        jwt.verify.mockReturnValue(decoded);

        const req = { headers: { authorization: 'Bearer validtoken' } };
        const res = makeRes();
        const next = vi.fn();

        authenticate(req, res, next);

        expect(req.user).toEqual(decoded);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});

describe('authorize', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 401 si req.user no está definido', () => {
        const req = {};
        const res = makeRes();
        const next = vi.fn();

        authorize(['ADMIN'])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('retorna 403 si el rol del usuario no está en la lista permitida', () => {
        const req = { user: { role: 'EXECUTOR' } };
        const res = makeRes();
        const next = vi.fn();

        authorize(['ADMIN', 'LEADER'])(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('llama next() si el rol está en la lista permitida', () => {
        const req = { user: { role: 'LEADER' } };
        const res = makeRes();
        const next = vi.fn();

        authorize(['ADMIN', 'LEADER'])(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});
