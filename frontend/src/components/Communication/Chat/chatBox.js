import React, { useState,useEffect } from "react";
import MessageList from "./messageList";
import MessageInput from "./messageInput";
import socket from "../../socket";
import "./chat.css";

const ChatBox = () => {
    const [messages, setMessages] = useState([]);


    useEffect(() => {

        socket.on("receive_message", (message) => {
            //console.log("message is:", message);
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off("receive_message");
        };
    }, []);


    const handleSendMessage = (newMessage) => {
        socket.emit("send_message", newMessage);
    };

    return (
        <div className="w-96 h-[351px] rounded-xl bg-[#1e1f21] flex flex-col overflow-hidden">
            <MessageList messages={messages} />
            <MessageInput onSend={handleSendMessage} />
        </div>
    );
};

export default ChatBox;
