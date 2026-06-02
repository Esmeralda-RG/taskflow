import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext.jsx';
import { X } from 'lucide-react';

function getInitials(name = '') {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return (parts[0] || '?').slice(0, 2).toUpperCase();
}

function taskLoadColor(tasks) {
    if (tasks === 0) return { bar: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500', avatar: 'bg-gray-400' };
    if (tasks <= 3)  return { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700', avatar: 'bg-emerald-500' };
    if (tasks <= 6)  return { bar: 'bg-amber-400',   badge: 'bg-amber-50  text-amber-700',   avatar: 'bg-amber-500'   };
    return             { bar: 'bg-red-400',    badge: 'bg-red-50    text-red-700',    avatar: 'bg-red-500'    };
}

const roleLabels = { ADMIN: 'Admin', LEADER: 'Líder', EXECUTOR: 'Ejecutor' };

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
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (data.success) setWorkload(data.workload);
            else setError(data.message || 'No se pudo cargar la carga laboral');
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }, [canViewWorkload, project.id, token]);

    useEffect(() => { fetchWorkload(); }, [fetchWorkload]);

    const statusNames = useMemo(() => {
        const names = new Set();
        workload.forEach((item) => Object.keys(item.status || {}).forEach((n) => names.add(n)));
        return Array.from(names);
    }, [workload]);

    const maxTasks = Math.max(...workload.map((i) => i.assignedTasks), 1);
    const maxHours = Math.max(...workload.map((i) => i.pendingEstimatedHours), 1);

    return (
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8">

            {/* Encabezado */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Carga laboral
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {project.name} — distribución de tareas por ejecutor
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition shrink-0"
                    title="Cerrar"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Cargando */}
            {loading && (
                <div className="flex items-center gap-3 py-10 justify-center text-gray-400 text-sm">
                    <div className="w-4 h-4 rounded-full border-2 border-[#5B5CF0] border-t-transparent animate-spin" />
                    Cargando carga laboral...
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 text-sm text-red-600 border border-red-100">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Leyenda */}
                    <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            1–3 tareas (bajo)
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            4–6 tareas (medio)
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            7+ tareas (alto)
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#5B5CF0]" />
                            Horas pendientes
                        </div>
                    </div>

                    {/* Gráfica de barras */}
                    {workload.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            No hay usuarios con tareas asignadas
                        </div>
                    ) : (
                        <div
                            className="space-y-5 mb-8"
                            role="img"
                            aria-label="Gráfica comparativa de carga laboral por usuario"
                        >
                            {workload.map((item) => {
                                const colors = taskLoadColor(item.assignedTasks);
                                const taskW = item.assignedTasks ? Math.max((item.assignedTasks / maxTasks) * 100, 3) : 0;
                                const hourW = item.pendingEstimatedHours ? Math.max((item.pendingEstimatedHours / maxHours) * 100, 3) : 0;

                                return (
                                    <div key={item.user.id} className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div
                                            className={`w-10 h-10 rounded-full ${colors.avatar} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1`}
                                            title={item.user.name || item.user.email}
                                        >
                                            {getInitials(item.user.name || item.user.email)}
                                        </div>

                                        {/* Barras */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2 mb-2">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {item.user.name || item.user.email}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {roleLabels[item.user.role] || item.user.role}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                                                        {item.assignedTasks} tarea{item.assignedTasks !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {item.pendingEstimatedHours}h pend.
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Barra tareas */}
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                                                        style={{ width: `${taskW}%` }}
                                                        title={`${item.assignedTasks} tareas`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Barra horas */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-[#5B5CF0]/60 transition-all duration-500"
                                                        style={{ width: `${hourW}%` }}
                                                        title={`${item.pendingEstimatedHours}h pendientes`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Desglose por fase */}
                                            {statusNames.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {statusNames.map((s) => (
                                                        item.status?.[s] > 0 && (
                                                            <span key={s} className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                                                                {s}: <strong>{item.status[s]}</strong>
                                                            </span>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Tabla de detalle */}
                    {workload.length > 0 && (
                        <div className="overflow-x-auto border-t border-gray-100 pt-6">
                            <table className="w-full">
                                <thead className="border-b border-gray-200">
                                    <tr className="text-left">
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Tareas</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Horas pend.</th>
                                        {statusNames.map((s) => (
                                            <th key={s} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
                                                {s}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {workload.map((item) => {
                                        const colors = taskLoadColor(item.assignedTasks);
                                        return (
                                            <tr key={item.user.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-7 h-7 rounded-full ${colors.avatar} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                                                            {getInitials(item.user.name || item.user.email)}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-800">
                                                            {item.user.name || item.user.email}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {roleLabels[item.user.role] || item.user.role}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                                                        {item.assignedTasks}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                                    {item.pendingEstimatedHours}h
                                                </td>
                                                {statusNames.map((s) => (
                                                    <td key={s} className="px-4 py-3 text-sm text-gray-700 text-center">
                                                        {item.status?.[s] || 0}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
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
