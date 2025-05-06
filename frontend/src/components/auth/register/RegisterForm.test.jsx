import React from 'react';
import { render, screen } from '@testing-library/react';
import RegisterForm from './RegisterForm';
import { BrowserRouter } from 'react-router-dom';

// Wrapper nécessaire à cause du <Link>
const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('RegisterForm basic render test', () => {
    it('renders email, pseudo, password fields and create account button', () => {
        render(<RegisterForm />, { wrapper: Wrapper });

        // Vérifie la présence des inputs
        expect(screen.getByPlaceholderText(/QueenBee@gmail.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Ex: BeeMaster23/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();

        // Vérifie le bouton d'inscription
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
});
