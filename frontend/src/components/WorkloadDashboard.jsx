import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext.jsx';

function WorkloadDashboard({ project, onClose }) {
    const { token, user } = useAuth();
    const [workload, setWorkload] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const canViewWorkload = ['ADMIN', 'LEADER'].includes(user?.role);

    const fetchWorkload = useCallback(async () => {
        if (!canViewWorkload) {
            setLoading(false);
            setError('No tienes permisos para ver la carga laboral');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const res = await fetch(
                `http://localhost:3000/api/projects/${project.id}/workload`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await res.json();

            if (data.success) {
                setWorkload(data.workload);
            } else {
                setError(data.message || 'No se pudo cargar la carga laboral');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }, [canViewWorkload, project.id, token]);

    useEffect(() => {
        fetchWorkload();
    }, [fetchWorkload]);

    const statusNames = useMemo(() => {
        const names = new Set();

        workload.forEach((item) => {
            Object.keys(item.status || {}).forEach((statusName) => {
                names.add(statusName);
            });
        });

        return Array.from(names);
    }, [workload]);

    const chartData = useMemo(
        () => workload.map((item) => ({
            id: item.user.id,
            name: item.user.name || item.user.email,
            tareas: item.assignedTasks,
            horasPendientes: item.pendingEstimatedHours
        })),
        [workload]
    );
    const maxTasks = Math.max(...chartData.map((item) => item.tareas), 1);
    const maxHours = Math.max(...chartData.map((item) => item.horasPendientes), 1);

    return (
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Carga laboral: {project.name}
                    </h2>

                    <p className="text-gray-500 text-sm mt-1">
                        Comparativo de tareas asignadas y horas pendientes
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="h-10 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition"
                >
                    Cerrar
                </button>
            </div>

            {loading && (
                <div className="text-center py-10 text-gray-400 text-sm">
                    Cargando carga laboral...
                </div>
            )}

            {!loading && error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 text-sm text-red-600">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-4 mb-5 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#5B5CF0]" />
                                Tareas asignadas
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-600" />
                                Horas pendientes
                            </div>
                        </div>

                        <div
                            className="space-y-5"
                            role="img"
                            aria-label="Gráfica comparativa de tareas asignadas y horas pendientes por usuario"
                        >
                            {chartData.length === 0 && (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    No hay datos para graficar
                                </div>
                            )}

                            {chartData.map((item) => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3 md:items-center"
                                >
                                    <div
                                        className="text-sm font-medium text-gray-700 truncate"
                                        title={item.name}
                                    >
                                        {item.name}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-7 flex-1 rounded-lg bg-gray-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-lg bg-[#5B5CF0]"
                                                    style={{
                                                        width: `${item.tareas ? (item.tareas / maxTasks) * 100 : 0}%`
                                                    }}
                                                    title={`${item.tareas} tareas asignadas`}
                                                />
                                            </div>

                                            <span className="w-10 text-right text-xs text-gray-500">
                                                {item.tareas}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="h-7 flex-1 rounded-lg bg-gray-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-lg bg-green-600"
                                                    style={{
                                                        width: `${item.horasPendientes ? (item.horasPendientes / maxHours) * 100 : 0}%`
                                                    }}
                                                    title={`${item.horasPendientes} horas pendientes`}
                                                />
                                            </div>

                                            <span className="w-10 text-right text-xs text-gray-500">
                                                {item.horasPendientes}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr className="text-left">
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">Usuario</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">Rol</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">Tareas</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">Horas pendientes</th>
                                    {statusNames.map((statusName) => (
                                        <th
                                            key={statusName}
                                            className="px-6 py-4 text-sm font-semibold text-gray-700"
                                        >
                                            {statusName}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {workload.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4 + statusNames.length}
                                            className="px-6 py-8 text-center text-gray-400 text-sm"
                                        >
                                            No hay usuarios en el proyecto
                                        </td>
                                    </tr>
                                )}

                                {workload.map((item) => (
                                    <tr
                                        key={item.user.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                                            {item.user.name || item.user.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {item.user.role}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {item.assignedTasks}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {item.pendingEstimatedHours}
                                        </td>
                                        {statusNames.map((statusName) => (
                                            <td
                                                key={statusName}
                                                className="px-6 py-4 text-sm text-gray-700"
                                            >
                                                {item.status?.[statusName] || 0}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

WorkloadDashboard.propTypes = {
    project: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
    }).isRequired,
    onClose: PropTypes.func.isRequired
};

export default WorkloadDashboard;
