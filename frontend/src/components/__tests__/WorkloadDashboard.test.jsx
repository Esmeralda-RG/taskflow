import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WorkloadDashboard from '../WorkloadDashboard.jsx';

vi.mock('../../contexts/AuthContext.jsx', () => ({
    useAuth: () => ({ token: 'tok', user: { role: 'ADMIN', id: 'u1' } })
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

    it('renderiza los datos de carga laboral', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(workloadData)
        });

        render(<WorkloadDashboard project={mockProject} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getAllByText('Carlos').length).toBeGreaterThan(0);
        });

        expect(screen.getByText('EXECUTOR')).toBeInTheDocument();
        expect(screen.getByText('Tareas asignadas')).toBeInTheDocument();
    });

    it('llama onClose al hacer click en el botón Cerrar', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(workloadData)
        });

        const onClose = vi.fn();
        render(<WorkloadDashboard project={mockProject} onClose={onClose} />);

        await waitFor(() => screen.getAllByText('Carlos'));

        screen.getByText('Cerrar').click();

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('muestra la leyenda con los colores de tareas y horas', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(workloadData)
        });

        render(<WorkloadDashboard project={mockProject} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getAllByText('Tareas asignadas').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Horas pendientes').length).toBeGreaterThan(0);
        });
    });
});
