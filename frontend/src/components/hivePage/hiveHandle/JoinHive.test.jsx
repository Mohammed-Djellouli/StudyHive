process.env.REACT_APP_BACKEND_URL = 'http://localhost';

jest.mock('../../socket', () => {
    const emit = jest.fn();
    const socket = {
        emit,
        on: jest.fn(),
        once: jest.fn((event, callback) => {
            setTimeout(callback, 10); // Simule une connexion socket asynchrone
        }),
        off: jest.fn(),
        connected: false,
        id: 'mock-socket-id',
    };
    return socket;
});

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => jest.fn(),
    };
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import JoinHive from './JoinHive';
import socket from '../../socket';

global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'User joined successfully' }),
    })
);

beforeAll(() => {
    global.alert = jest.fn();
    console.error = jest.fn();
});

beforeEach(() => {

    const store = {};
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(key => store[key] || null);
    jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation((key, value) => {
        store[key] = value;
    });
    jest.spyOn(window.localStorage.__proto__, 'clear').mockImplementation(() => {
        for (const key in store) delete store[key];
    });
    jest.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation((key) => {
        delete store[key];
    });

    localStorage.clear();
    jest.clearAllMocks();

    localStorage.setItem('userId', 'test-user-id');
    localStorage.setItem('userPseudo', 'TestUser');
});

describe('JoinHive component', () => {
    test('affiche "Connexion à la ruche..." et émet socket.emit', async () => {
        render(
            <MemoryRouter initialEntries={['/join/room-123']}>
                <Routes>
                    <Route path="/join/:idRoom" element={<JoinHive />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/Connexion à la ruche/i)).toBeInTheDocument();

        await waitFor(() => {
            const emitCalls = socket.emit.mock.calls;

            const found = emitCalls.some(
                ([eventName, payload]) =>
                    eventName === 'join_hive_room' &&
                    payload &&
                    payload.roomId === 'room-123' &&
                    typeof payload.userId === 'string' &&
                    payload.userId.length > 0
            );
        }, { timeout: 3000 });


    });
});



describe('JoinHive component', () => {
    test('affiche "Connexion à la ruche..." et émet socket.emit', async () => {
        render(
            <MemoryRouter initialEntries={['/join/room-123']}>
                <Routes>
                    <Route path="/join/:idRoom" element={<JoinHive />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/Connexion à la ruche/i)).toBeInTheDocument();

        await waitFor(() => {
            const emitCalls = socket.emit.mock.calls;

            const found = emitCalls.some(
                ([eventName, payload]) =>
                    eventName === 'join_hive_room' &&
                    payload &&
                    payload.roomId === 'room-123' &&
                    typeof payload.userId === 'string' &&
                    payload.userId.length > 0
            );
        }, { timeout: 3000 });
    });


    test('génère un invité Bee-XXXX si aucun userId/pseudo en localStorage', async () => {
        localStorage.clear(); // Supprime toute identité utilisateur

        render(
            <MemoryRouter initialEntries={['/join/room-456']}>
                <Routes>
                    <Route path="/join/:idRoom" element={<JoinHive />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/Connexion à la ruche/i)).toBeInTheDocument();

        await waitFor(() => {
            const emitCalls = socket.emit.mock.calls;

            const found = emitCalls.some(([eventName, payload]) => {
                const pseudo = payload?.user?.pseudo || '';
                return (
                    eventName === 'join_hive_room' &&
                    payload?.roomId === 'room-456' &&
                    typeof payload.user?.userId === 'string' &&
                    /^Bee-\d{4}$/.test(pseudo)
                );
            });
        }, { timeout: 3000 });
    });
});


