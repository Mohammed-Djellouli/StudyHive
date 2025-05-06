import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginForm from './LoginForm';
import { BrowserRouter } from 'react-router-dom';

//  Wrapper pour Router (à cause de <Link>)
const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('LoginForm basic render test', () => {
    it('renders email input and login button', () => {
        render(<LoginForm />, { wrapper: Wrapper });

        // Vérifie que le champ email est présent
        const emailInput = screen.getByPlaceholderText(/QueenBee@gmail.com/i);
        expect(emailInput).toBeInTheDocument();

        // Vérifie que le bouton "Se Connecter" est présent
        const loginButton = screen.getByRole('button', { name: /se connecter/i });
        expect(loginButton).toBeInTheDocument();
    });
});
