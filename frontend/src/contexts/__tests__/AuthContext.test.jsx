import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext.jsx';

function AuthConsumer() {
    const { user, token, loading } = useAuth();
    if (loading) return <div>loading</div>;
    return (
        <div>
            <span data-testid="user">{user ? user.name : 'sin-usuario'}</span>
            <span data-testid="token">{token ?? 'sin-token'}</span>
        </div>
    );
}

function LoginConsumer() {
    const { login, logout, user } = useAuth();
    return (
        <div>
            <span data-testid="name">{user?.name ?? 'sin-usuario'}</span>
            <button onClick={() => login({ id: 'u1', name: 'Ana', role: 'ADMIN' }, 'tok123')}>
                login
            </button>
            <button onClick={logout}>logout</button>
        </div>
    );
}

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('proporciona user y token nulos cuando no hay sesión', async () => {
        render(<AuthProvider><AuthConsumer /></AuthProvider>);

        await screen.findByText('sin-usuario');

        expect(screen.getByTestId('user').textContent).toBe('sin-usuario');
        expect(screen.getByTestId('token').textContent).toBe('sin-token');
    });

    it('carga la sesión desde localStorage al montar', async () => {
        localStorage.setItem('token', 'stored-token');
        localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Ana', role: 'ADMIN' }));

        render(<AuthProvider><AuthConsumer /></AuthProvider>);

        await screen.findByText('Ana');

        expect(screen.getByTestId('user').textContent).toBe('Ana');
        expect(screen.getByTestId('token').textContent).toBe('stored-token');
    });

    it('login guarda usuario y token en localStorage', async () => {
        render(<AuthProvider><LoginConsumer /></AuthProvider>);

        await screen.findByText('sin-usuario');

        act(() => {
            screen.getByText('login').click();
        });

        expect(localStorage.getItem('token')).toBe('tok123');
        expect(JSON.parse(localStorage.getItem('user')).name).toBe('Ana');
        expect(screen.getByTestId('name').textContent).toBe('Ana');
    });

    it('logout limpia localStorage y resetea el estado', async () => {
        localStorage.setItem('token', 'tok123');
        localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Ana', role: 'ADMIN' }));

        render(<AuthProvider><LoginConsumer /></AuthProvider>);

        await screen.findByText('Ana');

        act(() => {
            screen.getByText('logout').click();
        });

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(screen.getByTestId('name').textContent).toBe('sin-usuario');
    });
});
