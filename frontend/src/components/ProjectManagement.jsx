import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import WorkloadDashboard from './WorkloadDashboard.jsx';
import ConfirmModal from './ui/ConfirmModal.jsx';
import {
    Pencil,
    Trash2,
    BarChart3,
    FolderKanban,
    Clock3,
    CheckCircle2,
    Users
} from 'lucide-react';

const MESSAGE_TYPES = {
    success: 'success',
    error: 'error'
};

function ProjectManagement() {
    const { token } = useAuth();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(MESSAGE_TYPES.success);

    const [editingProject, setEditingProject] = useState(null);
    const [workloadProject, setWorkloadProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: ''
    });

    /* =========================
       FETCH PROJECTS
    ========================= */
    const fetchProjects = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3000/api/projects', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setProjects(data.projects);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage('');
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    /* =========================
       CREATE PROJECT
    ========================= */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.endDate) < new Date(formData.startDate)) {
                setMessage('La fecha límite no puede ser menor a la fecha de inicio');
                return;
            }
        }

        try {
            const response = await fetch('http://localhost:3000/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
                setMessageType(MESSAGE_TYPES.success);

                setFormData({
                    name: '',
                    description: '',
                    startDate: '',
                    endDate: ''
                });

                fetchProjects();
            } else {
                setMessage(data.message);
                setMessageType(MESSAGE_TYPES.error);
            }

        } catch {
            setMessage('Error de conexión');
            setMessageType(MESSAGE_TYPES.error);
        }
    };

    /* =========================
       EDIT
    ========================= */
    const startEdit = (project) => {
        setEditingProject(project);

        setFormData({
            name: project.name,
            description: project.description || '',
            startDate: project.startDate ? project.startDate.split('T')[0] : '',
            endDate: project.endDate ? project.endDate.split('T')[0] : ''
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(
                `http://localhost:3000/api/projects/${editingProject.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                }
            );

            const data = await res.json();

            if (data.success) {
                setMessage(`Proyecto actualizado correctamente`);
                setMessageType(MESSAGE_TYPES.success);
                setEditingProject(null);
                fetchProjects();
            } else {
                setMessage(data.message);
                setMessageType(MESSAGE_TYPES.error);
            }

        } catch {
            setMessage('Error de conexión');
            setMessageType(MESSAGE_TYPES.error);
        }
    };

    /* =========================
       DELETE
    ========================= */
    const handleDelete = async () => {

        if (!projectToDelete) return;

        try {

            const res = await fetch(
                `http://localhost:3000/api/projects/${projectToDelete.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (res.ok) {
                setMessage('Proyecto eliminado');
                setMessageType(MESSAGE_TYPES.success);
                fetchProjects();
            } else {
                setMessage('Error al eliminar');
                setMessageType(MESSAGE_TYPES.error);
            }

        } catch {
            setMessage('Error de conexión');
            setMessageType(MESSAGE_TYPES.error);
        } finally {
            setProjectToDelete(null);
        }
    };
    const getProjectStatus = (project) => {

        if (!project.endDate) {
            return {
                label: 'Sin fecha',
                className: 'bg-gray-100 text-gray-600'
            };
        }

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const endDate = new Date(project.endDate);

        const diffDays = Math.ceil(
            (endDate - today) / (1000 * 60 * 60 * 24)
        );

        if (diffDays < 0) {
            return {
                label: 'Finalizado',
                className: 'bg-red-100 text-red-600'
            };
        }

        if (diffDays <= 7) {
            return {
                label: 'Por vencer',
                className: 'bg-yellow-100 text-yellow-700'
            };
        }

        return {
            label: 'Activo',
            className: 'bg-green-100 text-green-700'
        };
    };

    const activeProjects = projects.filter(
        project => getProjectStatus(project).label === 'Activo'
    ).length;

    const expiringProjects = projects.filter(
        project => getProjectStatus(project).label === 'Por vencer'
    ).length;

    const finishedProjects = projects.filter(
        project => getProjectStatus(project).label === 'Finalizado'
    ).length;

    const totalMembers = projects.reduce(
        (total, project) => total + (project.members?.length || 0),
        0
    );

    /* =========================
       UI
    ========================= */
    return (
        <div className="max-w-7xl mx-auto">

            {message && (
                <div
                    className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2
            ${messageType === MESSAGE_TYPES.error
                            ? 'bg-red-500 text-white'
                            : 'bg-[#5B5CF0] text-white'
                        }
        `}
                >
                    {message}
                </div>
            )}

            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Gestión de proyectos
                </h1>
                <p className="text-gray-500 mt-1">
                    Administra proyectos del sistema
                </p>
            </div>

            {/* METRICS */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

                <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-100">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Activos
                            </p>

                            <h3 className="text-3xl font-bold text-green-600 mt-2">
                                {activeProjects}
                            </h3>
                        </div>

                        <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                            <FolderKanban
                                size={22}
                                className="text-green-600"
                            />
                        </div>

                    </div>

                </div>

                <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-100">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Por vencer
                            </p>

                            <h3 className="text-3xl font-bold text-yellow-600 mt-2">
                                {expiringProjects}
                            </h3>
                        </div>

                        <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center">
                            <Clock3
                                size={22}
                                className="text-yellow-600"
                            />
                        </div>

                    </div>

                </div>

                <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-100">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Finalizados
                            </p>

                            <h3 className="text-3xl font-bold text-red-600 mt-2">
                                {finishedProjects}
                            </h3>
                        </div>

                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                            <CheckCircle2
                                size={22}
                                className="text-red-600"
                            />
                        </div>

                    </div>

                </div>

                <div className="bg-white rounded-3xl shadow-sm p-5 border border-gray-100">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Miembros
                            </p>

                            <h3 className="text-3xl font-bold text-[#5B5CF0] mt-2">
                                {totalMembers}
                            </h3>
                        </div>

                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                            <Users
                                size={22}
                                className="text-[#5B5CF0]"
                            />
                        </div>

                    </div>

                </div>

            </div>

            {/* CREATE */}
            <div className="bg-white rounded-3xl shadow-sm p-8 mb-8">

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                    <input
                        className="h-11 px-4 rounded-xl bg-gray-100"
                        placeholder="Nombre"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                    />

                    <textarea
                        className="md:col-span-2 px-4 py-3 rounded-xl bg-gray-100"
                        placeholder="Descripción"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                    />

                    <input
                        type="date"
                        className="h-11 px-4 rounded-xl bg-gray-100"
                        value={formData.startDate}
                        onChange={(e) =>
                            setFormData({ ...formData, startDate: e.target.value })
                        }
                    />

                    <input
                        type="date"
                        className="h-11 px-4 rounded-xl bg-gray-100"
                        value={formData.endDate}
                        onChange={(e) =>
                            setFormData({ ...formData, endDate: e.target.value })
                        }
                    />

                    <div className="md:col-span-2 flex justify-end">
                        <button
                            type="submit"
                            className="h-11 px-6 rounded-xl bg-[#5B5CF0] hover:bg-[#4c4de0] text-white text-sm font-medium transition"
                        >
                            Crear proyecto
                        </button>
                    </div>
                </form>
            </div>



            {workloadProject && (
                <WorkloadDashboard
                    project={workloadProject}
                    onClose={() => setWorkloadProject(null)}
                />
            )}

            {/* LIST */}
            <div className="bg-white rounded-3xl shadow-sm p-8">

                <h2 className="text-lg font-semibold mb-6">
                    Proyectos ({projects.length})
                </h2>

                {loading ? (
                    <p className="text-gray-500">Cargando...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {projects.map((project) => {

                            const status = getProjectStatus(project);

                            return (
                                <div
                                    key={project.id}
                                    className="border border-gray-200 rounded-3xl p-6 hover:border-[#5B5CF0] hover:shadow-md transition"
                                >
                                    <div className="flex items-start justify-between gap-3">

                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {project.name}
                                        </h3>

                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
            ${status.className}
        `}
                                        >
                                            {status.label}
                                        </span>

                                    </div>

                                    <p className="text-sm text-gray-500 mt-1">
                                        {project.description || 'Sin descripción'}
                                    </p>

                                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">

                                        <span>
                                            {project.startDate?.split('T')[0]}
                                        </span>

                                        <span>
                                            →
                                        </span>

                                        <span>
                                            {project.endDate?.split('T')[0]}
                                        </span>

                                    </div>

                                    <div className="flex items-center justify-between mt-5">

                                        <button
                                            onClick={() => setWorkloadProject(project)}
                                            className="h-10 px-4 rounded-xl bg-[#5B5CF0] hover:bg-[#4c4de0] text-white text-sm flex items-center gap-2"
                                        >
                                            <BarChart3 size={16} />
                                            Carga laboral
                                        </button>

                                        <div className="flex items-center gap-2">

                                            <button
                                                onClick={() => startEdit(project)}
                                                className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition"
                                                title="Editar"
                                            >
                                                <Pencil size={18} />
                                            </button>

                                            <button
                                                onClick={() => setProjectToDelete(project)}
                                                className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                        </div>

                                    </div>
                                </div>
                            );
                        })}

                    </div>
                )}

            </div>
            {editingProject && (

                <div className="fixed inset-0 z-50 flex items-center justify-center">

                    {/* Backdrop */}
                    <button
    type="button"
    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
    onClick={() => setEditingProject(null)}
    aria-label="Cerrar modal"
/>

                    {/* Modal */}
                    <div className="relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-xl">

                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                            Editar proyecto
                        </h2>

                        <form
                            onSubmit={handleUpdate}
                            className="grid grid-cols-1 md:grid-cols-2 gap-5"
                        >

                            <input
                                className="h-11 px-4 rounded-xl bg-gray-100"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value
                                    })
                                }
                            />

                            <textarea
                                className="md:col-span-2 px-4 py-3 rounded-xl bg-gray-100 min-h-[120px]"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value
                                    })
                                }
                            />

                            <input
                                type="date"
                                className="h-11 px-4 rounded-xl bg-gray-100"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        startDate: e.target.value
                                    })
                                }
                            />

                            <input
                                type="date"
                                className="h-11 px-4 rounded-xl bg-gray-100"
                                value={formData.endDate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        endDate: e.target.value
                                    })
                                }
                            />

                            <div className="md:col-span-2 flex justify-end gap-3">

                                <button
                                    type="button"
                                    onClick={() => setEditingProject(null)}
                                    className="h-11 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="h-11 px-6 rounded-xl bg-[#5B5CF0] hover:bg-[#4c4de0] text-white text-sm font-medium"
                                >
                                    Guardar cambios
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}
            <ConfirmModal
                isOpen={!!projectToDelete}
                title="Eliminar proyecto"
                message={
                    projectToDelete
                        ? `¿Deseas eliminar "${projectToDelete.name}"?`
                        : ''
                }
                confirmText="Eliminar"
                cancelText="Cancelar"
                danger
                onConfirm={() => {
                    void handleDelete();
                }}
                onCancel={() => setProjectToDelete(null)}
            />
        </div>
    );
}

export default ProjectManagement;
