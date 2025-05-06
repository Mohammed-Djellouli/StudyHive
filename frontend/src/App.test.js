import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./components/firstPage/appHeader/LogoAtLeftCreationHive', () => () => <div>Logo</div>);
jest.mock('./components/firstPage/appHeader/ButtonConnexInscForCreationHivePage', () => () => <button>Connexion</button>);
jest.mock('./components/firstPage/appBody/PhraseAccrocheAvecButtonCreationHive', () => () => <div>Rejoignez la ruche</div>);
jest.mock('./components/firstPage/appFooter/Text_Bars_Worker_And_Queen_Bee_Mode', () => () => <footer>Explication rôles</footer>);
jest.mock('./components/hivePage/hiveHeader/NotificationBanner', () => ({ message, type, onClose }) =>
    <div>{message}</div>
);

describe('App page', () => {
  test('affiche les éléments principaux de la page', () => {
    render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
    );

    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByText(/Rejoignez la ruche/i)).toBeInTheDocument();
    expect(screen.getByText(/Explication rôles/i)).toBeInTheDocument();
  });
});
