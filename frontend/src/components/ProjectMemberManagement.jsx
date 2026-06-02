import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import ConfirmModal from './ui/ConfirmModal.jsx';
import {
    FolderKanban,
    Trash2
} from 'lucide-react';

const MESSAGE_TYPES = {
    success: 'success',
    error: 'error'
};

const roleLabels = {
    ADMIN: 'Administrador',
    LEADER: 'Líder',
    EXECUTOR: 'Ejecutor'
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
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(MESSAGE_TYPES.success);

    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const availableUsers = users.filter(
        user =>
            user.role !== 'ADMIN' &&
            !members.some(
                member => member.user.id === user.id
            )
    );
    const filteredAvailableUsers =
        roleFilter === 'ALL'
            ? availableUsers
            : availableUsers.filter(
                user => user.role === roleFilter
            );

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

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage('');
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

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
                <div className="py-10 text-center">

                    <p className="text-gray-500 font-medium">
                        No hay proyectos disponibles
                    </p>

                    <p className="text-sm text-gray-400 mt-1">
                        Crea un proyecto para comenzar
                    </p>

                </div>
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
                            <div className="flex items-start gap-3">

                                <div
                                    className={`
      w-10 h-10 rounded-xl
      flex items-center justify-center
      ${isSelected
                                            ? 'bg-white/20'
                                            : 'bg-indigo-100 text-indigo-600'
                                        }
    `}
                                >
                                    <FolderKanban size={18} />
                                </div>

                                <div>

                                    <p className="font-semibold">
                                        {project.name}
                                    </p>

                                    <p
                                        className={`text-sm mt-1 ${isSelected
                                            ? 'text-white/80'
                                            : 'text-gray-500'
                                            }`}
                                    >
                                        {project.description || 'Sin descripción'}
                                    </p>

                                </div>

                            </div>
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
                <div className="py-10 text-center">

                    <div className="text-4xl mb-3">
                        👥
                    </div>

                    <p className="text-gray-500 font-medium">
                        No hay miembros asignados
                    </p>

                    <p className="text-sm text-gray-400 mt-1">
                        Selecciona un usuario para agregarlo al proyecto
                    </p>

                </div>
            );
        }

        return (
            <div className="space-y-2">
                {members.map((m) => {

                    let roleClass = '';

                    if (m.user.role === 'ADMIN') {
                        roleClass = 'bg-red-100 text-red-600';
                    }
                    else if (m.user.role === 'LEADER') {
                        roleClass = 'bg-yellow-100 text-yellow-700';
                    }
                    else {
                        roleClass = 'bg-blue-100 text-blue-600';
                    }

                    return (
                        <div
                            key={m.id}
                            className="
                flex items-center justify-between
                p-4
                rounded-2xl
                border border-gray-200
                hover:bg-gray-50
                transition
            "
                        >
                            <div className="flex items-center gap-3">

                                <div
                                    className="
                        w-10 h-10
                        rounded-full
                        bg-indigo-100
                        text-indigo-600
                        flex items-center justify-center
                        text-sm font-semibold
                    "
                                >
                                    {m.user.name
                                        ?.split(' ')
                                        .map(word => word[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <p className="font-medium text-gray-900">
                                        {m.user.name}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {m.user.email}
                                    </p>

                                    <div className="mt-1">
                                        <span
                                            className={`
                                px-2 py-1
                                rounded-full
                                text-[11px]
                                font-medium
                                ${roleClass}
                            `}
                                        >
                                            {roleLabels[m.user.role]}
                                        </span>
                                    </div>
                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={() => setMemberToRemove(m)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition"
                                title="Retirar"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">

            {message && (
                <div
                    className={`
      fixed top-5 right-5 z-50
      px-4 py-3 rounded-xl
      shadow-lg text-sm font-medium
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
            <div className="mb-8 flex items-center justify-between">

                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Asignación de miembros
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Gestiona usuarios dentro de cada proyecto
                    </p>
                </div>

            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* PROJECT LIST*/}
                <div className="bg-white rounded-3xl shadow-sm p-6">

                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Proyectos
                    </h2>
                    <div className="mb-4">
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                            {projects.length} proyectos
                        </span>
                    </div>

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

                            <div className="mb-6">

                                <div className="flex flex-wrap gap-2 mb-4">

                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('ALL')}
                                        className={`
            px-3 py-2 rounded-full text-sm font-medium
            ${roleFilter === 'ALL'
                                                ? 'bg-[#5B5CF0] text-white'
                                                : 'bg-gray-100 text-gray-500'
                                            }
        `}
                                    >
                                        Todos
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('LEADER')}
                                        className={`
            px-3 py-2 rounded-full text-sm font-medium
            ${roleFilter === 'LEADER'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }
        `}
                                    >
                                        Líderes
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('EXECUTOR')}
                                        className={`
            px-3 py-2 rounded-full text-sm font-medium
            ${roleFilter === 'EXECUTOR'
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-100 text-gray-500'
                                            }
        `}
                                    >
                                        Ejecutores
                                    </button>

                                </div>
                                <div
                                    className="
            grid gap-2
            max-h-72
            overflow-y-auto
            pr-2
        "
                                >

                                    {filteredAvailableUsers.length === 0 ? (

                                        <div className="text-center py-8">

                                            <p className="text-gray-500 font-medium">
                                                No hay usuarios disponibles para este filtro
                                            </p>

                                        </div>

                                    ) : (

                                        filteredAvailableUsers.map(user => {

                                            const selected =
                                                selectedUserId === user.id;

                                            let roleClass = '';

                                            if (user.role === 'ADMIN') {
                                                roleClass = 'bg-red-100 text-red-600';
                                            }
                                            else if (user.role === 'LEADER') {
                                                roleClass = 'bg-yellow-100 text-yellow-700';
                                            }
                                            else {
                                                roleClass = 'bg-blue-100 text-blue-600';
                                            }

                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedUserId(user.id)
                                                    }
                                                    className={`
                            p-3
                            rounded-xl
                            border
                            text-left
                            transition
                            ${selected
                                                            ? 'border-[#5B5CF0] bg-indigo-50'
                                                            : 'border-gray-200 hover:bg-gray-50'
                                                        }
                        `}
                                                >

                                                    <div className="flex items-center gap-3">

                                                        <div
                                                            className="
                                    w-10 h-10
                                    rounded-full
                                    bg-indigo-100
                                    text-indigo-600
                                    flex items-center justify-center
                                    font-semibold
                                    text-sm
                                "
                                                        >
                                                            {user.name
                                                                ?.split(' ')
                                                                .map(word => word[0])
                                                                .slice(0, 2)
                                                                .join('')
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>

                                                            <p className="font-medium text-gray-900">
                                                                {user.name}
                                                            </p>

                                                            <p className="text-xs text-gray-500">
                                                                {user.email}
                                                            </p>

                                                            <div className="mt-1">
                                                                <span
                                                                    className={`
                                            px-2 py-1
                                            rounded-full
                                            text-[11px]
                                            font-medium
                                            ${roleClass}
                                        `}
                                                                >
                                                                    {roleLabels[user.role]}
                                                                </span>
                                                            </div>

                                                        </div>

                                                    </div>

                                                </button>
                                            );
                                        })

                                    )}

                                </div>

                                <div className="flex justify-end mt-4">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            void handleAddMember();
                                        }}
                                        disabled={!selectedUserId}
                                        className="
                h-11
                px-6
                rounded-xl
                bg-[#5B5CF0]
                hover:bg-[#4c4de0]
                text-white
                text-sm
                font-medium
                disabled:opacity-50
            "
                                    >
                                        Asignar
                                    </button>

                                </div>

                            </div>

                            {/* MEMBERS */}
                            <div className="flex items-center justify-between mb-3">

                                <h3 className="text-sm font-semibold text-gray-700">
                                    Miembros actuales
                                </h3>

                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                                    {members.length} miembros
                                </span>

                            </div>

                            {renderMembers()}
                        </>
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            Selecciona un proyecto para asignar miembros
                        </div>
                    )}
                </div>
            </div>
            <ConfirmModal
                isOpen={!!memberToRemove}
                title="Retirar miembro"
                message={
                    memberToRemove
                        ? `¿Deseas retirar a ${memberToRemove.user.name} del proyecto?`
                        : ''
                }
                confirmText="Retirar"
                cancelText="Cancelar"
                danger
                onConfirm={() => {
                    void handleRemoveMember(
                        memberToRemove.user.id,
                        memberToRemove.user.name
                    );

                    setMemberToRemove(null);
                }}
                onCancel={() => setMemberToRemove(null)}
            />
        </div>
    );
}

export default ProjectMemberManagement;
