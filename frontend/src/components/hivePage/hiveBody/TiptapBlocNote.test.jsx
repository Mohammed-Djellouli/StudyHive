import React from 'react';
import { render, screen } from '@testing-library/react';
import TiptapBlocNote from './BlocNote';

// Mock jsPDF pour éviter les erreurs côté DOM
jest.mock('jspdf', () => ({
    jsPDF: jest.fn().mockImplementation(() => ({
        html: jest.fn((_, opts) => opts.callback({ save: jest.fn() })),
        save: jest.fn(),
    })),
}));

describe('TiptapBlocNote render test', () => {
    it('renders without crashing and shows export button', () => {
        render(<TiptapBlocNote />);

        // Vérifie la présence de l’élément d’édition
        expect(screen.getByRole('button', { name: /exporter en pdf/i })).toBeInTheDocument();
    });
});
