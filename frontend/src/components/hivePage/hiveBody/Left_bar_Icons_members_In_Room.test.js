import React from 'react';
import { render, screen } from '@testing-library/react';
import Left_bar_Icons_members_In_Room from './Left_bar_Icons_members_In_Room';
import socket from '../../socket';

jest.mock('../../socket', () => {
    const emit = jest.fn();
    return {
        emit,
        id: 'mock-socket-id'
    };
});

jest.mock('./MemberInHive', () => (props) => {
    return <li data-testid="member">{props.pseudo}</li>;
});

describe('Left_bar_Icons_members_In_Room', () => {
    const baseProps = {
        ownerPseudo: 'QueenBee',
        isQueenBeeMode: true,
        users: [
            { userId: 'owner-1', pseudo: 'QueenBee' },
            { userId: 'user-2', pseudo: 'User2' },
            { userId: 'user-3', pseudo: 'User3' },
        ],
        ownerId: 'owner-1',
        roomId: 'room-xyz',
        setNotification: jest.fn(),
        setJustExcludedIds: jest.fn()
    };

    beforeEach(() => {
        localStorage.setItem('userId', 'user-2');
        localStorage.setItem('userPseudo', 'User2');

        // Simule le pathname pour que roomId soit reconnu par le composant
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { pathname: '/hive/room-xyz' }
        });

        socket.emit.mockClear();
    });

    test('renders correctly with owner and members and emits socket event', () => {
        render(<Left_bar_Icons_members_In_Room {...baseProps} />);

        expect(screen.getByAltText(/Queen Bee/)).toBeInTheDocument();
        expect(screen.getAllByTestId('member').length).toBe(2);
        expect(screen.getByText(/QueenBee/)).toBeInTheDocument();

        expect(socket.emit).toHaveBeenCalledWith('join_hive_room', expect.objectContaining({
            roomId: 'room-xyz',
            user: expect.objectContaining({
                userId: 'user-2',
                pseudo: 'User2',
                _id: 'user-2',
                socketId: 'mock-socket-id'
            })
        }));
    });
});
