import React from "react";
import {useEffect,useRef} from "react";

const MessageList = ({ messages,selfId,users,ownerId }) => {
    const bottomRef = useRef(null);
    const getPseudo = (userId)=>{
        const foundUser =users.find(
            (u)=>
                u.userId?.toString() === userId ||
                u.socketId === userId ||
                u._id?.toString() === userId
        );
        return foundUser?.pseudo || "error";
    };

    useEffect(() => {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    return (
        <div className="message-list-container flex flex-col gap-3 p-5 overflow-y-auto max-h-[400px] h-[400px]">
            {messages.map((msg, index) => {
                const isMe = msg.user === selfId;
                const pseudo = getPseudo(msg.user);
                return (
                    <div
                        key={index}
                        className={`flex items-center ${isMe ? "justify-end" : "justify-start"}`}                    >
                        {!isMe && (
                            <div className="w-12 h-12 rounded-full bg-black mr-4 flex items-center justify-center overflow-hidden">
                                <img
                                    src={msg.user === ownerId ? "/assets/queen-bee.png" : "/assets/SoloBee2.png"}
                                    className="w-full h-full object-cover"
                                    alt="avatar"
                                />
                            </div>
                        )}
                        <div className="flex flex-col max-w-[60%]">
                            <div className={`text-xs text-gray-400 mb-1 ${isMe ? "text-right" : "text-left"}`}>
                                {pseudo}
                            </div>
                            <div className={`px-3 py-2 rounded-2xl break-words ${isMe ? "bg-[#ffeaa7] text-black ml-auto rounded-br-none" : "bg-black text-white rounded-bl-none"}`}>
                                {msg.text}
                                {msg.file && (
                                    <div className="mt-2">
                                        {msg.file.type.startsWith('image/') ? (
                                            <img
                                                src={msg.file.data}
                                                alt="Shared file"
                                                className="max-w-[200px] rounded-lg"
                                            />
                                        ) : (
                                            <a
                                                href={msg.file.data}
                                                download={msg.file.name}
                                                className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                                            >
                                                <img src="/assets/file-icon.png" alt="File" className="w-8 h-8" />
                                                {msg.file.name}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {isMe && (
                            <div className="w-12 h-12 rounded-full bg-black ml-4 flex items-center justify-center overflow-hidden">
                                <img src={msg.user ===ownerId ? "/assets/queen-bee.png" : "/assets/SoloBee2.png"} className="w-full h-full object-cover" alt="abeille" />
                            </div>
                        )}
                    </div>
                );
            })}
            {/*auto scroll into this div*/}
            <div ref={bottomRef}></div>
        </div>
    );
};

export default MessageList;
