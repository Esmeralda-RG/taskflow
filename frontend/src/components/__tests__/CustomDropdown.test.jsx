import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomDropdown } from '../CustomDropdown.jsx';

const options = [
    { value: 'a', label: 'Opción A' },
    { value: 'b', label: 'Opción B' },
    { value: 'c', label: 'Opción C' }
];

describe('CustomDropdown', () => {
    it('muestra el placeholder cuando no hay valor seleccionado', () => {
        render(<CustomDropdown value="" onChange={vi.fn()} options={options} placeholder="Elige..." />);

        expect(screen.getByText('Elige...')).toBeInTheDocument();
    });

    it('muestra la etiqueta de la opción seleccionada', () => {
        render(<CustomDropdown value="b" onChange={vi.fn()} options={options} />);

        expect(screen.getByText('Opción B')).toBeInTheDocument();
    });

    it('no muestra las opciones antes de hacer click', () => {
        render(<CustomDropdown value="" onChange={vi.fn()} options={options} />);

        expect(screen.queryByText('Opción A')).not.toBeInTheDocument();
    });

    it('abre el menú al hacer click en el botón', () => {
        render(<CustomDropdown value="" onChange={vi.fn()} options={options} />);

        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByText('Opción A')).toBeInTheDocument();
        expect(screen.getByText('Opción B')).toBeInTheDocument();
    });

    it('llama onChange y cierra el menú al seleccionar una opción', () => {
        const onChange = vi.fn();
        render(<CustomDropdown value="" onChange={onChange} options={options} />);

        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('Opción C'));

        expect(onChange).toHaveBeenCalledWith('c');
        expect(screen.queryByText('Opción A')).not.toBeInTheDocument();
    });

    it('cierra el menú al hacer click fuera del dropdown', () => {
        render(
            <div>
                <CustomDropdown value="" onChange={vi.fn()} options={options} />
                <div data-testid="outside">Fuera</div>
            </div>
        );

        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByText('Opción A')).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(screen.queryByText('Opción A')).not.toBeInTheDocument();
    });

    it('aplica estilos de seleccionado a la opción activa', () => {
        render(<CustomDropdown value="a" onChange={vi.fn()} options={options} />);

        fireEvent.click(screen.getByRole('button'));

        // Los botones de opción tienen clase text-left, el trigger tiene h-11
        const allButtons = screen.getAllByRole('button');
        const optionButtons = allButtons.filter(btn => btn.className.includes('text-left'));
        const optionA = optionButtons.find(btn => btn.textContent === 'Opción A');
        expect(optionA).toBeDefined();
        expect(optionA.className).toContain('bg-indigo-50');
    });
});
