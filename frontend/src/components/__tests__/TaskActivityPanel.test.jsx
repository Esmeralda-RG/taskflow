import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskActivityPanel from '../TaskActivityPanel.jsx';

vi.mock('lucide-react', () => ({
    Paperclip: () => <span data-testid="paperclip-icon" />,
    Send: () => <span data-testid="send-icon" />
}));

const COMMENT_INTERACTIONS = [
    { value: 'APROBADO', label: 'Aprobado', className: 'bg-green-100 text-green-700', icon: '✓' },
    { value: 'DESAPROBADO', label: 'Desaprobado', className: 'bg-red-100 text-red-700', icon: '✗' },
    { value: 'DUDA', label: 'Duda', className: 'bg-yellow-100 text-yellow-700', icon: '?' }
];

const getInteractionMeta = (value) =>
    COMMENT_INTERACTIONS.find(i => i.value === value) || COMMENT_INTERACTIONS[2];

const defaultProps = {
    comments: [],
    commentsLoading: false,
    commentData: { content: '', interaction: 'APROBADO' },
    commentFiles: [],
    commentSaving: false,
    commentError: '',
    setCommentData: vi.fn(),
    setCommentFiles: vi.fn(),
    handleCommentSubmit: vi.fn(e => e.preventDefault()),
    formatCommentDate: (date) => new Date(date).toLocaleDateString('es-CO'),
    getAttachmentUrl: (url) => url,
    COMMENT_INTERACTIONS,
    getInteractionMeta
};

describe('TaskActivityPanel', () => {
    it('muestra el encabezado de Actividad', () => {
        render(<TaskActivityPanel {...defaultProps} />);
        expect(screen.getByText('Actividad')).toBeInTheDocument();
    });

    it('muestra el estado de carga cuando commentsLoading es true', () => {
        render(<TaskActivityPanel {...defaultProps} commentsLoading />);
        expect(screen.getByText('Cargando comentarios...')).toBeInTheDocument();
    });

    it('muestra "No hay comentarios" cuando el array está vacío', () => {
        render(<TaskActivityPanel {...defaultProps} />);
        expect(screen.getByText('No hay comentarios')).toBeInTheDocument();
    });

    it('renderiza los comentarios cuando existen', () => {
        const comments = [
            {
                id: 'c1',
                content: 'Buen trabajo',
                interaction: 'APROBADO',
                createdAt: '2026-06-01T10:00:00Z',
                user: { id: 'u1', name: 'Ana', email: 'ana@test.com' },
                attachments: []
            }
        ];

        render(<TaskActivityPanel {...defaultProps} comments={comments} />);

        expect(screen.getByText('Buen trabajo')).toBeInTheDocument();
        expect(screen.getByText('Ana')).toBeInTheDocument();
        expect(screen.getByText('Aprobado')).toBeInTheDocument();
    });

    it('renderiza los adjuntos de un comentario', () => {
        const comments = [
            {
                id: 'c1',
                content: 'Con adjunto',
                interaction: 'DUDA',
                createdAt: '2026-06-01T10:00:00Z',
                user: { id: 'u1', name: 'Ana', email: 'ana@test.com' },
                attachments: [
                    { id: 'a1', fileName: 'doc.pdf', fileUrl: '/uploads/doc.pdf' }
                ]
            }
        ];

        render(<TaskActivityPanel {...defaultProps} comments={comments} />);

        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    });

    it('muestra los botones de interacción', () => {
        render(<TaskActivityPanel {...defaultProps} />);

        expect(screen.getByTitle('Aprobado')).toBeInTheDocument();
        expect(screen.getByTitle('Desaprobado')).toBeInTheDocument();
        expect(screen.getByTitle('Duda')).toBeInTheDocument();
    });

    it('llama setCommentData al cambiar la interacción', () => {
        const setCommentData = vi.fn();
        render(<TaskActivityPanel {...defaultProps} setCommentData={setCommentData} />);

        fireEvent.click(screen.getByTitle('Desaprobado'));

        expect(setCommentData).toHaveBeenCalledWith(
            expect.objectContaining({ interaction: 'DESAPROBADO' })
        );
    });

    it('muestra el textarea para escribir comentarios', () => {
        render(<TaskActivityPanel {...defaultProps} />);
        expect(screen.getByPlaceholderText('Escribe un comentario...')).toBeInTheDocument();
    });

    it('llama setCommentData al escribir en el textarea', () => {
        const setCommentData = vi.fn();
        render(<TaskActivityPanel {...defaultProps} setCommentData={setCommentData} />);

        fireEvent.change(screen.getByPlaceholderText('Escribe un comentario...'), {
            target: { value: 'Mi comentario' }
        });

        expect(setCommentData).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'Mi comentario' })
        );
    });

    it('muestra el error de comentario cuando commentError no está vacío', () => {
        render(<TaskActivityPanel {...defaultProps} commentError="Error al guardar" />);
        expect(screen.getByText('Error al guardar')).toBeInTheDocument();
    });

    it('muestra los archivos seleccionados', () => {
        const files = [new File(['contenido'], 'doc.pdf', { type: 'application/pdf' })];
        render(<TaskActivityPanel {...defaultProps} commentFiles={files} />);
        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    });

    it('deshabilita el botón de enviar cuando commentSaving es true', () => {
        render(<TaskActivityPanel {...defaultProps} commentSaving />);
        const submitBtn = screen.getByTestId('send-icon').closest('button');
        expect(submitBtn).toBeDisabled();
    });

    it('llama handleCommentSubmit al hacer submit del formulario', () => {
        const handleCommentSubmit = vi.fn(e => e.preventDefault());
        render(<TaskActivityPanel {...defaultProps} handleCommentSubmit={handleCommentSubmit} />);

        fireEvent.submit(screen.getByPlaceholderText('Escribe un comentario...').closest('form'));

        expect(handleCommentSubmit).toHaveBeenCalled();
    });
});
