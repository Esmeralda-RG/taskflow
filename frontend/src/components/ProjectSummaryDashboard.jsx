import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext.jsx';
import { CheckCircle2, Users, BarChart3, Clock3 } from 'lucide-react';

const formatHours = (hours) => {
    const value = Number(hours) || 0;
    return `${value.toLocaleString('es-CO')} h`;
};

const getVisibleWidth = (value, width) => (value > 0 ? Math.max(width, 2) : 0);

const PHASE_COLORS = [
    { bar: 'bg-[#5B5CF0]', text: 'text-[#5B5CF0]', badge: 'bg-[#eef0ff]' },
    { bar: 'bg-amber-400',  text: 'text-amber-600',  badge: 'bg-amber-50'  },
    { bar: 'bg-emerald-500',text: 'text-emerald-600',badge: 'bg-emerald-50'},
    { bar: 'bg-rose-400',   text: 'text-rose-600',   badge: 'bg-rose-50'   },
    { bar: 'bg-sky-400',    text: 'text-sky-600',    badge: 'bg-sky-50'    },
    { bar: 'bg-violet-400', text: 'text-violet-600', badge: 'bg-violet-50' },
];

function CircularProgress({ pct }) {
    const r = 40;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
            <circle
                cx="50" cy="50" r={r}
                fill="none"
                stroke="#5B5CF0"
                strokeWidth="10"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700"
            />
        </svg>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="flex items-center gap-4 py-4">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon size={18} className="text-white" />
            </div>
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
            </div>
        </div>
    );
}

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
                { headers: { Authorization: `Bearer ${token}` } }
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

    useEffect(() => { fetchSummary(); }, [fetchSummary, refreshKey]);

    const { estimatedHours, realHours, maxHours, timeOverBudget } = useMemo(() => {
        if (!summary) return {};
        const est = summary.time?.estimatedHours || 0;
        const real = summary.time?.realHours || 0;
        return {
            estimatedHours: est,
            realHours: real,
            maxHours: Math.max(est, real, 1),
            timeOverBudget: real > est && est > 0
        };
    }, [summary]);

    const hoursDifference = estimatedHours - realHours;

    if (loading) {
        return (
            <section className="bg-white rounded-3xl shadow-sm p-6 mb-8">
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                    <div className="w-4 h-4 rounded-full border-2 border-[#5B5CF0] border-t-transparent animate-spin" />
                    Cargando resumen del proyecto...
                </div>
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

    const pct = summary.progressPercentage;

    return (
        <section className="bg-white rounded-3xl shadow-sm p-6 mb-8">

            {/* ─── ENCABEZADO ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Avance general</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Resumen operativo de {project.name}</p>
                </div>

                {/* Indicador circular */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <CircularProgress pct={pct} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-xl font-bold text-gray-900 leading-none">{pct}%</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            {summary.completedTasks} de {summary.totalTasks}
                        </p>
                        <p className="text-xs text-gray-400">tareas finalizadas</p>
                    </div>
                </div>
            </div>

            {/* ─── ESTADÍSTICAS ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-y border-gray-100 mb-8">
                <StatCard icon={BarChart3}    label="Total de tareas"    value={summary.totalTasks}     color="bg-[#5B5CF0]" />
                <StatCard icon={CheckCircle2} label="Finalizadas"         value={summary.completedTasks} color="bg-emerald-500" />
                <StatCard icon={Users}        label="Ejecutores activos"  value={summary.activeExecutors} color="bg-amber-400" />
                <StatCard icon={Clock3}       label={hoursDifference >= 0 ? "Horas disponibles" : "Horas excedidas"}   value={formatHours(Math.abs(hoursDifference))} color={hoursDifference >= 0 ? "bg-cyan-500" : "bg-red-500"}/>
            </div>

            {/* ─── GRÁFICAS ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Tareas por fase */}
                <div>
                    <div className="flex items-center justify-between mb-5">
                        <h4 className="text-sm font-semibold text-gray-900">Tareas por fase</h4>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {summary.totalTasks} tareas
                        </span>
                    </div>

                    <div className="space-y-3">
                        {summary.tasksByPhase.map((phase, i) => {
                            const color = PHASE_COLORS[i % PHASE_COLORS.length];
                            const w = getVisibleWidth(phase.total, phase.percentage);
                            return (
                                <div key={phase.phaseId}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${color.bar}`} />
                                            <span className="text-sm text-gray-700 truncate max-w-[160px]">
                                                {phase.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color.badge} ${color.text}`}>
                                                {phase.total}
                                            </span>
                                            <span className="text-xs text-gray-400 w-8 text-right">
                                                {phase.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                                            style={{ width: `${w}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {summary.tasksByPhase.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">Sin tareas registradas</p>
                        )}
                    </div>
                </div>

                {/* Tiempo estimado vs real */}
                <div>
                    <div className="space-y-5">
                        {/* Barra estimado */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#5B5CF0]" />
                                    <span className="text-sm text-gray-700">Estimado</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                    {formatHours(estimatedHours)}
                                </span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[#5B5CF0] transition-all duration-500"
                                    style={{ width: `${getVisibleWidth(estimatedHours, (estimatedHours / maxHours) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Barra real */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${timeOverBudget ? 'bg-red-400' : 'bg-emerald-500'}`} />
                                    <span className="text-sm text-gray-700">Real registrado</span>
                                </div>
                                <span className={`text-sm font-semibold ${timeOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                                    {formatHours(realHours)}
                                </span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${timeOverBudget ? 'bg-red-400' : 'bg-emerald-500'}`}
                                    style={{ width: `${getVisibleWidth(realHours, (realHours / maxHours) * 100)}%` }}
                                />
                            </div>
                        </div>
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
