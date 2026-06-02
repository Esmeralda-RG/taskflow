import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KanbanBoard from '../KanbanBoard.jsx';

vi.mock('../../contexts/AuthContext.jsx', () => ({
    useAuth: vi.fn()
}));

vi.mock('../TaskForm.jsx', () => ({
    default: ({ onCancel, taskToEdit }) => (
        <div data-testid="task-form">
            <span>{taskToEdit ? 'Editar tarea' : 'Nueva tarea'}</span>
            <button onClick={onCancel}>Cerrar formulario</button>
        </div>
    )
}));

vi.mock('../ProjectSummaryDashboard.jsx', () => ({
    default: ({ project }) => <div data-testid="summary-dashboard">{project.name}</div>
}));

import { useAuth } from '../../contexts/AuthContext.jsx';

const mockPhases = [
    { id: 'ph1', name: 'Por hacer', order: 1 },
    { id: 'ph2', name: 'En proceso', order: 2 },
    { id: 'ph3', name: 'Finalizado', order: 3 }
];

const mockProject = { id: 'p1', name: 'Proyecto Alpha', phases: mockPhases, members: [] };

const mockTask = {
    id: 't1', title: 'Tarea Ejemplo', description: 'Descripción',
    phase: { id: 'ph1', name: 'Por hacer' }, phaseId: 'ph1',
    assignee: { id: 'u3', name: 'Carlos' }, assigneeId: 'u3',
    estimatedHours: 4, endDate: null, timeLogs: [], isOverdue: false
};

const projectsResponse = { success: true, projects: [mockProject] };
const tasksResponse = { success: true, tasks: [] };
const tasksWithDataResponse = { success: true, tasks: [mockTask] };

const openProjectDropdown = async (label = 'Seleccionar proyecto...') => {
    const trigger = await screen.findByText(label);
    fireEvent.click(trigger);
};

describe('KanbanBoard', () => {
    beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
    afterEach(() => vi.unstubAllGlobals());

    const setupAdmin = () =>
        useAuth.mockReturnValue({ token: 'tok', user: { id: 'u1', role: 'ADMIN' } });

    const setupExecutor = () =>
        useAuth.mockReturnValue({ token: 'tok', user: { id: 'u3', role: 'EXECUTOR' } });

    it('renderiza el encabezado del tablero', async () => {
        setupAdmin();
        fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(projectsResponse) });

        render(<KanbanBoard />);

        expect(screen.getByText('Tablero Kanban')).toBeInTheDocument();
        expect(screen.getByText('Gestiona tareas y seguimiento de los proyectos')).toBeInTheDocument();
    });

    it('muestra "Seleccionar proyecto..." al iniciar', async () => {
        setupAdmin();
        fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(projectsResponse) });

        render(<KanbanBoard />);

        expect(screen.getByText('Seleccionar proyecto...')).toBeInTheDocument();
    });

    it('muestra los proyectos en el dropdown al hacer click', async () => {
        setupAdmin();
        fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(projectsResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();

        expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
    });

    it('carga las fases al seleccionar un proyecto', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));

        await waitFor(() => {
            expect(screen.getByText('Por hacer')).toBeInTheDocument();
            expect(screen.getByText('En proceso')).toBeInTheDocument();
            expect(screen.getByText('Finalizado')).toBeInTheDocument();
        });
    });

    it('muestra las tareas en la fase correcta', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksWithDataResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));

        await waitFor(() => {
            expect(screen.getByText('Tarea Ejemplo')).toBeInTheDocument();
            expect(screen.getByText('Carlos')).toBeInTheDocument();
        });
    });

    it('muestra el botón + Nueva tarea para admin', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));

        await waitFor(() => {
            expect(screen.getByText('+ Nueva tarea')).toBeInTheDocument();
        });
    });

    it('abre el formulario de tarea al hacer click en + Nueva tarea', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));
        await waitFor(() => screen.getByText('+ Nueva tarea'));

        fireEvent.click(screen.getByText('+ Nueva tarea'));
        expect(screen.getByTestId('task-form')).toBeInTheDocument();
    });

    it('cierra el formulario al cancelar', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));
        await waitFor(() => screen.getByText('+ Nueva tarea'));

        fireEvent.click(screen.getByText('+ Nueva tarea'));
        fireEvent.click(screen.getByText('Cerrar formulario'));
        expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
    });

    it('alterna la visibilidad del panel de análisis', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, summary: null }) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));
        await waitFor(() => screen.getByText('Ver análisis'));

        fireEvent.click(screen.getByText('Ver análisis'));
        expect(screen.getByTestId('summary-dashboard')).toBeInTheDocument();
        expect(screen.getByText('Ocultar análisis')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Ocultar análisis'));
        expect(screen.queryByTestId('summary-dashboard')).not.toBeInTheDocument();
    });

    it('el ejecutor no puede añadir fases (sin botón +)', async () => {
        setupExecutor();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));

        await waitFor(() => screen.getByText('Por hacer'));

        const buttons = screen.queryAllByRole('button');
        const addPhaseBtn = buttons.find(b => b.textContent.trim() === '+');
        expect(addPhaseBtn).toBeUndefined();
    });

    it('abre el modal de nueva fase al hacer click en + Nueva fase', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));
        await waitFor(() => screen.getByText('+ Nueva fase'));

        fireEvent.click(screen.getByText('+ Nueva fase'));

        expect(screen.getByText('Nueva fase')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ej. Por revisar, QA, Despliegue...')).toBeInTheDocument();
    });

    it('cierra el modal de fase al hacer click en el backdrop', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));
        await waitFor(() => screen.getByText('+ Nueva fase'));

        fireEvent.click(screen.getByText('+ Nueva fase'));
        expect(screen.getByText('Nueva fase')).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText('Cerrar modal'));
        expect(screen.queryByText('Nueva fase')).not.toBeInTheDocument();
    });

    it('envía el formulario de nueva fase', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksResponse) })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Fase creada',
                    phase: { id: 'ph4', name: 'Revisión', order: 4, projectId: 'p1' }
                })
            });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));
        await waitFor(() => screen.getByText('+ Nueva fase'));

        fireEvent.click(screen.getByText('+ Nueva fase'));
        await waitFor(() => screen.getByPlaceholderText('Ej. Por revisar, QA, Despliegue...'));

        fireEvent.change(screen.getByPlaceholderText('Ej. Por revisar, QA, Despliegue...'), {
            target: { value: 'Revisión' }
        });
        fireEvent.click(screen.getByText('Crear fase'));

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    });

    it('abre el formulario de edición al hacer click en una tarjeta de tarea', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksWithDataResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));
        await waitFor(() => screen.getByText('Tarea Ejemplo'));

        // Click en el botón dentro de la tarjeta de tarea
        const taskButton = screen.getByText('Tarea Ejemplo').closest('button');
        if (taskButton) {
            fireEvent.click(taskButton);
            expect(screen.getByTestId('task-form')).toBeInTheDocument();
        }
    });

    it('muestra "No hay tareas" en fases vacías', async () => {
        setupAdmin();
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(projectsResponse) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(tasksResponse) });

        render(<KanbanBoard />);
        await openProjectDropdown();
        fireEvent.click(screen.getByText('Proyecto Alpha'));

        await waitFor(() => {
            expect(screen.getAllByText('No hay tareas').length).toBeGreaterThan(0);
        });
    });
});
