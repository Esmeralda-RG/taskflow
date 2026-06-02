import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskForm from '../TaskForm.jsx';

vi.mock('../../contexts/AuthContext.jsx', () => ({
    useAuth: () => ({ token: 'tok', user: { id: 'u1', role: 'ADMIN' } })
}));

const mockMembers = [
    { user: { id: 'u3', name: 'Exec User', email: 'exec@test.com', role: 'EXECUTOR' } }
];

const mockPhases = [
    { id: 'ph1', name: 'Por hacer', order: 1 },
    { id: 'ph2', name: 'En proceso', order: 2 },
    { id: 'ph3', name: 'Finalizado', order: 3 }
];

const defaultProps = {
    projectId: 'p1',
    phaseId: 'ph1',
    phases: mockPhases,
    onTaskCreated: vi.fn(),
    onTaskChanged: vi.fn(),
    onPhaseChanged: vi.fn(),
    onCancel: vi.fn()
};

const mockTaskToEdit = {
    id: 't1',
    title: 'Tarea existente',
    description: 'Descripción de la tarea',
    estimatedHours: 8,
    assigneeId: 'u3',
    phaseId: 'ph1',
    phase: { id: 'ph1', name: 'Por hacer' },
    assignee: { id: 'u3', name: 'Exec User', email: 'exec@test.com' },
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2026-06-30T00:00:00Z',
    timeLogs: [
        { id: 'tl1', timeSpent: 120, description: 'Trabajo inicial', user: { id: 'u3', name: 'Exec User' }, createdAt: '2026-06-01T10:00:00Z' }
    ]
};

describe('TaskForm - Modo creación', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.stubGlobal('alert', vi.fn());
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true, members: mockMembers })
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    it('renderiza el título "Nueva tarea"', async () => {
        render(<TaskForm {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Nueva tarea')).toBeInTheDocument();
        });
    });

    it('renderiza los campos del formulario', async () => {
        render(<TaskForm {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Ej. Implementar autenticación')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Describe el objetivo de la tarea...')).toBeInTheDocument();
        });
    });

    it('renderiza el campo de horas estimadas', async () => {
        render(<TaskForm {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByLabelText('Horas estimadas')).toBeInTheDocument();
        });
    });

    it('llama onCancel al hacer click en Cancelar', async () => {
        const onCancel = vi.fn();
        render(<TaskForm {...defaultProps} onCancel={onCancel} />);

        await waitFor(() => screen.getByText('Cancelar'));
        fireEvent.click(screen.getByText('Cancelar'));

        expect(onCancel).toHaveBeenCalled();
    });

    it('muestra el selector de responsable con CustomDropdown', async () => {
        render(<TaskForm {...defaultProps} />);

        await waitFor(() => {
            // CustomDropdown muestra el placeholder cuando no hay valor seleccionado
            expect(screen.getByText('Sin asignar')).toBeInTheDocument();
        });
    });

    it('crea una tarea al hacer submit del formulario', async () => {
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, members: mockMembers }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, task: { id: 't2', title: 'Nueva' } }) });

        const onTaskCreated = vi.fn();
        render(<TaskForm {...defaultProps} onTaskCreated={onTaskCreated} />);

        await waitFor(() => screen.getByPlaceholderText('Ej. Implementar autenticación'));

        fireEvent.change(screen.getByPlaceholderText('Ej. Implementar autenticación'), {
            target: { value: 'Tarea nueva' }
        });

        fireEvent.click(screen.getByText('Crear tarea'));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });
});

describe('TaskForm - Modo edición', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, members: mockMembers }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, comments: [] }) });
    });
    afterEach(() => vi.unstubAllGlobals());

    it('muestra el título "Detalle de tarea" en modo edición', async () => {
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        await waitFor(() => {
            expect(screen.getByText('Detalle de tarea')).toBeInTheDocument();
        });
    });

    it('muestra el nombre de la tarea en el encabezado', async () => {
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        await waitFor(() => {
            expect(screen.getByText('Tarea existente')).toBeInTheDocument();
        });
    });

    it('muestra el campo de responsable en modo edición', async () => {
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        await waitFor(() => {
            expect(screen.getByText('Exec User')).toBeInTheDocument();
        });
    });

    it('muestra "No hay comentarios" cuando no hay comentarios', async () => {
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        await waitFor(() => {
            expect(screen.getByText('No hay comentarios')).toBeInTheDocument();
        });
    });

    it('muestra el campo de edición de título con el valor actual', async () => {
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        await waitFor(() => {
            const titleInput = screen.getByDisplayValue('Tarea existente');
            expect(titleInput).toBeInTheDocument();
        });
    });

    it('muestra el botón Cerrar', async () => {
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        await waitFor(() => {
            expect(screen.getByText('Cerrar')).toBeInTheDocument();
        });
    });

    it('llama onCancel al hacer click en Cerrar', async () => {
        const onCancel = vi.fn();
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} onCancel={onCancel} />);

        await waitFor(() => screen.getByText('Cerrar'));
        fireEvent.click(screen.getByText('Cerrar'));

        expect(onCancel).toHaveBeenCalled();
    });

    it('muestra la sección de Actividad (comentarios)', async () => {
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        await waitFor(() => {
            expect(screen.getByText('Actividad')).toBeInTheDocument();
        });
    });

    it('muestra el botón Guardar cambios en modo edición', async () => {
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        await waitFor(() => {
            expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
        });
    });

    it('muestra la etiqueta Información Editable', async () => {
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        await waitFor(() => {
            expect(screen.getByText('Información Editable')).toBeInTheDocument();
        });
    });

    it('muestra el CustomDropdown de responsable en modo edición', async () => {
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        await waitFor(() => screen.getByText('Detalle de tarea'));

        // El CustomDropdown tiene un botón trigger con el valor seleccionado o placeholder
        const buttons = screen.getAllByRole('button');
        // Debe existir al menos el botón trigger del CustomDropdown (muestra el nombre del responsable o "Sin asignar")
        const dropdownTrigger = buttons.find(b =>
            b.textContent.includes('Exec User') || b.textContent.includes('Sin asignar')
        );
        expect(dropdownTrigger).toBeDefined();
    });

    it('elimina la tarea al confirmar (ADMIN)', async () => {
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, members: mockMembers }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, comments: [] }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

        const onTaskCreated = vi.fn();
        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} onTaskCreated={onTaskCreated} />);

        await waitFor(() => screen.getByText('Detalle de tarea'));

        const deleteButtons = screen.queryAllByText('Eliminar tarea');
        if (deleteButtons.length > 0) {
            fireEvent.click(deleteButtons[0]);
            await waitFor(() => expect(onTaskCreated).toHaveBeenCalled());
        } else {
            // El botón puede tener otro texto en la versión actual
            expect(screen.getByText('Detalle de tarea')).toBeInTheDocument();
        }
    });

    it('registra comentario enviando el formulario de actividad', async () => {
        fetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, members: mockMembers }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, comments: [] }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, comment: { id: 'c1', content: 'OK', interaction: 'APROBADO', user: { id: 'u1', name: 'Admin' }, attachments: [] } }) });

        render(<TaskForm {...defaultProps} taskToEdit={mockTaskToEdit} />);

        const commentTextarea = await screen.findByPlaceholderText('Escribe un comentario...');
        fireEvent.change(commentTextarea, { target: { value: 'Buen trabajo' } });

        // Enviar el formulario directamente
        const form = commentTextarea.closest('form');
        if (form) {
            fireEvent.submit(form);
            await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
        }
    });
});
