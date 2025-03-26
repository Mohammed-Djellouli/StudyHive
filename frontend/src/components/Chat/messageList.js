import React from "react";

const MessageList = ({ messages }) => {
    return (
        <div className="message-list-container">
            {messages.map((msg, index) => (
                <div key={index} className="message-row">
                    <div className="message-list-user">
                        <img src="/assets/SoloBee.png" className="user-photo"></img>
                    </div>
                    <div className="message-list-message">{msg.text}</div>
                </div>
            ))}
        </div>
    );
};

export default MessageList;
