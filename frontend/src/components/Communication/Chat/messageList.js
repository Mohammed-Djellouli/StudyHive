import React from "react";
import {useEffect,useRef} from "react";

const MessageList = ({ messages }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    return (
        <div className="message-list-container">
            {messages.map((msg, index) => {
                const isMe = msg.user === "Moi"; //Moi is the username
                return (
                    <div
                        key={index}
                        className={`message-row ${isMe ? "sent" : "received"}`}
                    >
                        {!isMe && (
                            <div className="message-list-user">
                                <img src="/assets/SoloBee.png" className="user-photo" alt="abeille" />
                            </div>
                        )}
                        <div className="message-list-message">{msg.text}</div>
                        {isMe && (
                            <div className="message-list-user">
                                <img src="/assets/SoloBee.png" className="user-photo" alt="abeille" />
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
