import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProjectSummaryDashboard from '../ProjectSummaryDashboard.jsx';

vi.mock('../../contexts/AuthContext.jsx', () => ({
    useAuth: () => ({ token: 'tok', user: { role: 'ADMIN', id: 'u1' } })
}));

const mockProject = { id: 'p1', name: 'Proyecto Alpha' };

const summaryData = {
    success: true,
    summary: {
        totalTasks: 10,
        completedTasks: 4,
        progressPercentage: 40,
        activeExecutors: 2,
        tasksByPhase: [
            { phaseId: 'ph1', name: 'Por hacer', total: 3, percentage: 30 },
            { phaseId: 'ph2', name: 'En proceso', total: 3, percentage: 30 },
            { phaseId: 'ph3', name: 'Finalizado', total: 4, percentage: 40 }
        ],
        time: { estimatedHours: 80, realHours: 32, realMinutes: 1920 }
    }
};

describe('ProjectSummaryDashboard', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('muestra el estado de carga inicialmente', () => {
        fetch.mockImplementation(() => new Promise(() => {}));

        render(<ProjectSummaryDashboard project={mockProject} refreshKey={0} />);

        expect(screen.getByText('Cargando resumen del proyecto...')).toBeInTheDocument();
    });

    it('muestra mensaje de error si el fetch falla', async () => {
        fetch.mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ success: false, message: 'Error del servidor' })
        });

        render(<ProjectSummaryDashboard project={mockProject} refreshKey={0} />);

        await waitFor(() => {
            expect(screen.getByText('Error del servidor')).toBeInTheDocument();
        });
    });

    it('muestra el porcentaje de avance', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(summaryData)
        });

        render(<ProjectSummaryDashboard project={mockProject} refreshKey={0} />);

        await waitFor(() => {
            expect(screen.getAllByText('40%').length).toBeGreaterThan(0);
        });
    });

    it('muestra las fases con sus totales', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(summaryData)
        });

        render(<ProjectSummaryDashboard project={mockProject} refreshKey={0} />);

        await waitFor(() => {
            expect(screen.getByText('Por hacer')).toBeInTheDocument();
            expect(screen.getByText('En proceso')).toBeInTheDocument();
            expect(screen.getByText('Finalizado')).toBeInTheDocument();
        });
    });

    it('muestra el total de tareas y tareas finalizadas', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(summaryData)
        });

        render(<ProjectSummaryDashboard project={mockProject} refreshKey={0} />);

        await waitFor(() => {
            expect(screen.getAllByText('10').length).toBeGreaterThan(0);
            expect(screen.getAllByText('4').length).toBeGreaterThan(0);
        });
    });

    it('muestra error de conexión cuando el fetch lanza una excepción', async () => {
        fetch.mockRejectedValue(new Error('Network error'));

        render(<ProjectSummaryDashboard project={mockProject} refreshKey={0} />);

        await waitFor(() => {
            expect(screen.getByText('Error de conexión al cargar el resumen')).toBeInTheDocument();
        });
    });

    it('muestra mensaje cuando no hay tareas por fase', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                success: true,
                summary: { ...summaryData.summary, tasksByPhase: [] }
            })
        });

        render(<ProjectSummaryDashboard project={mockProject} refreshKey={0} />);

        await waitFor(() => {
            expect(screen.getByText('Sin tareas registradas')).toBeInTheDocument();
        });
    });

    it('vuelve a hacer fetch cuando refreshKey cambia', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(summaryData)
        });

        const { rerender } = render(<ProjectSummaryDashboard project={mockProject} refreshKey={0} />);

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        rerender(<ProjectSummaryDashboard project={mockProject} refreshKey={1} />);

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    });
});
