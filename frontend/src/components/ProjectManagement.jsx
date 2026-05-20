import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

function ProjectManagement() {

    const { token } = useAuth();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: ''
    });

    const [message, setMessage] = useState('');

    const fetchProjects = async () => {
        try {

            const response = await fetch('http://localhost:3000/api/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);

            if (end < start) {
            setMessage('La fecha límite no puede ser menor a la fecha de inicio');
            return;
            }
        }

        try {

            const response = await fetch('http://localhost:3000/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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

        } catch (error) {

            setMessage('Error de conexión');

        }
    };

    return (
        <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-8">

                <h1 className="text-3xl font-bold text-gray-900">
                    Gestión de proyectos
                </h1>

                <p className="text-gray-500 mt-1">
                    Administra proyectos y fases del sistema
                </p>

            </div>

            {/* Create Project */}
            <div className="bg-white rounded-3xl shadow-sm p-8 mb-8">

                <div className="mb-8">

                    <h2 className="text-xl font-semibold text-gray-900">
                        Crear nuevo proyecto
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Agrega proyectos y organiza tareas por fases
                    </p>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >

                    {/* Nombre */}
                    <div className="md:col-span-2">

                        <label className="block text-[13px] text-gray-700 mb-2">
                            Nombre del proyecto
                        </label>

                        <input
                            type="text"
                            placeholder="Sistema de gestión empresarial"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value
                                })
                            }
                            className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                            required
                        />

                    </div>

                    {/* Descripción */}
                    <div className="md:col-span-2">

                        <label className="block text-[13px] text-gray-700 mb-2">
                            Descripción
                        </label>

                        <textarea
                            placeholder="Describe el objetivo del proyecto..."
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value
                                })
                            }
                            className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0] min-h-[120px]"
                        />

                    </div>

                    {/* Fecha Inicio */}
                    <div>

                        <label className="block text-[13px] text-gray-700 mb-2">
                            Fecha de inicio
                        </label>

                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    startDate: e.target.value
                                })
                            }
                            className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                        />

                    </div>

                    {/* Fecha Fin */}
                    <div>

                        <label className="block text-[13px] text-gray-700 mb-2">
                            Fecha límite
                        </label>

                        <input
                            type="date"
                            value={formData.endDate}
                            min={formData.startDate}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    endDate: e.target.value
                                })
                            }
                            className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                        />

                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        className="md:col-span-2 h-11 rounded-xl bg-[#5B5CF0] hover:bg-[#4c4de0] text-white text-sm font-medium transition"
                    >
                        Crear proyecto
                    </button>

                </form>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`mb-8 rounded-2xl px-5 py-4 text-sm font-medium border
          ${message.includes('Error')
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-green-50 border-green-200 text-green-700'
                        }`}
                >
                    {message}
                </div>
            )}

            {/* Projects List */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">

                <div className="px-8 pt-8 pb-6">

                    <h2 className="text-xl font-semibold text-gray-900">
                        Proyectos registrados
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Lista de proyectos disponibles en TaskFlow
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                        {projects.length} proyectos encontrados
                    </p>

                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        Cargando proyectos...
                    </div>
                ) : projects.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No hay proyectos registrados
                    </div>
                ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 pt-0">

                        {projects.map(project => (

                            <div
                                key={project.id}
                                className="border border-gray-200 rounded-3xl p-6 hover:shadow-md transition"
                            >

                                <div className="flex items-start justify-between mb-4">

                                    <div>

                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {project.name}
                                        </h3>

                                        <p className="text-sm text-gray-500 mt-1">
                                            {project.description || 'Sin descripción'}
                                        </p>

                                    </div>

                                </div>

                                <div className="space-y-2 text-sm text-gray-500">

                                    <p>
                                        <span className="font-medium text-gray-700">
                                            Inicio:
                                        </span>{' '}
                                        {project.startDate
                                            ? project.startDate.split('T')[0]
                                            : '—'}
                                    </p>

                                    <p>
                                        <span className="font-medium text-gray-700">
                                            Fecha límite:
                                        </span>{' '}
                                        {project.endDate
                                            ? project.endDate.split('T')[0]
                                            : '—'}
                                    </p>

                                </div>

                                <div className="mt-5 flex items-center gap-3">

                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                                        {project.phases?.length || 0} fases
                                    </span>

                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                                        {project.members?.length || 0} miembros
                                    </span>

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