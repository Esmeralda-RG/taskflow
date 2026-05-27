import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

function ProjectManagement() {
    const { token } = useAuth();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState('');

    const [editingProject, setEditingProject] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: ''
    });

    /* =========================
       FETCH PROJECTS
    ========================= */
    const fetchProjects = async () => {
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
    };

    useEffect(() => {
        fetchProjects();
    }, [token]);

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

                setFormData({
                    name: '',
                    description: '',
                    startDate: '',
                    endDate: ''
                });

                fetchProjects();
            } else {
                setMessage(data.message);
            }

        } catch {
            setMessage('Error de conexión');
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
                setEditingProject(null);
                fetchProjects();
            } else {
                setMessage(data.message);
            }

        } catch {
            setMessage('Error de conexión');
        }
    };

    /* =========================
       DELETE
    ========================= */
    const handleDelete = async (id, name) => {
        if (!globalThis.confirm(`¿Eliminar "${name}"?`)) return;

        try {
            const res = await fetch(
                `http://localhost:3000/api/projects/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (res.ok) {
                setMessage(`Proyecto eliminado`);
                fetchProjects();
            } else {
                setMessage('Error al eliminar');
            }

        } catch {
            setMessage('Error de conexión');
        }
    };

    /* =========================
       UI
    ========================= */
    return (
        <div className="max-w-7xl mx-auto">

            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Gestión de proyectos
                </h1>
                <p className="text-gray-500 mt-1">
                    Administra proyectos del sistema
                </p>
            </div>



            {/* CREATE */}
            <div className="bg-white rounded-3xl shadow-sm p-8 mb-8">

                <h2 className="text-lg font-semibold mb-6">
                    Crear proyecto
                </h2>

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

                    <button
                        type="submit"
                        className="md:col-span-2 h-11 rounded-xl bg-[#5B5CF0] text-white"
                    >
                        Crear proyecto
                    </button>
                </form>
            </div>

            {/* MESSAGE */}
            {message && (
                <div className="mb-6 px-4 py-3 rounded-2xl bg-gray-100 text-sm text-gray-700">
                    {message}
                </div>
            )}
            {/* EDIT MODAL (INLINE) */}
            {editingProject && (
                <div className="bg-white rounded-3xl shadow-sm p-8 mb-8 border border-[#5B5CF0]">

                    <h2 className="text-lg font-semibold mb-6 text-gray-900">
                        Editando: {editingProject.name}
                    </h2>

                    <form
                        onSubmit={handleUpdate}
                        className="grid grid-cols-1 md:grid-cols-2 gap-5"
                    >
                        <input
                            className="h-11 px-4 rounded-xl bg-gray-100"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                        />

                        <textarea
                            className="md:col-span-2 px-4 py-3 rounded-xl bg-gray-100 min-h-[100px]"
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

                        <button
                            type="submit"
                            className="md:col-span-2 h-11 rounded-xl bg-[#5B5CF0] text-white"
                        >
                            Guardar cambios
                        </button>

                        <button
                            type="button"
                            onClick={() => setEditingProject(null)}
                            className="md:col-span-2 h-11 rounded-xl bg-gray-200"
                        >
                            Cancelar
                        </button>
                    </form>
                </div>
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

                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="border border-gray-200 rounded-3xl p-6"
                            >
                                <h3 className="font-semibold text-lg">
                                    {project.name}
                                </h3>

                                <p className="text-sm text-gray-500 mt-1">
                                    {project.description}
                                </p>

                                <div className="text-xs text-gray-400 mt-3">
                                    {project.startDate?.split('T')[0]} → {project.endDate?.split('T')[0]}
                                </div>

                                <div className="flex gap-3 mt-5">
                                    <button
                                        onClick={() => startEdit(project)}
                                        className="flex-1 h-10 rounded-xl bg-blue-500 text-white text-sm"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        onClick={() => handleDelete(project.id, project.name)}
                                        className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}

                    </div>
                )}

            </div>
        </div>
    );
}

export default ProjectManagement;
