import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const mockPrisma = vi.hoisted(() => ({
    user: { findUnique: vi.fn() }
}));

vi.mock('@prisma/client', () => ({ PrismaClient: vi.fn(() => mockPrisma) }));
vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('$hashed$'),
        compare: vi.fn()
    }
}));
vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn().mockReturnValue('fake.jwt.token'),
        verify: vi.fn()
    }
}));

import { app } from '../../src/app.js';

describe('POST /api/auth/login', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 si faltan email o contraseña', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('retorna 401 si el usuario no existe', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'noexiste@test.com', password: '123456' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('retorna 401 si la contraseña es incorrecta', async () => {
        const { default: bcrypt } = await import('bcrypt');
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'u1', email: 'a@a.com', name: 'A', role: 'ADMIN', password: '$hashed$'
        });
        bcrypt.compare.mockResolvedValue(false);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'a@a.com', password: 'wrong' });

        expect(res.status).toBe(401);
    });

    it('retorna 200 con token si las credenciales son válidas', async () => {
        const { default: bcrypt } = await import('bcrypt');
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'u1', email: 'a@a.com', name: 'Admin', role: 'ADMIN', password: '$hashed$'
        });
        bcrypt.compare.mockResolvedValue(true);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'a@a.com', password: 'correcta' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toMatchObject({ email: 'a@a.com', role: 'ADMIN' });
    });
});

describe('GET /api/users (ruta protegida)', () => {
    it('retorna 401 si no hay token', async () => {
        const res = await request(app).get('/api/users');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
