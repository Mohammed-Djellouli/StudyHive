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
                    placeholder="message"
                    className="flex-grow bg-transparent text-white px-2 outline-none"
                />
                <button 
                    type="button" 

                    className="bg-[#ffeaa7] hover:bg-[#f1c40f] text-black px-2 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-[#f1c40f]"
                    onClick={() => document.getElementById('fileInput').click()}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L13 5.414V17a1 1 0 11-2 0V5.414L7.707 8.707a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-bold text-sm">🐝</span>
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
                <div className="flex items-center gap-2 text-white text-sm mt-2 bg-[#f1c40f]/20 p-2 rounded-lg border border-[#f1c40f]/30">
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-[#f1c40f]"></span>
                        <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>

                    <button 
                        type="button" 

                        onClick={() => setFile(null)}
                        className="text-[#f1c40f] hover:text-[#ffeaa7] font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#f1c40f]/20 transition-all duration-300"
                    >
                        ×
                    </button>
                </div>
            )}
        </form>
    );
};

export default MessageInput;