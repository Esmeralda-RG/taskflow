import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../ConfirmModal.jsx';

const defaultProps = {
    isOpen: true,
    title: 'Eliminar usuario',
    message: '¿Deseas continuar?',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
};

describe('ConfirmModal', () => {
    it('no renderiza nada cuando isOpen es false', () => {
        const { container } = render(<ConfirmModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('muestra el título y el mensaje cuando isOpen es true', () => {
        render(<ConfirmModal {...defaultProps} />);

        expect(screen.getByText('Eliminar usuario')).toBeInTheDocument();
        expect(screen.getByText('¿Deseas continuar?')).toBeInTheDocument();
    });

    it('muestra los textos por defecto de los botones', () => {
        render(<ConfirmModal {...defaultProps} />);

        expect(screen.getByText('Confirmar')).toBeInTheDocument();
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('muestra textos personalizados en los botones', () => {
        render(<ConfirmModal {...defaultProps} confirmText="Eliminar" cancelText="Volver" />);

        expect(screen.getByText('Eliminar')).toBeInTheDocument();
        expect(screen.getByText('Volver')).toBeInTheDocument();
    });

    it('llama onConfirm al hacer click en el botón de confirmar', () => {
        const onConfirm = vi.fn();
        render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} confirmText="Eliminar" />);

        fireEvent.click(screen.getByText('Eliminar'));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('llama onCancel al hacer click en el botón de cancelar', () => {
        const onCancel = vi.fn();
        render(<ConfirmModal {...defaultProps} onCancel={onCancel} cancelText="Volver" />);

        fireEvent.click(screen.getByText('Volver'));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('llama onCancel al hacer click en el backdrop', () => {
        const onCancel = vi.fn();
        render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

        const backdrop = document.querySelector('.absolute.inset-0');
        fireEvent.click(backdrop);

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('aplica estilos de peligro en el botón de confirmar cuando danger es true', () => {
        render(<ConfirmModal {...defaultProps} danger confirmText="Eliminar" />);

        const confirmBtn = screen.getByText('Eliminar');
        expect(confirmBtn.className).toContain('bg-red-600');
    });

    it('aplica estilos normales cuando danger es false', () => {
        render(<ConfirmModal {...defaultProps} confirmText="Guardar" />);

        const confirmBtn = screen.getByText('Guardar');
        expect(confirmBtn.className).toContain('bg-[#5B5CF0]');
    });
});
