import React, { useState } from "react";
import MessageList from "./messageList";
import MessageInput from "./messageInput";
import "./chat.css";

const ChatBox = () => {
    const [messages, setMessages] = useState([]);

    const handleSendMessage = (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    return (
        <div className="chat-container">
            <MessageList messages={messages} />
            <MessageInput onSend={handleSendMessage} />
        </div>
    );
};

export default ChatBox;
