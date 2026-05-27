import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const MESSAGE_TYPES = {
    success: 'success',
    error: 'error'
};

const API_BASE_URL = 'http://localhost:3000/api';

const createAuthHeaders = (token, extraHeaders = {}) => ({
    ...extraHeaders,
    Authorization: `Bearer ${token}`
});

function ProjectMemberManagement() {
    const { token } = useAuth();

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

    const [members, setMembers] = useState([]);
    const [users, setUsers] = useState([]);

    const [selectedUserId, setSelectedUserId] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(MESSAGE_TYPES.success);

    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(false);

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects`, {
                headers: createAuthHeaders(token)
            });

            const data = await res.json();
            if (data.success) setProjects(data.projects);

        } catch {
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    }, [token]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                headers: createAuthHeaders(token)
            });

            const data = await res.json();
            if (data.success) setUsers(data.users);

        } catch {
            setUsers([]);
        }
    }, [token]);

    const fetchMembers = useCallback(async (projectId) => {
        setLoadingMembers(true);

        try {
            const res = await fetch(
                `${API_BASE_URL}/project-members/${projectId}`,
                {
                    headers: createAuthHeaders(token)
                }
            );

            const data = await res.json();
            if (data.success) setMembers(data.members);

        } catch {
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    }, [token]);

    useEffect(() => {
        void fetchProjects();
        void fetchUsers();
    }, [fetchProjects, fetchUsers]);

    const handleProjectSelect = async (project) => {
        setMessage('');
        setSelectedUserId('');
        setSelectedProject(project);
        await fetchMembers(project.id);
    };

    const handleAddMember = async () => {
        if (!selectedProject || !selectedUserId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/project-members`, {
                method: 'POST',
                headers: createAuthHeaders(token, {
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    projectId: selectedProject.id,
                    userId: selectedUserId
                })
            });

            const data = await res.json();

            if (data.success) {
                setMessage('Usuario asignado correctamente');
                setMessageType(MESSAGE_TYPES.success);
                await fetchMembers(selectedProject.id);
                setSelectedUserId('');
            } else {
                setMessage(data.message || 'Error al asignar usuario');
                setMessageType(MESSAGE_TYPES.error);
            }

        } catch {
            setMessage('Error de conexión');
            setMessageType(MESSAGE_TYPES.error);
        }
    };

    const handleRemoveMember = async (userId, userName) => {
        if (!selectedProject) return;

        const confirmRemove = globalThis.confirm(
            `¿Retirar a ${userName} del proyecto?`
        );

        if (!confirmRemove) return;

        try {
            const res = await fetch(
                `${API_BASE_URL}/project-members/${selectedProject.id}/${userId}`,
                {
                    method: 'DELETE',
                    headers: createAuthHeaders(token)
                }
            );

            if (res.ok) {
                setMessage(`${userName} removido del proyecto`);
                setMessageType(MESSAGE_TYPES.success);
                await fetchMembers(selectedProject.id);
            } else {
                setMessage('Error al remover miembro');
                setMessageType(MESSAGE_TYPES.error);
            }

        } catch {
            setMessage('Error de conexión');
            setMessageType(MESSAGE_TYPES.error);
        }
    };

    const renderProjects = () => {
        if (loadingProjects) {
            return (
                <p className="text-gray-500 text-sm">
                    Cargando proyectos...
                </p>
            );
        }

        if (projects.length === 0) {
            return (
                <p className="text-gray-400 text-sm">
                    No hay proyectos disponibles
                </p>
            );
        }

        return (
            <div className="space-y-3">
                {projects.map((project) => {
                    const isSelected = selectedProject?.id === project.id;

                    return (
                        <button
                            type="button"
                            key={project.id}
                            onClick={() => {
                                void handleProjectSelect(project);
                            }}
                            className={`block w-full text-left p-4 rounded-2xl cursor-pointer border transition
                                ${isSelected
                                    ? 'bg-[#5B5CF0] text-white border-transparent'
                                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                                }`}
                        >
                            <span className="block font-semibold">
                                {project.name}
                            </span>

                            <span className={`block text-sm mt-1 ${isSelected
                                ? 'text-white/80'
                                : 'text-gray-500'
                                }`}>
                                {project.description || 'Sin descripción'}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderMembers = () => {
        if (loadingMembers) {
            return (
                <p className="text-gray-500 text-sm">
                    Cargando miembros...
                </p>
            );
        }

        if (members.length === 0) {
            return (
                <p className="text-gray-400 text-sm">
                    Aún no hay miembros asignados
                </p>
            );
        }

        return (
            <div className="space-y-2">
                {members.map((m) => (
                    <div
                        key={m.id}
                        className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-200"
                    >
                        <div>
                            <p className="font-medium text-gray-900">
                                {m.user.name}
                            </p>

                            <p className="text-sm text-gray-500">
                                {m.user.email} • {m.user.role}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                void handleRemoveMember(m.user.id, m.user.name);
                            }}
                            className="text-red-500 hover:text-red-600 text-sm font-medium"
                        >
                            Retirar
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">

            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Asignación de miembros
                </h1>
                <p className="text-gray-500 mt-1">
                    Gestiona usuarios dentro de cada proyecto
                </p>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* PROJECT LIST*/}
                <div className="bg-white rounded-3xl shadow-sm p-6">

                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Proyectos
                    </h2>

                    {renderProjects()}
                </div>

                {/* ASSIGN PANEL */}
                <div className="bg-white rounded-3xl shadow-sm p-6">

                    {selectedProject ? (
                        <>
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                Asignar miembros a:{' '}
                                <span className="text-[#5B5CF0] ml-2">
                                    {selectedProject.name}
                                </span>
                            </h2>

                            <div className="flex gap-3 mb-6">

                                <select
                                    value={selectedUserId}
                                    aria-label="Seleccionar usuario"
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="flex-1 h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                                >
                                    <option value="">
                                        Seleccionar usuario...
                                    </option>

                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.role})
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleAddMember();
                                    }}
                                    disabled={!selectedUserId}
                                    className="px-6 h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
                                >
                                    Asignar
                                </button>
                            </div>

                            {/* MESSAGE */}
                            {message && (
                                <div className={`mb-5 text-sm font-medium px-4 py-3 rounded-2xl
                                    ${messageType === MESSAGE_TYPES.success
                                        ? 'bg-green-50 text-green-600 border border-green-200'
                                        : 'bg-red-50 text-red-600 border border-red-200'
                                    }`}
                                >
                                    {message}
                                </div>
                            )}

                            {/* MEMBERS */}
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                Miembros actuales
                            </h3>

                            {renderMembers()}
                        </>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            Selecciona un proyecto para asignar miembros
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProjectMemberManagement;
