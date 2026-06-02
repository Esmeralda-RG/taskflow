import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectManagement from '../ProjectManagement.jsx';

vi.mock('../../contexts/AuthContext.jsx', () => ({
    useAuth: () => ({ token: 'tok', user: { id: 'u1', role: 'ADMIN' } })
}));

vi.mock('../WorkloadDashboard.jsx', () => ({
    default: ({ project, onClose }) => (
        <div data-testid="workload-dashboard">
            <span>Workload: {project.name}</span>
            <button onClick={onClose}>Cerrar workload</button>
        </div>
    )
}));

vi.mock('lucide-react', () => ({
    Pencil: () => <span data-testid="pencil-icon" />,
    Trash2: () => <span data-testid="trash-icon" />,
    BarChart3: () => <span data-testid="chart-icon" />,
    FolderKanban: () => <span />,
    Clock3: () => <span />,
    CheckCircle2: () => <span />,
    Users: () => <span />,
    AlertTriangle: () => <span data-testid="alert-icon" />,
    X: () => <span data-testid="x-icon" />
}));

const futureDate = '2027-12-31';
const mockProjects = [
    {
        id: 'p1',
        name: 'Proyecto Alpha',
        description: 'Desc Alpha',
        startDate: '2026-01-01T00:00:00Z',
        endDate: `${futureDate}T00:00:00Z`,
        members: [{ id: 'm1' }, { id: 'm2' }],
        phases: []
    },
    {
        id: 'p2',
        name: 'Proyecto Beta',
        description: null,
        startDate: null,
        endDate: null,
        members: [],
        phases: []
    }
];

const mockFetchProjects = () => ({
    ok: true,
    json: () => Promise.resolve({ success: true, projects: mockProjects })
});

describe('ProjectManagement', () => {
    beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
    afterEach(() => vi.unstubAllGlobals());

    it('muestra estado de carga inicialmente', () => {
        fetch.mockImplementation(() => new Promise(() => {}));
        render(<ProjectManagement />);
        expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });

    it('renderiza los proyectos después del fetch', async () => {
        fetch.mockResolvedValue(mockFetchProjects());
        render(<ProjectManagement />);

        await waitFor(() => {
            expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
            expect(screen.getByText('Proyecto Beta')).toBeInTheDocument();
        });
    });

    it('muestra el recuento total de proyectos', async () => {
        fetch.mockResolvedValue(mockFetchProjects());
        render(<ProjectManagement />);

        await waitFor(() => {
            expect(screen.getByText('Proyectos (2)')).toBeInTheDocument();
        });
    });

    it('crea un proyecto y recarga la lista', async () => {
        fetch
            .mockResolvedValueOnce(mockFetchProjects())
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, message: 'Proyecto creado' })
            })
            .mockResolvedValueOnce(mockFetchProjects());

        render(<ProjectManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));

        fireEvent.change(screen.getByPlaceholderText('Nombre'), {
            target: { value: 'Nuevo Proyecto' }
        });
        fireEvent.click(screen.getByText('Crear proyecto'));

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    });

    it('abre el modal de edición al hacer click en el lápiz', async () => {
        fetch.mockResolvedValue(mockFetchProjects());
        render(<ProjectManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));

        fireEvent.click(screen.getAllByTitle('Editar')[0]);

        expect(screen.getByText('Editar proyecto')).toBeInTheDocument();
        expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
    });

    it('cierra el modal de edición al cancelar', async () => {
        fetch.mockResolvedValue(mockFetchProjects());
        render(<ProjectManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));

        fireEvent.click(screen.getAllByTitle('Editar')[0]);
        expect(screen.getByText('Editar proyecto')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancelar'));
        expect(screen.queryByText('Editar proyecto')).not.toBeInTheDocument();
    });

    it('abre el modal de confirmación al hacer click en eliminar', async () => {
        fetch.mockResolvedValue(mockFetchProjects());
        render(<ProjectManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));

        fireEvent.click(screen.getAllByTitle('Eliminar')[0]);

        expect(screen.getByText('Eliminar proyecto')).toBeInTheDocument();
    });

    it('elimina el proyecto al confirmar', async () => {
        fetch
            .mockResolvedValueOnce(mockFetchProjects())
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
            .mockResolvedValueOnce(mockFetchProjects());

        render(<ProjectManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));

        fireEvent.click(screen.getAllByTitle('Eliminar')[0]);
        fireEvent.click(screen.getByText('Eliminar'));

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    });

    it('muestra el WorkloadDashboard al hacer click en Carga laboral', async () => {
        fetch.mockResolvedValue(mockFetchProjects());
        render(<ProjectManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));

        fireEvent.click(screen.getAllByText('Carga laboral')[0]);

        expect(screen.getByTestId('workload-dashboard')).toBeInTheDocument();
        expect(screen.getByText('Workload: Proyecto Alpha')).toBeInTheDocument();
    });

    it('cierra el WorkloadDashboard al hacer click en Cerrar', async () => {
        fetch.mockResolvedValue(mockFetchProjects());
        render(<ProjectManagement />);
        await waitFor(() => screen.getByText('Proyecto Alpha'));

        fireEvent.click(screen.getAllByText('Carga laboral')[0]);
        expect(screen.getByTestId('workload-dashboard')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cerrar workload'));
        expect(screen.queryByTestId('workload-dashboard')).not.toBeInTheDocument();
    });
});
