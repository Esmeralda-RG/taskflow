import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WorkloadDashboard from '../WorkloadDashboard.jsx';

const mockUseAuth = vi.hoisted(() => vi.fn(() => ({ token: 'tok', user: { role: 'ADMIN', id: 'u1' } })));

vi.mock('../../contexts/AuthContext.jsx', () => ({
    useAuth: mockUseAuth
}));

const mockProject = { id: 'p1', name: 'Proyecto Alpha' };

const workloadData = {
    success: true,
    workload: [
        {
            user: { id: 'u3', name: 'Carlos', email: 'carlos@test.com', role: 'EXECUTOR' },
            assignedTasks: 3,
            pendingEstimatedHours: 12,
            status: { 'Por hacer': 1, 'En proceso': 2 }
        }
    ]
};

describe('WorkloadDashboard', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        mockUseAuth.mockReturnValue({ token: 'tok', user: { role: 'ADMIN', id: 'u1' } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('muestra el estado de carga inicialmente', () => {
        fetch.mockImplementation(() => new Promise(() => {}));

        render(<WorkloadDashboard project={mockProject} onClose={vi.fn()} />);

        expect(screen.getByText('Cargando carga laboral...')).toBeInTheDocument();
    });

    it('muestra un error cuando el fetch falla', async () => {
        fetch.mockRejectedValue(new Error('Network error'));

        render(<WorkloadDashboard project={mockProject} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Error de conexión')).toBeInTheDocument();
        });
    });

    it('muestra error de permisos cuando el usuario no es ADMIN ni LEADER', async () => {
        mockUseAuth.mockReturnValue({ token: 'tok', user: { role: 'EXECUTOR', id: 'u2' } });

        render(<WorkloadDashboard project={mockProject} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('No tienes permisos para ver la carga laboral')).toBeInTheDocument();
        });
    });

    it('muestra error del servidor cuando success es false', async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ success: false, message: 'Error interno del servidor' })
        });

        render(<WorkloadDashboard project={mockProject} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Error interno del servidor')).toBeInTheDocument();
        });
    });

    it('muestra mensaje cuando no hay usuarios con tareas asignadas', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true, workload: [] })
        });

        render(<WorkloadDashboard project={mockProject} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('No hay usuarios con tareas asignadas')).toBeInTheDocument();
        });
    });

    it('renderiza los datos de carga laboral', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(workloadData)
        });

        render(<WorkloadDashboard project={mockProject} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getAllByText('Carlos').length).toBeGreaterThan(0);
        });

        expect(screen.getAllByText('Ejecutor').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/tarea/).length).toBeGreaterThan(0);
    });

    it('llama onClose al hacer click en el botón Cerrar', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(workloadData)
        });

        const onClose = vi.fn();
        render(<WorkloadDashboard project={mockProject} onClose={onClose} />);

        await waitFor(() => screen.getAllByText('Carlos'));

        screen.getByTitle('Cerrar').click();

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('muestra la leyenda con los colores de tareas y horas', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(workloadData)
        });

        render(<WorkloadDashboard project={mockProject} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('1–3 tareas (bajo)')).toBeInTheDocument();
            expect(screen.getByText('Horas pendientes')).toBeInTheDocument();
        });
    });
});
