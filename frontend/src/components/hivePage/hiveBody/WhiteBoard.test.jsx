import React from 'react';
import { render, screen } from '@testing-library/react';
import WhiteBoard from './WhiteBoard';

jest.mock('jspdf', () => ({
    jsPDF: jest.fn().mockImplementation(() => ({
        addImage: jest.fn(),
        save: jest.fn()
    }))
}));

jest.mock('../../socket', () => ({
    __esModule: true,
    default: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
    },
}));

// MOCK canvas
HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: '',
});

describe('WhiteBoard basic render test', () => {
    it('renders whiteboard modal when open', () => {
        render(
            <WhiteBoard
                roomId="testRoom"
                isModalOpen={true}
                setIsModalOpen={() => {}}
                canDraw={true}
                setNotification={() => {}}
            />
        );

        expect(screen.getByText(/fermer/i)).toBeInTheDocument();
    });
});
