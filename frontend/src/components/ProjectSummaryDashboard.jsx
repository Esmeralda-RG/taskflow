import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext.jsx';

const formatHours = (hours) => {
    const value = Number(hours) || 0;
    return `${value.toLocaleString('es-CO')} h`;
};

const getVisibleWidth = (value, width) => (value > 0 ? Math.max(width, 4) : 0);

function ProjectSummaryDashboard({ project, refreshKey }) {
    const { token } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const res = await fetch(
                `http://localhost:3000/api/projects/${project.id}/summary`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || 'No se pudo cargar el resumen');
                setSummary(null);
                return;
            }

            setSummary(data.summary);
        } catch (err) {
            console.error(err);
            setError('Error de conexión al cargar el resumen');
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }, [project.id, token]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary, refreshKey]);

    const timeBars = useMemo(() => {
        if (!summary) return [];

        const estimatedHours = summary.time?.estimatedHours || 0;
        const realHours = summary.time?.realHours || 0;
        const maxHours = Math.max(estimatedHours, realHours, 1);

        return [
            {
                label: 'Estimado',
                value: estimatedHours,
                width: getVisibleWidth(
                    estimatedHours,
                    (estimatedHours / maxHours) * 100
                ),
                className: 'bg-[#5B5CF0]'
            },
            {
                label: 'Real',
                value: realHours,
                width: getVisibleWidth(realHours, (realHours / maxHours) * 100),
                className: 'bg-green-600'
            }
        ];
    }, [summary]);

    if (loading) {
        return (
            <section className="bg-white rounded-3xl shadow-sm p-6 mb-8">
                <p className="text-sm text-gray-400">Cargando resumen del proyecto...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="bg-white rounded-3xl shadow-sm p-6 mb-8">
                <p className="text-sm text-red-500">{error}</p>
            </section>
        );
    }

    if (!summary) return null;

    return (
        <section className="bg-white rounded-3xl shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Avance general
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Resumen operativo de {project.name}
                    </p>
                </div>

                <div className="min-w-[180px]">
                    <div className="flex items-end justify-between gap-4">
                        <span className="text-sm text-gray-500">Avance</span>
                        <span className="text-3xl font-bold text-gray-900">
                            {summary.progressPercentage}%
                        </span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden mt-3">
                        <div
                            className="h-full rounded-full bg-[#5B5CF0]"
                            style={{ width: `${summary.progressPercentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        {summary.completedTasks} de {summary.totalTasks} tareas finalizadas
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 border-y border-gray-200 mb-8">
                <div className="py-4 md:pr-5 md:border-r border-gray-200">
                    <p className="text-xs text-gray-500">Total de tareas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                        {summary.totalTasks}
                    </p>
                </div>

                <div className="py-4 md:px-5 md:border-r border-gray-200">
                    <p className="text-xs text-gray-500">Tareas finalizadas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                        {summary.completedTasks}
                    </p>
                </div>

                <div className="py-4 md:pl-5">
                    <p className="text-xs text-gray-500">Ejecutores activos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                        {summary.activeExecutors}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">
                            Tareas por fase
                        </h4>
                        <span className="text-xs text-gray-400">
                            {summary.totalTasks} tareas
                        </span>
                    </div>

                    <div className="space-y-4">
                        {summary.tasksByPhase.map((phase) => (
                            <div key={phase.phaseId}>
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="text-sm text-gray-700 truncate">
                                        {phase.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {phase.total} ({phase.percentage}%)
                                    </span>
                                </div>
                                <div className="h-7 rounded-xl bg-gray-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-xl bg-[#5B5CF0]"
                                        style={{
                                            width: `${getVisibleWidth(
                                                phase.total,
                                                phase.percentage
                                            )}%`
                                        }}
                                        title={`${phase.total} tareas en ${phase.name}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">
                            Tiempo estimado vs real
                        </h4>
                        <span className="text-xs text-gray-400">
                            Horas
                        </span>
                    </div>

                    <div className="space-y-4">
                        {timeBars.map((bar) => (
                            <div key={bar.label}>
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="text-sm text-gray-700">
                                        {bar.label}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formatHours(bar.value)}
                                    </span>
                                </div>
                                <div className="h-8 rounded-xl bg-gray-100 overflow-hidden">
                                    <div
                                        className={`h-full rounded-xl ${bar.className}`}
                                        style={{ width: `${bar.width}%` }}
                                        title={`${bar.label}: ${formatHours(bar.value)}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

ProjectSummaryDashboard.propTypes = {
    project: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
    }).isRequired,
    refreshKey: PropTypes.number.isRequired
};

export default ProjectSummaryDashboard;
