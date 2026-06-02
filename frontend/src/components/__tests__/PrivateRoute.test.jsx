import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivateRoute from '../PrivateRoute.jsx';

vi.mock('react-router-dom', () => ({
    Navigate: ({ to }) => <div data-testid="navigate-to" data-to={to} />
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
    useAuth: vi.fn()
}));

import { useAuth } from '../../contexts/AuthContext.jsx';

describe('PrivateRoute', () => {
    it('muestra "Cargando..." mientras loading es true', () => {
        useAuth.mockReturnValue({ user: null, loading: true });

        render(<PrivateRoute><div>contenido</div></PrivateRoute>);

        expect(screen.getByText('Cargando...')).toBeInTheDocument();
        expect(screen.queryByText('contenido')).not.toBeInTheDocument();
    });

    it('redirige a /login cuando no hay usuario autenticado', () => {
        useAuth.mockReturnValue({ user: null, loading: false });

        render(<PrivateRoute><div>contenido</div></PrivateRoute>);

        const nav = screen.getByTestId('navigate-to');
        expect(nav).toHaveAttribute('data-to', '/login');
        expect(screen.queryByText('contenido')).not.toBeInTheDocument();
    });

    it('renderiza los children cuando hay usuario autenticado', () => {
        useAuth.mockReturnValue({ user: { id: 'u1', role: 'ADMIN' }, loading: false });

        render(<PrivateRoute><div>contenido protegido</div></PrivateRoute>);

        expect(screen.getByText('contenido protegido')).toBeInTheDocument();
        expect(screen.queryByTestId('navigate-to')).not.toBeInTheDocument();
    });
});
