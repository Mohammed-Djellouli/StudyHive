import React, { useState } from "react";

const MessageInput = ({ onSend }) => {
    const [input, setInput] = useState("");
    const [file, setFile] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!input.trim() && !file) return;

        const message = { text: input };

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                message.file = {
                    name: file.name,
                    type: file.type,
                    data: reader.result
                };
                onSend(message);
            };
            reader.readAsDataURL(file);
        } else {
            onSend(message);
        }

        setInput("");
        setFile(null);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col p-2 bg-black gap-1">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message"
                    className="flex-grow bg-transparent text-white px-2 outline-none"
                />
                <button 
                    type="button" 
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded-md"
                    onClick={() => document.getElementById('fileInput').click()}
                >
                    Upload
                </button>
                <input
                    id="fileInput"
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                />
                <button type="submit" className="px-3">
                    <img src="/assets/send-icon.png" alt="Send" className="w-5 h-5" />
                </button>
            </div>
            {file && (
                <div className="flex items-center gap-2 text-white text-sm mt-1 bg-gray-700 p-2 rounded">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button 
                        type="button" 
                        onClick={() => setFile(null)}
                        className="text-red-500 hover:text-red-400 font-bold"
                    >
                        ×
                    </button>
                </div>
            )}
        </form>
    );
};

export default MessageInput; 