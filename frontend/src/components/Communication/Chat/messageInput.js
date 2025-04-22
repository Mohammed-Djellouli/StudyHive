import React, { useState } from "react";

const MessageInput = ({ onSend }) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onSend({ text: input });
            setInput("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex h-14 bg-black">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="message"
                className="flex-grow bg-transparent text-white px-2 outline-none"
            />
            <button type="submit"
                    className="w-14 flex items-center justify-center px-3"
            >
                <img src="/assets/send-icon.png" alt="Send" className="w-5 h-5" />
            </button>
        </form>
    );
};

export default MessageInput;
