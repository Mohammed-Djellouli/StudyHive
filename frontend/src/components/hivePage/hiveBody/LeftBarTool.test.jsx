import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LeftBarTools from './LeftBarTools';
import socket from '../../../components/socket';

jest.mock('../../../components/socket', () => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    id: 'mock-socket-id',
}));

jest.mock('../../Communication/MicChat/VoiceChat', () => () => (
    <div data-testid="voice-chat">VoiceChat</div>
));

describe('LeftBarTools', () => {
    const baseProps = {
        ownerPseudo: 'QueenBee',
        isQueenBeeMode: true,
        onStartSharing: jest.fn(),
        isInitiator: true,
        isSharing: false,
        users: [
            {
                userId: 'user-1',
                pseudo: 'User1',
                screenShareControl: true,
            },
        ],
        currentUserId: 'user-1',
        toggleBRB: jest.fn(),
        brbMode: false,
        isScreenShareWindowOpen: false,
        onToggleScreenShareWindow: jest.fn(),
        onToggleWhiteboard: jest.fn(),
        isWhiteboardOpen: false,
        ownerId: 'user-1',
        setIsInviteModalOpen: jest.fn(),
    };

    beforeEach(() => {
        localStorage.setItem('userId', 'user-1');
        socket.emit.mockClear();

        //  Mock window.location.pathname pour avoir une roomId simulée
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { pathname: '/hive/room-abc' },
        });
    });

    test('emit "user_raise_hand" avec bonne roomId', () => {
        render(<LeftBarTools {...baseProps} />);

        const raiseBtn = screen.getByAltText('Raise Hand');
        fireEvent.click(raiseBtn);

        expect(socket.emit).toHaveBeenCalledWith('user_raise_hand', {
            roomId: 'room-abc',
            userId: 'user-1',
            raised: true,
        });
    });
});
