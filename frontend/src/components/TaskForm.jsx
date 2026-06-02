import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext.jsx';
import TaskActivityPanel from './TaskActivityPanel';
import {
    Send,
    Paperclip,
    Trash2,
    Clock3,
    ThumbsUp,
    ThumbsDown,
    HelpCircle
} from 'lucide-react';

const COMMENT_INTERACTIONS = [
    {
        value: 'APROBADO',
        label: 'Aprobado',
        className: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300',
        icon: <ThumbsUp className="w-5 h-5 stroke-[2]" />
    },
    {
        value: 'DESAPROBADO',
        label: 'Desaprobado',
        className: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300',
        icon: <ThumbsDown className="w-5 h-5 stroke-[2]" />
    },
    {
        value: 'DUDA',
        label: 'Duda',
        className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-300',
        icon: <HelpCircle className="w-5 h-5 stroke-[2]" />
    }
];

const getInteractionMeta = (interaction) =>
    COMMENT_INTERACTIONS.find((item) => item.value === interaction) || {};

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
    '.pdf',
    '.docx',
    '.doc',
    '.txt',
    '.xlsx',
    '.xls',
    '.png',
    '.jpg',
    '.jpeg'
]);
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

function TaskForm({
    projectId,
    phaseId,
    onTaskCreated,
    onTaskChanged,
    taskToEdit = null,
    onCancel
}) {
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        estimatedHours: '',
        assigneeId: '',
        startDate: '',
        endDate: ''
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [timeLogData, setTimeLogData] = useState({
        hours: '',
        description: ''
    });
    const [timeLogs, setTimeLogs] = useState([]);
    const [timeLogSaving, setTimeLogSaving] = useState(false);
    const [timeLogError, setTimeLogError] = useState('');
    const [comments, setComments] = useState([]);
    const [commentData, setCommentData] = useState({
        content: '',
        interaction: 'APROBADO'
    });
    const [commentFiles, setCommentFiles] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentSaving, setCommentSaving] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [showLogForm, setShowLogForm] = useState(false);

    const fetchProjectMembers = useCallback(async () => {
        if (!projectId) return;

        try {
            const res = await fetch(
                `http://localhost:3000/api/project-members/${projectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await res.json();

            if (data.success) {
                setUsers(data.members.map((member) => member.user));
            }
        } catch (err) {
            console.error(err);
        }
    }, [projectId, token]);

    useEffect(() => {
        fetchProjectMembers();
    }, [fetchProjectMembers]);

    useEffect(() => {
        const fetchComments = async () => {
            if (!taskToEdit?.id) {
                setComments([]);
                return;
            }

            try {
                setCommentsLoading(true);
                setCommentError('');

                const res = await fetch(
                    `http://localhost:3000/api/tasks/${taskToEdit.id}/comments`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await res.json();

                if (data.success) {
                    setComments(data.comments);
                } else {
                    setCommentError(
                        data.message || 'No se pudieron cargar los comentarios'
                    );
                }
            } catch (err) {
                console.error(err);
                setCommentError('Error de conexión al cargar comentarios');
            } finally {
                setCommentsLoading(false);
            }
        };

        fetchComments();
    }, [taskToEdit?.id, token]);

    useEffect(() => {
        if (!taskToEdit) {
            setFormData({
                title: '',
                description: '',
                estimatedHours: '',
                assigneeId: '',
                startDate: '',
                endDate: ''
            });
            setTimeLogs([]);

            return;
        }

        setFormData({
            title: taskToEdit.title ?? '',
            description: taskToEdit.description ?? '',
            estimatedHours: taskToEdit.estimatedHours ?? '',
            assigneeId: taskToEdit.assigneeId ?? '',
            startDate: taskToEdit.startDate ? taskToEdit.startDate.split('T')[0] : '',
            endDate: taskToEdit.endDate ? taskToEdit.endDate.split('T')[0] : ''
        });
        setTimeLogs(taskToEdit.timeLogs || []);
        setTimeLogData({
            hours: '',
            description: ''
        });
        setTimeLogError('');
        setCommentData({
            content: '',
            interaction: 'APROBADO'
        });
        setCommentFiles([]);
        setCommentError('');
    }, [phaseId, taskToEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.endDate) < new Date(formData.startDate)) {
                alert('La fecha límite no puede ser menor a la fecha de inicio');
                return;
            }
        }

        setLoading(true);

        const url = taskToEdit
            ? `http://localhost:3000/api/tasks/${taskToEdit.id}`
            : 'http://localhost:3000/api/tasks';

        const method = taskToEdit ? 'PATCH' : 'POST';

        const payload = {
            title: formData.title,
            description: formData.description,
            estimatedHours: formData.estimatedHours || 0,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            assigneeId: formData.assigneeId || null,
        };

        if (taskToEdit) {
            payload.phaseId = phaseId;
        } else {
            payload.phaseId = phaseId;
            payload.projectId = projectId;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                alert(
                    taskToEdit
                        ? 'Tarea actualizada exitosamente'
                        : 'Tarea creada exitosamente'
                );

                onTaskCreated?.();
                onCancel?.();
            } else {
                alert(data.message || 'Error al guardar la tarea');
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!taskToEdit) return;

        if (!globalThis.confirm(`¿Eliminar la tarea "${taskToEdit.title}"?`)) {
            return;
        }

        try {
            setDeleting(true);

            const res = await fetch(
                `http://localhost:3000/api/tasks/${taskToEdit.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || data.error || 'Error al eliminar tarea');
                return;
            }

            onTaskCreated();

            if (onCancel) {
                onCancel();
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        } finally {
            setDeleting(false);
        }
    };

    const handleTimeLogSubmit = async (e) => {
        e.preventDefault();

        const hours = Number.parseFloat(timeLogData.hours);
        const minutes = Math.round(hours * 60);

        if (!Number.isFinite(hours) || hours <= 0 || minutes <= 0) {
            setTimeLogError('Ingresa un tiempo mayor a 0 horas');
            return;
        }

        try {
            setTimeLogSaving(true);
            setTimeLogError('');

            const res = await fetch(
                `http://localhost:3000/api/tasks/${taskToEdit.id}/log-time`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        timeSpent: minutes,
                        description: timeLogData.description
                    })
                }
            );
            const data = await res.json();

            if (!res.ok || !data.success) {
                setTimeLogError(data.message || data.error || 'No se pudo registrar el tiempo');
                return;
            }

            setTimeLogs((currentLogs) => [data.timeLog, ...currentLogs]);
            setTimeLogData({
                hours: '',
                description: ''
            });

            if (onTaskChanged) {
                onTaskChanged();
            }
        } catch (err) {
            console.error(err);
            setTimeLogError('Error de conexión al registrar tiempo');
        } finally {
            setTimeLogSaving(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        const content = commentData.content.trim();

        if (!content || !commentData.interaction) {
            setCommentError('El comentario requiere texto e interacción');
            return;
        }

        const invalidFile = commentFiles.find((file) => {
            const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;

            return !ALLOWED_ATTACHMENT_EXTENSIONS.has(extension);
        });

        if (invalidFile) {
            setCommentError('Formato de archivo no permitido');
            return;
        }

        const oversizedFile = commentFiles.find((file) => file.size > MAX_ATTACHMENT_SIZE);

        if (oversizedFile) {
            setCommentError('El archivo supera el tamaño máximo de 10 MB');
            return;
        }

        try {
            setCommentSaving(true);
            setCommentError('');

            const res = await fetch(
                `http://localhost:3000/api/tasks/${taskToEdit.id}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        content,
                        interaction: commentData.interaction
                    })
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                setCommentError(data.message || 'No se pudo agregar el comentario');
                return;
            }

            let comment = data.comment;

            if (commentFiles.length > 0) {
                const filesFormData = new FormData();

                commentFiles.forEach((file) => {
                    filesFormData.append('files', file);
                });

                const filesRes = await fetch(
                    `http://localhost:3000/api/comments/${comment.id}/attachments`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`
                        },
                        body: filesFormData
                    }
                );

                const filesData = await filesRes.json();

                if (!filesRes.ok || !filesData.success) {
                    setCommentError(filesData.message || 'No se pudieron cargar los adjuntos');
                    return;
                }

                comment = {
                    ...comment,
                    attachments: filesData.attachments
                };
            }

            setComments((currentComments) => [...currentComments, comment]);
            setCommentData({
                content: '',
                interaction: 'APROBADO'
            });
            setCommentFiles([]);
        } catch (err) {
            console.error(err);
            setCommentError('Error de conexión al guardar comentario');
        } finally {
            setCommentSaving(false);
        }
    };

    const formatCommentDate = (date) =>
        new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(new Date(date));

    const getAttachmentUrl = (fileUrl) =>
        fileUrl?.startsWith('http')
            ? fileUrl
            : `http://localhost:3000${fileUrl}`;

    const totalTimeSpent = timeLogs.reduce(
        (total, log) => total + (log.timeSpent || 0),
        0
    );
    const totalLoggedHours = Math.round((totalTimeSpent / 60) * 10) / 10;
    const estimatedHours = Number(formData.estimatedHours) || 0;
    const maxTimeHours = Math.max(totalLoggedHours, estimatedHours, 1);
    const estimatedWidth = estimatedHours ? (estimatedHours / maxTimeHours) * 100 : 0;
    const realWidth = totalLoggedHours ? (totalLoggedHours / maxTimeHours) * 100 : 0;

    const formTitle = taskToEdit
        ? 'Editar tarea'
        : 'Nueva tarea';

    const formDescription = taskToEdit
        ? 'Actualiza la información de la tarea'
        : 'Completa los datos para crear una nueva tarea';

    let submitButtonText = 'Crear tarea';

    if (loading) {
        submitButtonText = 'Guardando...';
    } else if (taskToEdit) {
        submitButtonText = 'Guardar cambios';
    }

    const attachments = comments.flatMap((comment) =>
        (comment.attachments || []).map((attachment) => ({
            ...attachment,
            commentUser: comment.user,
            commentDate: comment.createdAt
        }))
    );

    if (taskToEdit) {
        return (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
                    <div>
                        <p className="text-sm font-semibold text-[#5B5CF0]">
                            Detalle de tarea
                        </p>
                        <h2 className="mt-1 text-2xl font-bold text-gray-900">
                            {formData.title || 'Nueva Tarea'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* NUEVO BOTÓN DE ELIMINAR CON ICONO LUCIDE */}
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            title="Eliminar tarea"
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                        >
                            <Trash2 size={18} />
                        </button>

                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                            >
                                Cerrar
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
                    <section className="border-b border-gray-200 lg:border-b-0 lg:border-r">
                        <form onSubmit={handleSubmit} className="space-y-6 p-6">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Información Editable
                                    </h3>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="text-xs font-semibold text-[#5B5CF0] hover:text-[#4A4BDB] disabled:opacity-50"
                                    >
                                        {loading ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* TÍTULO EDITABLE */}
                                    <div>
                                        <label
                                            htmlFor="task-title"
                                            className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Título de la tarea
                                        </label>
                                        <input
                                            id="task-title"
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#5B5CF0] focus:outline-none text-sm font-semibold text-gray-800 transition-all"
                                            placeholder="Título de la tarea"
                                            required
                                        />
                                    </div>

                                    {/* DESCRIPCIÓN EDITABLE */}
                                    <div>
                                        <label
                                            htmlFor='description'
                                            className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Descripción
                                        </label>
                                        <textarea
                                            id='description'
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#5B5CF0] focus:outline-none text-sm leading-6 text-gray-600 min-h-[80px] resize-none transition-all"
                                            placeholder="Sin descripción. Haz clic para añadir una..."
                                        />
                                    </div>

                                    {/* CUADRÍCULA DE CAMPOS EDITABLES */}
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {/* RESPONSABLE */}
                                        <div className="rounded-2xl bg-gray-50 p-3 flex flex-col justify-center">
                                            <label htmlFor="assigneeId" className="text-xs font-medium text-gray-400">
                                                Responsable
                                            </label>
                                            <select
                                                id="assigneeId"
                                                value={formData.assigneeId}
                                                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                                                className="mt-1 w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
                                            >
                                                <option value="">Sin asignar</option>
                                                {users.map((u) => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name || u.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* HORAS ESTIMADAS */}
                                        <div className="rounded-2xl bg-gray-50 p-3 flex flex-col justify-center">
                                            <label
                                                htmlFor='estimatedHours'
                                                className="text-xs font-medium text-gray-400">
                                                Horas estimadas
                                            </label>
                                            <input
                                                id='estimatedHours'
                                                type="number"
                                                min="0"
                                                value={formData.estimatedHours}
                                                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                                className="mt-1 w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none"
                                                placeholder="0 h"
                                            />
                                        </div>

                                        {/* FECHA INICIO */}
                                        <div className="rounded-2xl bg-gray-50 p-3 flex flex-col justify-center">
                                            <label
                                                htmlFor='startDate'
                                                className="text-xs font-medium text-gray-400">
                                                Inicio
                                            </label>
                                            <input
                                                id='startDate'
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                className="mt-1 w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
                                            />
                                        </div>

                                        {/* FECHA LÍMITE */}
                                        <div className="rounded-2xl bg-gray-50 p-3 flex flex-col justify-center">
                                            <label
                                                htmlFor='endDate'
                                                className="text-xs font-medium text-gray-400">
                                                Límite
                                            </label>
                                            <input
                                                id='endDate'
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                className="mt-1 w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
                                            />
                                        </div>

                                        {/* TARJETA DE TIEMPO REAL CON COMPARATIVO COMPACTO */}
                                        <div className={`rounded-2xl p-4 sm:col-span-2 border transition-all ${totalLoggedHours > estimatedHours && estimatedHours > 0
                                            ? 'bg-red-50/40 border-red-100'
                                            : 'bg-gray-50 border-transparent'
                                            }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 mr-4">
                                                    <p className="text-xs font-medium text-gray-400">
                                                        Progreso del Tiempo Invertido
                                                    </p>
                                                    <div className="flex items-baseline gap-2 mt-1">
                                                        <span className={`text-base font-bold ${totalLoggedHours > estimatedHours && estimatedHours > 0 ? 'text-red-600' : 'text-gray-900'
                                                            }`}>
                                                            {totalLoggedHours} h
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            registradas de {estimatedHours || 0} h estimadas
                                                        </span>
                                                    </div>

                                                    {/* NUEVO COMPARATIVO VISUAL ULTRA DELGADO (No genera scroll) */}
                                                    {estimatedHours > 0 && (
                                                        <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-300 ${totalLoggedHours > estimatedHours ? 'bg-red-500' : 'bg-green-500'
                                                                    }`}
                                                                style={{ width: `${Math.min((totalLoggedHours / estimatedHours) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowLogForm(!showLogForm)}
                                                    className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                                                >
                                                    <Clock3 size={13} />
                                                    {showLogForm ? 'Cerrar' : 'Tiempo'}
                                                </button>
                                            </div>

                                            {/* Formulario interno para registrar nuevas horas */}
                                            {showLogForm && (
                                                <div className="mt-4 pt-4 border-t border-gray-200/60 space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-[90px_1fr] gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.25"
                                                            value={timeLogData.hours}
                                                            onChange={(e) => setTimeLogData({ ...timeLogData, hours: e.target.value })}
                                                            className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#5B5CF0]"
                                                            placeholder="Horas"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={timeLogData.description}
                                                            onChange={(e) => setTimeLogData({ ...timeLogData, description: e.target.value })}
                                                            className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#5B5CF0]"
                                                            placeholder="Descripción del trabajo..."
                                                        />
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={handleTimeLogSubmit}
                                                            disabled={timeLogSaving}
                                                            className="h-7 px-3 rounded-lg bg-[#5B5CF0] hover:bg-[#4c4de0] text-white text-xs font-medium disabled:opacity-50"
                                                        >
                                                            {timeLogSaving ? 'Registrando...' : 'Registrar'}
                                                        </button>
                                                    </div>
                                                    {timeLogError && <p className="text-red-500 text-xs">{timeLogError}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* SECCIÓN DE ADJUNTOS */}
                        <div className="mx-6 pt-6 border-t border-gray-200 pb-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Archivos Adjuntos
                            </h3>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {attachments.length === 0 && (
                                    <div className="rounded-2xl bg-gray-50 p-4 text-xs text-gray-400 sm:col-span-2 text-center">
                                        No hay archivos adjuntos en esta tarea
                                    </div>
                                )}
                                {attachments.map((attachment) => (
                                    <a
                                        key={attachment.id}
                                        href={getAttachmentUrl(attachment.fileUrl)}
                                        download={attachment.fileName}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-[#5B5CF0]/30 hover:bg-white transition-all truncate text-xs font-medium text-[#5B5CF0]"
                                    >
                                        {attachment.fileName}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </section>

                    <TaskActivityPanel
                        comments={comments}
                        commentsLoading={commentsLoading}
                        commentData={commentData}
                        commentFiles={commentFiles}
                        commentSaving={commentSaving}
                        commentError={commentError}
                        setCommentData={setCommentData}
                        setCommentFiles={setCommentFiles}
                        handleCommentSubmit={handleCommentSubmit}
                        formatCommentDate={formatCommentDate}
                        getAttachmentUrl={getAttachmentUrl}
                        COMMENT_INTERACTIONS={COMMENT_INTERACTIONS}
                        getInteractionMeta={getInteractionMeta}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {formTitle}
                </h2>

                <p className="text-gray-500 mt-1">
                    {formDescription}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Título
                    </label>

                    <input
                        id="title"
                        type="text"
                        placeholder="Ej. Implementar autenticación"
                        value={formData.title}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                title: e.target.value
                            })
                        }
                        className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Descripción
                    </label>

                    <textarea
                        id="description"
                        placeholder="Describe el objetivo de la tarea..."
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                description: e.target.value
                            })
                        }
                        className="w-full min-h-[120px] px-4 py-3 rounded-xl bg-gray-100 border border-transparent resize-none focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="task-start-date"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Fecha de inicio
                        </label>

                        <input
                            id="task-start-date"
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

                    <div>
                        <label
                            htmlFor="task-end-date"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Fecha límite
                        </label>

                        <input
                            id="task-end-date"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    endDate: e.target.value
                                })
                            }
                            className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="estimatedHours"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Horas estimadas
                        </label>

                        <input
                            id="estimatedHours"
                            type="number"
                            placeholder="0"
                            value={formData.estimatedHours}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    estimatedHours: e.target.value
                                })
                            }
                            className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="assigneeId"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Responsable
                        </label>

                        <select
                            id="assigneeId"
                            value={formData.assigneeId}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    assigneeId: e.target.value
                                })
                            }
                            className="w-full h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                        >
                            <option value="">
                                Sin asignar
                            </option>

                            {users
                                .filter((user) => user.role === 'EXECUTOR')
                                .map((user) => (
                                    <option
                                        key={user.id}
                                        value={user.id}
                                    >
                                        {user.name || user.email}
                                        {user.role
                                            ? ` (${user.role})`
                                            : ''}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 h-11 rounded-xl bg-[#5B5CF0] hover:bg-[#4A4BDB] text-white font-medium disabled:opacity-50"
                    >
                        {submitButtonText}
                    </button>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            {taskToEdit && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Tiempo real
                                </h3>

                                <p className="text-gray-500 text-sm mt-1">
                                    Comparativo entre tiempo estimado y registrado
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="h-10 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium disabled:opacity-50"
                            >
                                {deleting ? 'Eliminando...' : 'Eliminar tarea'}
                            </button>
                        </div>

                        <div className="space-y-3 mb-5">
                            <div>
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Estimado</span>
                                    <span>{estimatedHours} h</span>
                                </div>
                                <div className="h-7 rounded-lg bg-gray-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-lg bg-[#5B5CF0]"
                                        style={{ width: `${estimatedWidth}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>Real</span>
                                    <span>{totalLoggedHours} h</span>
                                </div>
                                <div className="h-7 rounded-lg bg-gray-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-lg bg-green-600"
                                        style={{ width: `${realWidth}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={handleTimeLogSubmit}
                            className="grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] gap-3"
                        >
                            <input
                                type="number"
                                min="0"
                                step="0.25"
                                value={timeLogData.hours}
                                onChange={(e) =>
                                    setTimeLogData({
                                        ...timeLogData,
                                        hours: e.target.value
                                    })
                                }
                                className="h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                                placeholder="Horas"
                            />

                            <input
                                type="text"
                                value={timeLogData.description}
                                onChange={(e) =>
                                    setTimeLogData({
                                        ...timeLogData,
                                        description: e.target.value
                                    })
                                }
                                className="h-11 px-4 rounded-xl bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]"
                                placeholder="Descripción opcional"
                            />

                            <button
                                type="submit"
                                disabled={timeLogSaving}
                                className="h-11 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50"
                            >
                                {timeLogSaving ? 'Guardando...' : 'Registrar'}
                            </button>
                        </form>

                        {timeLogError && (
                            <div className="text-red-500 text-sm mt-3">
                                {timeLogError}
                            </div>
                        )}
                    </div>

                    <div className="mb-5">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Comentarios
                        </h3>

                        <p className="text-gray-500 text-sm mt-1">
                            Historial de retroalimentación de la tarea
                        </p>
                    </div>

                    {/* CONTENEDOR PRINCIPAL DE COMENTARIOS: Flujo inverso (El formulario abajo, la lista arriba) */}
                    <div className="flex flex-col-reverse gap-6">

                        {/* ==========================================
        PARTE INFERIOR: FORMULARIO PARA ESCRIBIR 
       ========================================== */}
                        {/* ==========================================
    ESTE DEBERÍA SER TU ÚNICO FORMULARIO DE COMENTARIOS
   ========================================== */}
<form onSubmit={handleCommentSubmit} className="space-y-4 border-t border-gray-100 pt-4 bg-white sticky bottom-0 z-10">
    
    {/* Selector de interacción por iconos de Lucide */}
    <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            ¿Qué tipo de interacción es?
        </p>

        <div className="flex gap-2">
            {COMMENT_INTERACTIONS.map((interaction) => {
                const isSelected = commentData.interaction === interaction.value;
                return (
                    <button
                        key={interaction.value}
                        type="button"
                        onClick={() =>
                            setCommentData({
                                ...commentData,
                                interaction: isSelected ? undefined : interaction.value
                            })
                        }
                        title={interaction.label}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${interaction.className} ${
                            isSelected
                                ? 'ring-2 ring-[#5B5CF0] scale-105 border-transparent shadow-sm'
                                : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                    >
                        {interaction.icon}
                    </button>
                );
            })}
        </div>
    </div>

    {/* Textarea e íconos de acción */}
    <div className="space-y-2">
        <div className="relative">
            <textarea
                rows={2}
                placeholder="Escribe un comentario..."
                value={commentData.content || ''}
                onChange={(e) => setCommentData({ ...commentData, content: e.target.value })}
                className="w-full rounded-2xl bg-gray-50 border border-gray-100 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B5CF0]/20 px-4 py-3 text-sm transition-all resize-none"
            />
        </div>

        <div className="flex items-center justify-between gap-4">
            {/* Botón de Adjuntar Archivo */}
            <label 
                htmlFor="comment-files" 
                className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium text-sm cursor-pointer transition-colors"
            >
                <Paperclip className="w-4 h-4" />
                <span className="text-xs">Adjuntar</span>
            </label>

            <input
                id="comment-files"
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.png,.jpg,.jpeg"
                onChange={(e) => setCommentFiles(Array.from(e.target.files || []))}
                className="hidden"
            />

            {/* Botón enviar único */}
            <button 
                type="submit"
                disabled={commentSaving || !commentData.content?.trim()}
                className="h-10 px-5 inline-flex items-center gap-2 rounded-xl bg-[#5B5CF0] hover:bg-[#4A4BDB] text-white font-medium text-sm transition-colors disabled:opacity-40"
            >
                {commentSaving ? 'Enviando...' : 'Comentar'}
                <Send className="w-3.5 h-3.5" />
            </button>
        </div>
    </div>

    {/* Listado de archivos cargados localmente */}
    {commentFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
            {commentFiles.map((file, index) => (
                <span
                    key={`${file.name}-${index}`}
                    className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-medium inline-flex items-center gap-1"
                >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button 
                        type="button" 
                        onClick={() => setCommentFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-gray-400 hover:text-red-500 ml-1 font-bold"
                    >
                        ×
                    </button>
                </span>
            ))}
        </div>
    )}

    {commentError && (
        <div className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
            {commentError}
        </div>
    )}
</form>
                        {/* ==========================================
        PARTE SUPERIOR: LISTADO DE COMENTARIOS 
       ========================================== */}
                        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                            {commentsLoading && (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    Cargando comentarios...
                                </div>
                            )}

                            {!commentsLoading && comments.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm italic">
                                    No hay comentarios todavía en esta tarea
                                </div>
                            )}

                            {!commentsLoading && comments.map((comment) => {
                                const interaction = getInteractionMeta(comment.interaction);

                                return (
                                    <div key={comment.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {comment.user?.name || comment.user?.email || 'Usuario'}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {formatCommentDate(comment.createdAt)}
                                                </p>
                                            </div>

                                            {interaction.icon && (
                                                <span
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center border ${interaction.className}`}
                                                    title={interaction.label} 
                                                >
                                                    {interaction.icon}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                            {comment.content}
                                        </p>

                                        {/* Adjuntos del comentario */}
                                        {comment.attachments?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3.5 pt-2.5 border-t border-gray-200/50">
                                                {comment.attachments.map((attachment) => (
                                                    <a
                                                        key={attachment.id}
                                                        href={getAttachmentUrl(attachment.fileUrl)}
                                                        download={attachment.fileName}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-[#5B5CF0] hover:bg-gray-100 transition-colors"
                                                    >
                                                        📎 {attachment.fileName}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

TaskForm.propTypes = {
    projectId: PropTypes.string.isRequired,
    phaseId: PropTypes.string.isRequired,
    onTaskCreated: PropTypes.func.isRequired,
    onTaskChanged: PropTypes.func,
    taskToEdit: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string,
        description: PropTypes.string,
        estimatedHours: PropTypes.number,
        assigneeId: PropTypes.string,
        phaseId: PropTypes.string,
        phase: PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string
        }),
        assignee: PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
            email: PropTypes.string
        }),
        startDate: PropTypes.string,
        endDate: PropTypes.string,
        timeLogs: PropTypes.array
    }),
    onCancel: PropTypes.func
};

export default TaskForm;
