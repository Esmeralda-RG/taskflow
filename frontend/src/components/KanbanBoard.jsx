import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import TaskForm from './TaskForm.jsx';
import { CustomDropdown } from './CustomDropdown.jsx';
import ProjectSummaryDashboard from './ProjectSummaryDashboard.jsx';
import { Clock, Calendar, Pencil, Trash2, Save, X } from 'lucide-react';
import ConfirmModal from './ui/ConfirmModal.jsx';

const DEFAULT_PHASE_NAMES = new Set(['Por hacer', 'En proceso', 'Finalizado']);

function getInitials(name = '') {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (parts[0] || '?').slice(0, 2).toUpperCase();
}

function KanbanBoard() {
    const { token, user } = useAuth();

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [showPhaseForm, setShowPhaseForm] = useState(false);
    const [phaseName, setPhaseName] = useState('');
    const [phaseTargetPosition, setPhaseTargetPosition] = useState('last');
    const [phaseMessage, setPhaseMessage] = useState('');
    const [phaseError, setPhaseError] = useState('');
    const [savingPhase, setSavingPhase] = useState(false);
    const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
    const [draggingTaskId, setDraggingTaskId] = useState(null);
    const [dragOverPhaseId, setDragOverPhaseId] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [editingPhaseId, setEditingPhaseId] = useState(null);
    const [editingPhaseName, setEditingPhaseName] = useState('');
    const [savingPhaseEdit, setSavingPhaseEdit] = useState(false);
    const [phaseToDelete, setPhaseToDelete] = useState(null);
    const [deletingPhase, setDeletingPhase] = useState(false);

    useEffect(() => {
        if (!phaseMessage && !phaseError) return;
        const t = setTimeout(() => { setPhaseMessage(''); setPhaseError(''); }, 3000);
        return () => clearTimeout(t);
    }, [phaseMessage, phaseError]);

    const canAddPhase = ['ADMIN', 'LEADER'].includes(user?.role);
    const phases = [...(selectedProject?.phases || [])].sort(
        (a, b) => a.order - b.order
    );

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch(
                'http://localhost:3000/api/projects',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await res.json();

            if (data.success) {
                setProjects(data.projects);
            }
        } catch (error) {
            console.error(error);
        }
    }, [token]);

    const fetchProjectData = useCallback(async (projectId) => {
        try {
            const tasksRes = await fetch(
                `http://localhost:3000/api/tasks/project/${projectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const tasksData = await tasksRes.json();

            if (tasksData.success) {
                setTasks(tasksData.tasks);
            }
        } catch (error) {
            console.error(error);
        }
    }, [token]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleProjectSelect = (project) => {
        setSelectedProject(project);

        if (project) {
            fetchProjectData(project.id);
        }
    };

    const handleTaskCreated = () => {
        if (selectedProject) {
            fetchProjectData(selectedProject.id);
            setSummaryRefreshKey((currentKey) => currentKey + 1);
        }

        setShowTaskForm(false);
        setTaskToEdit(null);
    };

    const handleTaskChanged = () => {
        if (selectedProject) {
            fetchProjectData(selectedProject.id);
            setSummaryRefreshKey((currentKey) => currentKey + 1);
        }
    };

    const handlePhaseCreated = async (e) => {
        e.preventDefault();

        if (!selectedProject) return;

        const name = phaseName.trim();

        if (!name) {
            setPhaseError('El nombre de la fase es requerido');
            setPhaseMessage('');
            return;
        }

        let calculatedOrder;
        const currentPhases = selectedProject.phases || [];

        if (phaseTargetPosition === 'first') {
            calculatedOrder = 1;
        } else if (phaseTargetPosition === 'last') {
            calculatedOrder = currentPhases.length + 1;
        } else if (phaseTargetPosition.startsWith('after-')) {
            const targetPhaseId = phaseTargetPosition.replace('after-', '');
            const targetPhase = currentPhases.find(p => p.id === targetPhaseId);
            calculatedOrder = targetPhase ? targetPhase.order + 1 : currentPhases.length + 1;
        }

        try {
            setSavingPhase(true);
            setPhaseError('');
            setPhaseMessage('');

            const res = await fetch(
                `http://localhost:3000/api/projects/${selectedProject.id}/phases`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name,
                        order: calculatedOrder 
                    })
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                setPhaseError(data.message || 'No se pudo agregar la fase');
                return;
            }

            const reorderedPhases = currentPhases.map((phase) =>
                phase.order >= data.phase.order
                    ? { ...phase, order: phase.order + 1 }
                    : phase
            );

            const updatedProject = {
                ...selectedProject,
                phases: [...reorderedPhases, data.phase].sort(
                    (a, b) => a.order - b.order
                )
            };

            setSelectedProject(updatedProject);
            setProjects((currentProjects) =>
                currentProjects.map((project) =>
                    project.id === updatedProject.id ? updatedProject : project
                )
            );

            setPhaseName('');
            setPhaseTargetPosition('last'); 
            setShowPhaseForm(false);
            setPhaseMessage(data.message);
            setSummaryRefreshKey((currentKey) => currentKey + 1);
        } catch (error) {
            console.error(error);
            setPhaseError('Error al agregar la fase personalizada');
        } finally {
            setSavingPhase(false);
        }
    };
    const handlePhaseUpdate = async () => {
        if (!editingPhaseId || !editingPhaseName.trim() || !selectedProject) return;

        try {
            setSavingPhaseEdit(true);
            const res = await fetch(
                `http://localhost:3000/api/projects/${selectedProject.id}/phases/${editingPhaseId}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: editingPhaseName.trim() })
                }
            );
            const data = await res.json();

            if (!res.ok || !data.success) {
                setPhaseError(data.message || 'No se pudo renombrar la fase');
                return;
            }

            const updatedProject = {
                ...selectedProject,
                phases: selectedProject.phases.map((p) =>
                    p.id === editingPhaseId ? { ...p, name: data.phase.name } : p
                )
            };
            setSelectedProject(updatedProject);
            setProjects((prev) => prev.map((p) => p.id === updatedProject.id ? updatedProject : p));
            setPhaseMessage(data.message);
        } catch {
            setPhaseError('Error de conexión');
        } finally {
            setSavingPhaseEdit(false);
            setEditingPhaseId(null);
            setEditingPhaseName('');
        }
    };

    const handlePhaseDelete = async () => {
        if (!phaseToDelete || !selectedProject) return;

        try {
            setDeletingPhase(true);
            const res = await fetch(
                `http://localhost:3000/api/projects/${selectedProject.id}/phases/${phaseToDelete.id}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const data = await res.json();

            if (!res.ok || !data.success) {
                setPhaseError(data.message || 'No se pudo eliminar la fase');
                return;
            }

            const updatedProject = {
                ...selectedProject,
                phases: selectedProject.phases.filter((p) => p.id !== phaseToDelete.id)
            };
            setSelectedProject(updatedProject);
            setProjects((prev) => prev.map((p) => p.id === updatedProject.id ? updatedProject : p));
            setTasks((prev) => prev.filter((t) => t.phase?.id !== phaseToDelete.id));
            setPhaseMessage(data.message);
            setSummaryRefreshKey((k) => k + 1);
        } catch {
            setPhaseError('Error de conexión');
        } finally {
            setDeletingPhase(false);
            setPhaseToDelete(null);
        }
    };

    const moveTask = async (taskId, newPhaseId) => {
        const phase = phases.find((p) => p.id === newPhaseId);
        const task = tasks.find((currentTask) => currentTask.id === taskId);

        if (!phase || task?.phase?.id === newPhaseId) return;

        try {
            const res = await fetch(
                `http://localhost:3000/api/tasks/${taskId}/phase`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        phaseId: phase.id
                    })
                }
            );

            if (res.ok) {
                fetchProjectData(selectedProject.id);
                setSummaryRefreshKey((currentKey) => currentKey + 1);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleTaskDrop = (phaseId) => {
        if (!draggingTaskId) return;

        moveTask(draggingTaskId, phaseId);
        setDraggingTaskId(null);
        setDragOverPhaseId(null);
    };

    return (
        <div className="max-w-7xl mx-auto">

            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Tablero Kanban
                </h1>

                <p className="text-gray-500 mt-1">
                    Gestiona tareas y seguimiento de los proyectos
                </p>
            </div>

            {/* CABECERA DEL PROYECTO (CON DROPDOWN PERSONALIZADO) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 mt-4">
                <div>
                    <div className="relative inline-block text-left">
                        {/* BOTÓN DISPARADOR (SIMULA EL TÍTULO) */}
                        <button
                            type="button"
                            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                            className="flex items-center gap-2 text-2xl font-bold text-[#5B5CF0] hover:text-[#4A4BDB] focus:outline-none transition-colors group"
                        >
                            <span>{selectedProject?.name || 'Seleccionar proyecto...'}</span>

                            {/* Flecha estilizada que rota cuando el menú está abierto */}
                            <svg
                                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isProjectDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* MENÚ DESPLEGABLE PERSONALIZADO */}
                        {isProjectDropdownOpen && (
                            <>
                                {/* Capa invisible para cerrar el menú si se hace clic afuera */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsProjectDropdownOpen(false)}
                                />

                                {/* Contenedor de las opciones fluyendo sobre el contenido */}
                                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                                    {projects.length === 0 ? (
                                        <div className="px-4 py-2 text-sm text-gray-400 italic">No hay proyectos</div>
                                    ) : (
                                        projects.map((project) => (
                                            <button
                                                key={project.id}
                                                type="button"
                                                onClick={() => {
                                                    handleProjectSelect(project);
                                                    setIsProjectDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedProject?.id === project.id
                                                        ? 'bg-indigo-50 text-[#5B5CF0]'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {project.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                {selectedProject && (
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => setShowSummary(!showSummary)}
                            className="h-11 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                        >
                            {showSummary ? 'Ocultar análisis' : 'Ver análisis'}
                        </button>

                        {/* 🆕 NUEVO BOTÓN PARA CREAR FASES (Movido aquí) */}
                        {canAddPhase && (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPhaseForm(true);
                                    setPhaseError('');
                                    setPhaseMessage('');
                                    setPhaseTargetPosition('last');
                                }}
                                className="h-11 px-5 rounded-xl bg-[#eef0ff] hover:bg-[#dfe3ff] text-[#5B5CF0] font-medium transition-colors"
                            >
                                + Nueva fase
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setTaskToEdit(null);
                                setShowTaskForm(true);
                            }}
                            className="h-11 px-5 rounded-xl bg-[#5B5CF0] hover:bg-[#4A4BDB] text-white font-medium transition-colors"
                        >
                            + Nueva tarea
                        </button>
                    </div>
                )}
            </div>

            {(phaseMessage || phaseError) && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${phaseError ? 'bg-red-500 text-white' : 'bg-[#5B5CF0] text-white'}`}>
                    {phaseError || phaseMessage}
                </div>
            )}

            {showSummary && (
                <ProjectSummaryDashboard
                    project={selectedProject}
                    refreshKey={summaryRefreshKey}
                />
            )}


            {/* TABLERO */}
            <div
                className="kanban-phases-grid grid gap-6 overflow-x-auto"
                style={{ '--phase-count': phases.length }} 
            >
                {phases.map((phase) => {
                    const phaseTasks = tasks.filter((task) => task.phase?.id === phase.id);
                    return (
                        <section
                            key={phase.id}
                            aria-label={`Fase ${phase.name}`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverPhaseId(phase.id);
                            }}
                            onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                    setDragOverPhaseId(null);
                                }
                            }}
                            onDrop={() => handleTaskDrop(phase.id)}
                            className={`bg-white rounded-3xl shadow-sm border border-gray-100 p-5 transition ${dragOverPhaseId === phase.id
                                ? 'border-[#5B5CF0] ring-2 ring-[#5B5CF0]/20'
                                : 'border-gray-200'
                                }`}
                        >

                            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-200">
                                {/* Nombre o input de edición */}
                                {editingPhaseId === phase.id ? (
                                    <input
                                        value={editingPhaseName}
                                        onChange={(e) => setEditingPhaseName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handlePhaseUpdate();
                                            if (e.key === 'Escape') setEditingPhaseId(null);
                                        }}
                                        autoFocus
                                        className="flex-1 min-w-0 h-7 px-2 rounded-lg border border-[#5B5CF0] text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#5B5CF0] bg-white"
                                    />
                                ) : (
                                    <h3 className="font-semibold text-gray-900 truncate flex-1 min-w-0">
                                        {phase.name}
                                    </h3>
                                )}

                                {/* Controles */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <span className="min-w-7 h-7 px-2 inline-flex items-center justify-center rounded-full bg-[#eef0ff] text-xs font-semibold text-[#5B5CF0]">
                                        {phaseTasks.length}
                                    </span>

                                    {canAddPhase && !DEFAULT_PHASE_NAMES.has(phase.name) && (
                                        editingPhaseId === phase.id ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={handlePhaseUpdate}
                                                    disabled={savingPhaseEdit}
                                                    title="Guardar nombre"
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 transition disabled:opacity-50"
                                                >
                                                    <Save size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingPhaseId(null)}
                                                    title="Cancelar"
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingPhaseId(phase.id);
                                                        setEditingPhaseName(phase.name);
                                                    }}
                                                    title="Editar nombre"
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#5B5CF0] hover:bg-[#eef0ff] transition"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPhaseToDelete(phase)}
                                                    title="Eliminar fase"
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">

                                {phaseTasks.length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-sm">
                                        No hay tareas
                                    </div>
                                )}

                                {phaseTasks.map((task) => {
                                    const isOverdue = task.isOverdue;

                                    return (
                                        <article
                                            key={task.id}
                                            draggable
                                            aria-label={task.title}
                                            onDragStart={(e) => {
                                                setDraggingTaskId(task.id);
                                                e.dataTransfer.effectAllowed = 'move';
                                                e.dataTransfer.setData('text/plain', task.id);
                                            }}
                                            onDragEnd={() => {
                                                setDraggingTaskId(null);
                                                setDragOverPhaseId(null);
                                            }}
                                            className={`bg-white border rounded-2xl p-4 cursor-grab active:cursor-grabbing transition shadow-sm ${draggingTaskId === task.id
                                                ? 'opacity-60 ring-2 ring-[#5B5CF0]/30 border-[#5B5CF0]/40'
                                                : 'border-gray-100 hover:border-[#5B5CF0]/40 hover:shadow-md'
                                                }`}
                                        >
                                            {/* Título y descripción */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTaskToEdit(task);
                                                    setShowTaskForm(true);
                                                }}
                                                className="block w-full text-left"
                                            >
                                                <h4 className="font-semibold text-gray-900 leading-snug">
                                                    {task.title}
                                                </h4>

                                                {task.description && (
                                                    <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </button>

                                            {/* Metadatos: fechas y horas */}
                                            {(task.endDate || task.estimatedHours > 0) && (
                                                <div className="flex items-center gap-3 mt-3">
                                                    {task.estimatedHours > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                                            <Clock size={11} />
                                                            {task.estimatedHours}h
                                                        </span>
                                                    )}
                                                    {task.endDate && (
                                                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                                            <Calendar size={11} />
                                                            {task.endDate.split('T')[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Separador */}
                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                                {/* Avatar del responsable */}
                                                {task.assignee ? (
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div
                                                            className="w-6 h-6 rounded-full bg-[#5B5CF0] flex items-center justify-center text-white text-[9px] font-bold shrink-0 ring-2 ring-white shadow-sm"
                                                            title={task.assignee.name}
                                                        >
                                                            {getInitials(task.assignee.name)}
                                                        </div>
                                                        <span className="text-xs text-gray-600 truncate">
                                                            {task.assignee.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-300 italic">
                                                        Sin asignar
                                                    </span>
                                                )}

                                                {/* Badge de vencida */}
                                                {isOverdue && (
                                                    <span className="shrink-0 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded-full">
                                                        Vencida
                                                    </span>
                                                )}
                                            </div>
                                        </article>
                                    );
                                }
                                )}
                            </div>

                        </section>
                    );
                })}

            </div>


            {/* CONFIRM ELIMINAR FASE */}
            <ConfirmModal
                isOpen={!!phaseToDelete}
                title="Eliminar fase"
                message={
                    phaseToDelete
                        ? `¿Deseas eliminar la fase "${phaseToDelete.name}"? ${
                              tasks.filter((t) => t.phase?.id === phaseToDelete.id).length > 0
                                  ? `Las ${tasks.filter((t) => t.phase?.id === phaseToDelete.id).length} tarea(s) dentro también serán eliminadas.`
                                  : 'No tiene tareas asignadas.'
                          }`
                        : ''
                }
                confirmText={deletingPhase ? 'Eliminando...' : 'Eliminar'}
                cancelText="Cancelar"
                danger
                onConfirm={handlePhaseDelete}
                onCancel={() => setPhaseToDelete(null)}
            />

            {/* MODAL NUEVA FASE REFACTORIZADO */}
            {showPhaseForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <button
                        type="button"
                        aria-label="Cerrar modal"
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowPhaseForm(false)}
                    />

                    <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <h2 className="text-xl font-semibold mb-5 text-gray-900">
                            Nueva fase
                        </h2>

                        <form onSubmit={handlePhaseCreated} className="space-y-5">
                            {/* Nombre de la fase */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Nombre de la fase
                                </label>
                                <input
                                    value={phaseName}
                                    onChange={(e) => setPhaseName(e.target.value)}
                                    placeholder="Ej. Por revisar, QA, Despliegue..."
                                    className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5B5CF0] focus:bg-white transition-all text-sm"
                                    required
                                />
                            </div>

                            {/* Dentro del modal de Nueva Fase, reemplaza el select viejo por esto: */}
<div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Ubicación en el tablero
    </label>
    <CustomDropdown
        value={phaseTargetPosition}
        onChange={(val) => setPhaseTargetPosition(val)}
        options={[
            { value: 'first', label: 'Al inicio (Primera columna)' },
            { value: 'last', label: 'Al final (Última columna)' },
            ...phases.map((p) => ({
                value: `after-${p.id}`,
                label: `Después de: ${p.name}`
            }))
        ]}
    />
</div>

                            {/* Botón Submit */}
                            <button
                                type="submit"
                                disabled={savingPhase}
                                className="w-full h-11 rounded-xl bg-[#5B5CF0] hover:bg-[#4A4BDB] text-white font-medium shadow-sm transition-colors disabled:opacity-50 mt-2"
                            >
                                {savingPhase ? 'Guardando...' : 'Crear fase'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* MODAL */}
            {showTaskForm && selectedProject && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4">

                    <div
                        className={`w-full max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl ${taskToEdit ? 'max-w-5xl' : 'max-w-2xl'
                            }`}
                    >

                        <TaskForm
                            projectId={selectedProject.id}
                            phaseId={
                                taskToEdit?.phaseId ||
                                selectedProject.phases?.find(
                                    (p) => p.name === 'Por hacer'
                                )?.id
                            }
                            phases={phases}
                            taskToEdit={taskToEdit}
                            onTaskCreated={handleTaskCreated}
                            onTaskChanged={handleTaskChanged}
                            onPhaseChanged={handleTaskChanged}
                            onCancel={() => {
                                setShowTaskForm(false);
                                setTaskToEdit(null);
                            }}
                        />

                    </div>

                </div>
            )}
        </div>
    );
}

export default KanbanBoard;
