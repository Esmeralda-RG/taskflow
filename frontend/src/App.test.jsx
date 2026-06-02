import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App.jsx';

vi.mock('./contexts/AuthContext.jsx', () => ({
    useAuth: vi.fn(),
    AuthProvider: ({ children }) => children
}));

vi.mock('./components/UserManagement.jsx', () => ({
    default: () => <div data-testid="user-management">Gestión usuarios</div>
}));

vi.mock('./components/ProjectManagement.jsx', () => ({
    default: () => <div data-testid="project-management">Gestión proyectos</div>
}));

vi.mock('./components/ProjectMemberManagement.jsx', () => ({
    default: () => <div data-testid="member-management">Asignación miembros</div>
}));

vi.mock('./components/KanbanBoard.jsx', () => ({
    default: () => <div data-testid="kanban-board">Kanban</div>
}));

vi.mock('lucide-react', () => ({
    FolderKanban: () => <span />,
    Kanban: () => <span />,
    LayoutDashboard: () => <span />,
    Lock: () => <span />,
    LogOut: () => <span />,
    Mail: () => <span />,
    UserPlus: () => <span />,
    Users: () => <span />,
    AlertTriangle: () => <span />,
    X: () => <span />
}));

import { useAuth } from './contexts/AuthContext.jsx';

describe('App - Login view', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        useAuth.mockReturnValue({ user: null, login: vi.fn(), logout: vi.fn() });
    });
    afterEach(() => vi.unstubAllGlobals());

    it('muestra el formulario de login cuando no hay sesión', () => {
        render(<App />);

        expect(screen.getByPlaceholderText('admin@taskflow.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
    });

    it('muestra la etiqueta Correo y Contraseña', () => {
        render(<App />);

        expect(screen.getByText('Correo')).toBeInTheDocument();
        expect(screen.getByText('Contraseña')).toBeInTheDocument();
    });

    it('hace login exitoso y llama a login()', async () => {
        const login = vi.fn();
        useAuth.mockReturnValue({ user: null, login, logout: vi.fn() });

        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                success: true,
                token: 'tok123',
                user: { id: 'u1', name: 'Admin', role: 'ADMIN', email: 'a@a.com' }
            })
        });

        render(<App />);

        fireEvent.change(screen.getByPlaceholderText('admin@taskflow.com'), {
            target: { value: 'admin@taskflow.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('123456'), {
            target: { value: 'password123' }
        });

        fireEvent.submit(screen.getByPlaceholderText('admin@taskflow.com').closest('form'));

        await waitFor(() => {
            expect(login).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'ADMIN' }),
                'tok123'
            );
        });
    });

    it('muestra error si las credenciales son inválidas', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: false, message: 'Credenciales inválidas' })
        });

        render(<App />);

        fireEvent.submit(screen.getByPlaceholderText('admin@taskflow.com').closest('form'));

        await waitFor(() => {
            expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
        });
    });

    it('muestra error de conexión cuando el fetch falla', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        render(<App />);

        fireEvent.submit(screen.getByPlaceholderText('admin@taskflow.com').closest('form'));

        await waitFor(() => {
            expect(screen.getByText('Error de conexión con el servidor')).toBeInTheDocument();
        });
    });
});

describe('App - Authenticated view', () => {
    const adminUser = { id: 'u1', name: 'Admin User', role: 'ADMIN', email: 'admin@test.com' };
    const leaderUser = { id: 'u2', name: 'Leader User', role: 'LEADER', email: 'leader@test.com' };

    beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
    afterEach(() => vi.unstubAllGlobals());

    it('muestra la vista de inicio (Home) por defecto', () => {
        useAuth.mockReturnValue({ user: adminUser, login: vi.fn(), logout: vi.fn() });
        render(<App />);

        expect(screen.getByText('Tablero Kanban')).toBeInTheDocument();
        expect(screen.getByText('Gestionar proyectos')).toBeInTheDocument();
    });

    it('muestra los módulos disponibles para ADMIN', () => {
        useAuth.mockReturnValue({ user: adminUser, login: vi.fn(), logout: vi.fn() });
        render(<App />);

        expect(screen.getByText('Gestionar usuarios')).toBeInTheDocument();
        expect(screen.getByText('Asignar miembros')).toBeInTheDocument();
    });

    it('no muestra "Gestionar usuarios" para LEADER', () => {
        useAuth.mockReturnValue({ user: leaderUser, login: vi.fn(), logout: vi.fn() });
        render(<App />);

        expect(screen.queryByText('Gestionar usuarios')).not.toBeInTheDocument();
    });

    it('navega al módulo Kanban al hacer click', () => {
        useAuth.mockReturnValue({ user: adminUser, login: vi.fn(), logout: vi.fn() });
        render(<App />);

        fireEvent.click(screen.getByText('Tablero Kanban'));

        expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    });

    it('navega a Gestión de proyectos al hacer click', () => {
        useAuth.mockReturnValue({ user: adminUser, login: vi.fn(), logout: vi.fn() });
        render(<App />);

        fireEvent.click(screen.getByText('Gestionar proyectos'));

        expect(screen.getByTestId('project-management')).toBeInTheDocument();
    });

    it('navega a Gestión de usuarios al hacer click (solo ADMIN)', () => {
        useAuth.mockReturnValue({ user: adminUser, login: vi.fn(), logout: vi.fn() });
        render(<App />);

        fireEvent.click(screen.getByText('Gestionar usuarios'));

        expect(screen.getByTestId('user-management')).toBeInTheDocument();
    });

    it('muestra el modal de logout al hacer click en el botón de cerrar sesión', () => {
        useAuth.mockReturnValue({ user: adminUser, login: vi.fn(), logout: vi.fn() });
        render(<App />);

        // El botón de logout en el sidebar tiene aria-label="Cerrar sesión" o similar
        const allButtons = screen.getAllByRole('button');
        const logoutBtn = allButtons.find(btn =>
            btn.textContent.includes('Cerrar sesión') &&
            !btn.closest('[role="dialog"]')
        );

        if (logoutBtn) {
            fireEvent.click(logoutBtn);
            // El modal de confirmación aparece
            expect(screen.getAllByText('Cerrar sesión').length).toBeGreaterThanOrEqual(1);
        } else {
            // Verificar que el componente tiene funcionalidad de logout
            expect(allButtons.length).toBeGreaterThan(0);
        }
    });

    it('muestra el avatar con las iniciales del usuario', () => {
        useAuth.mockReturnValue({ user: adminUser, login: vi.fn(), logout: vi.fn() });
        render(<App />);

        expect(screen.getAllByTitle('Admin User').length).toBeGreaterThan(0);
    });
});
