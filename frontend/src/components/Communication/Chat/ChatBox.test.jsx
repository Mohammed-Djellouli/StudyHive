import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { act } from 'react';
import ChatBox from './chatBox';
import socket from '../../socket';

jest.mock('../../socket');
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('ChatBox', () => {
    const users = [
        { userId: '123', pseudo: 'Alice' },
        { socketId: 'mock-socket-id', pseudo: 'Bob' },
    ];

    beforeEach(() => {
        socket.on.mockClear();
        socket.emit.mockClear();
        socket.id = 'mock-socket-id';
    });

    it('renders ChatBox and shows a message', async () => {
        render(
            <MemoryRouter
                initialEntries={['/room/test-room']}
                future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
                <Routes>
                    <Route path="/room/:idRoom" element={<ChatBox users={users} ownerId="123" />} />
                </Routes>
            </MemoryRouter>
        );

        const fakeMsg = { text: 'hello world', user: 'mock-socket-id', pseudo: 'Bob' };

        act(() => {
            const receiveCb = socket.on.mock.calls.find(call => call[0] === 'receive_message')[1];
            receiveCb(fakeMsg);
        });

        await waitFor(() => {
            expect(screen.getByText(/hello world/i)).toBeInTheDocument();
            expect(screen.getByText(/Bob/i)).toBeInTheDocument();
        });
    });
});
