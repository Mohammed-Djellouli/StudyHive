import React from "react";
import {useEffect,useRef} from "react";

const MessageList = ({ messages }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    return (
        <div className="message-list-container flex flex-col gap-3 p-5 overflow-y-scroll h-[calc(100%-56px)]">
            {messages.map((msg, index) => {
                const isMe = msg.user === "Moi"; //Moi is the username
                return (
                    <div
                        key={index}
                        className={`flex items-center ${isMe ? "justify-end" : "justify-start"}`}                    >
                        {!isMe && (
                            <div className="w-12 h-12 rounded-full bg-black mr-4 flex items-center justify-center overflow-hidden">
                                <img src="/assets/SoloBee2.png" className="w-full h-full object-cover" alt="abeille" />
                            </div>
                        )}
                        <div className={`max-w-[60%] px-3 py-2 rounded-2xl break-words ${isMe ? "bg-[#ffeaa7] text-black ml-2 rounded-br-none" : "bg-black text-white mr-2 rounded-bl-none"}`}>{msg.text}</div>
                        {isMe && (
                            <div className="w-12 h-12 rounded-full bg-black ml-4 flex items-center justify-center overflow-hidden">
                                <img src="/assets/SoloBee2.png" className="user-photo" alt="abeille" />
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
