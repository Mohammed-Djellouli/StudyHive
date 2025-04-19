import React, { useState } from "react";

const MessageInput = ({ onSend }) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onSend({ user: "Moi", text: input });
            setInput("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="message-input-container">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="message"
                className="input-text-field"
            />
            <button type="submit"
                    className="send-button"
            >
                <img src="/assets/send-icon.png" alt="Send" className="send-icon" />
            </button>
        </form>
    );
};

export default MessageInput;
