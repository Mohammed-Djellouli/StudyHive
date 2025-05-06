import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageList from './messageList';

beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe('MessageList', () => {
    const baseProps = {
        selfId: 'user-1',
        ownerId: 'user-2',
        users: [
            { userId: 'user-1', pseudo: 'Alice' },
            { userId: 'user-2', pseudo: 'Bob' },
        ],
    };

    it('renders a basic text message from self', () => {
        const messages = [{ text: 'Hello there!', user: 'user-1' }];
        render(<MessageList {...baseProps} messages={messages} />);
        expect(screen.getByText('Hello there!')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('renders a basic text message from another user', () => {
        const messages = [{ text: 'Hi!', user: 'user-2' }];
        render(<MessageList {...baseProps} messages={messages} />);
        expect(screen.getByText('Hi!')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('renders an image file', () => {
        const messages = [{
            text: 'Image below',
            user: 'user-2',
            file: {
                type: 'image/png',
                data: 'data:image/png;base64,...',
                name: 'picture.png',
            },
        }];
        render(<MessageList {...baseProps} messages={messages} />);
        expect(screen.getByAltText('Shared file')).toBeInTheDocument();
    });

    it('renders a non-image file with download link', () => {
        const messages = [{
            text: 'File attached',
            user: 'user-2',
            file: {
                type: 'application/pdf',
                data: 'data:application/pdf;base64,...',
                name: 'doc.pdf',
            },
        }];
        render(<MessageList {...baseProps} messages={messages} />);
        expect(screen.getByText('doc.pdf')).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('download', 'doc.pdf');
    });

    it('handles unknown user gracefully', () => {
        const messages = [{ text: 'Who am I?', user: 'unknown' }];
        render(<MessageList {...baseProps} messages={messages} />);
        expect(screen.getByText('error')).toBeInTheDocument();
    });
});
