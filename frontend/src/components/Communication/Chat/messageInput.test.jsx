import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from './messageInput';

describe('MessageInput', () => {
    it('sends a text message', () => {
        const mockSend = jest.fn(); // create a mock function
        render(<MessageInput onSend={mockSend} />); // render the component

        const input = screen.getByPlaceholderText(/message/i); // find the input field
        fireEvent.change(input, { target: { value: 'Hello' } }); // simulate typing 'Hello'

        fireEvent.submit(input.closest('form')); // simulate form submission (user presses Enter or clicks Send)

        expect(mockSend).toHaveBeenCalledWith({ text: 'Hello' }); // check if the function was called with the correct message
    });


    //The component correctly blocks empty messages from being sent.
    it('does not send empty message', () => {
        const mockSend = jest.fn();
        render(<MessageInput onSend={mockSend} />);

        const input = screen.getByPlaceholderText(/message/i);
        fireEvent.change(input, { target: { value: '   ' } }); // user types only spaces

        fireEvent.submit(input.closest('form')); // form is submitted

        expect(mockSend).not.toHaveBeenCalled(); // check that nothing was sent
    });

});
