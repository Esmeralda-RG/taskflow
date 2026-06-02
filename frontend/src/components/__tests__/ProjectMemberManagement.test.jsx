import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectMemberManagement from '../ProjectMemberManagement.jsx';

vi.mock('../../contexts/AuthContext.jsx', () => ({
    useAuth: () => ({ token: 'tok', user: { id: 'u1', role: 'ADMIN' } })
}));

vi.mock('lucide-react', () => ({
    FolderKanban: () => <span />,
    Trash2: () => <span data-testid="trash-icon" />,
    AlertTriangle: () => <span />,
    X: () => <span />
}));

const mockProjects = [
    { id: 'p1', name: 'Proyecto Alpha', phases: [], description: 'Desc' },
    { id: 'p2', name: 'Proyecto Beta', phases: [], description: null }
];

const mockUsers = [
    { id: 'u2', name: 'Leader User', email: 'leader@test.com', role: 'LEADER' },
    { id: 'u3', name: 'Exec User', email: 'exec@test.com', role: 'EXECUTOR' }
];

const mockMembers = [
    { id: 'm1', user: { id: 'u2', name: 'Leader User', email: 'leader@test.com', role: 'LEADER' } }
];

describe('ProjectMemberManagement', () => {
    beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
    afterEach(() => vi.unstubAllGlobals());

    const setupInitialFetch = () => {
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, projects: mockProjects }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, users: mockUsers }) });
    };

    it('muestra los proyectos disponibles', async () => {
        setupInitialFetch();
        render(<ProjectMemberManagement />);

        await waitFor(() => {
            expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
            expect(screen.getByText('Proyecto Beta')).toBeInTheDocument();
        });
    });

    it('muestra el estado de carga de proyectos', () => {
        fetch.mockImplementation(() => new Promise(() => {}));
        render(<ProjectMemberManagement />);

        expect(screen.getByText('Cargando proyectos...')).toBeInTheDocument();
    });

    it('muestra mensaje cuando no hay proyectos', async () => {
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, projects: [] }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, users: [] }) });

        render(<ProjectMemberManagement />);

        await waitFor(() => {
            expect(screen.getByText('No hay proyectos disponibles')).toBeInTheDocument();
        });
    });

    it('carga los miembros al seleccionar un proyecto', async () => {
        setupInitialFetch();
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true, members: mockMembers })
        });

        render(<ProjectMemberManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));

        fireEvent.click(screen.getByText('Proyecto Alpha'));

        await waitFor(() => {
            expect(screen.getByText('Leader User')).toBeInTheDocument();
        });
    });

    it('muestra los usuarios disponibles para agregar al proyecto', async () => {
        setupInitialFetch();
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true, members: mockMembers })
        });

        render(<ProjectMemberManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));

        fireEvent.click(screen.getByText('Proyecto Alpha'));

        await waitFor(() => {
            // Exec User está disponible (no es miembro aún)
            expect(screen.getByText('Exec User')).toBeInTheDocument();
        });
    });

    it('selecciona un usuario y habilita el botón Asignar', async () => {
        setupInitialFetch();
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true, members: mockMembers })
        });

        render(<ProjectMemberManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));
        fireEvent.click(screen.getByText('Proyecto Alpha'));

        await waitFor(() => screen.getByText('Exec User'));

        const asignarBtn = screen.getByText('Asignar');
        expect(asignarBtn).toBeDisabled();

        fireEvent.click(screen.getByText('Exec User'));
        expect(asignarBtn).not.toBeDisabled();
    });

    it('agrega un miembro al hacer click en Asignar', async () => {
        setupInitialFetch();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, members: mockMembers }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, message: 'Asignado' }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, members: mockMembers }) });

        render(<ProjectMemberManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));
        fireEvent.click(screen.getByText('Proyecto Alpha'));

        await waitFor(() => screen.getByText('Exec User'));
        fireEvent.click(screen.getByText('Exec User'));
        fireEvent.click(screen.getByText('Asignar'));

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(5));
    });

    it('abre el modal de confirmación al hacer click en el ícono de retirar', async () => {
        setupInitialFetch();
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true, members: mockMembers })
        });

        render(<ProjectMemberManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));
        fireEvent.click(screen.getByText('Proyecto Alpha'));

        await waitFor(() => screen.getByText('Leader User'));

        fireEvent.click(screen.getByTestId('trash-icon'));
        expect(screen.getByText('Retirar miembro')).toBeInTheDocument();
    });
});
