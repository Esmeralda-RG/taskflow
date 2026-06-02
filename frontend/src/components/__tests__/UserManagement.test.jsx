import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagement from '../UserManagement.jsx';

vi.mock('../../contexts/AuthContext.jsx', () => ({
    useAuth: () => ({ token: 'tok', user: { id: 'u1', role: 'ADMIN' } })
}));

vi.mock('lucide-react', () => ({
    Pencil: () => <span data-testid="pencil-icon" />,
    Trash2: () => <span data-testid="trash-icon" />,
    Save: () => <span data-testid="save-icon" />,
    X: () => <span data-testid="x-icon" />,
    AlertTriangle: () => <span data-testid="alert-icon" />
}));

const mockUsers = [
    { id: 'u1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'u2', name: 'Leader User', email: 'leader@test.com', role: 'LEADER', createdAt: '2026-01-02T00:00:00Z' },
    { id: 'u3', name: 'Exec User', email: 'exec@test.com', role: 'EXECUTOR', createdAt: '2026-01-03T00:00:00Z' }
];

const mockFetchUsers = () => ({
    ok: true,
    json: () => Promise.resolve({ success: true, users: mockUsers })
});

describe('UserManagement', () => {
    beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
    afterEach(() => vi.unstubAllGlobals());

    it('muestra estado de carga mientras fetcha', () => {
        fetch.mockImplementation(() => new Promise(() => {}));
        render(<UserManagement />);
        expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();
    });

    it('renderiza la lista de usuarios después del fetch', async () => {
        fetch.mockResolvedValue(mockFetchUsers());
        render(<UserManagement />);

        await waitFor(() => {
            expect(screen.getByText('Admin User')).toBeInTheDocument();
            expect(screen.getByText('Leader User')).toBeInTheDocument();
            expect(screen.getByText('Exec User')).toBeInTheDocument();
        });
    });

    it('muestra el contador total de usuarios', async () => {
        fetch.mockResolvedValue(mockFetchUsers());
        render(<UserManagement />);

        await waitFor(() => {
            expect(screen.getByText('3 usuarios')).toBeInTheDocument();
        });
    });

    it('filtra usuarios por rol al hacer click en el filtro', async () => {
        fetch.mockResolvedValue(mockFetchUsers());
        render(<UserManagement />);

        await waitFor(() => screen.getByText('Admin User'));

        // Buscar el botón de filtro específicamente por rol
        const filterButtons = screen.getAllByRole('button');
        const ejecutorFilter = filterButtons.find(btn =>
            btn.textContent === 'Ejecutor' && btn.className.includes('rounded-full')
        );
        fireEvent.click(ejecutorFilter);

        await waitFor(() => {
            expect(screen.getByText('Exec User')).toBeInTheDocument();
            expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
        });
    });

    it('crea un usuario y recarga la lista', async () => {
        fetch
            .mockResolvedValueOnce(mockFetchUsers())
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, message: 'Usuario creado' })
            })
            .mockResolvedValueOnce(mockFetchUsers());

        render(<UserManagement />);
        await waitFor(() => screen.getByText('Admin User'));

        fireEvent.change(screen.getByPlaceholderText('usuario@taskflow.com'), {
            target: { value: 'nuevo@test.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Juan López'), {
            target: { value: 'Nuevo User' }
        });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), {
            target: { value: 'password123' }
        });

        fireEvent.click(screen.getByText('Crear usuario'));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(3);
        });
    });

    it('activa el modo edición al hacer click en el lápiz', async () => {
        fetch.mockResolvedValue(mockFetchUsers());
        render(<UserManagement />);
        await waitFor(() => screen.getByText('Admin User'));

        fireEvent.click(screen.getAllByTestId('pencil-icon')[0]);

        expect(screen.getAllByTestId('save-icon').length).toBeGreaterThan(0);
    });

    it('cancela la edición al hacer click en X', async () => {
        fetch.mockResolvedValue(mockFetchUsers());
        render(<UserManagement />);
        await waitFor(() => screen.getByText('Admin User'));

        fireEvent.click(screen.getAllByTestId('pencil-icon')[0]);
        expect(screen.getAllByTestId('save-icon').length).toBeGreaterThan(0);

        fireEvent.click(screen.getAllByTestId('x-icon')[0]);
        expect(screen.queryAllByTestId('save-icon')).toHaveLength(0);
    });

    it('abre el modal de confirmación al hacer click en eliminar', async () => {
        fetch.mockResolvedValue(mockFetchUsers());
        render(<UserManagement />);
        await waitFor(() => screen.getByText('Admin User'));

        fireEvent.click(screen.getAllByTestId('trash-icon')[0]);

        expect(screen.getByText('Eliminar usuario')).toBeInTheDocument();
    });

    it('cierra el modal al cancelar la eliminación', async () => {
        fetch.mockResolvedValue(mockFetchUsers());
        render(<UserManagement />);
        await waitFor(() => screen.getByText('Admin User'));

        fireEvent.click(screen.getAllByTestId('trash-icon')[0]);
        expect(screen.getByText('Eliminar usuario')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancelar'));
        expect(screen.queryByText('Eliminar usuario')).not.toBeInTheDocument();
    });

    it('renderiza las etiquetas de rol correctas en la tabla', async () => {
        fetch.mockResolvedValue(mockFetchUsers());
        render(<UserManagement />);

        await waitFor(() => {
            expect(screen.getByText('Administrador')).toBeInTheDocument();
            // Líder y Ejecutor aparecen también en los botones de filtro
            expect(screen.getAllByText('Líder').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Ejecutor').length).toBeGreaterThan(0);
        });
    });
});
