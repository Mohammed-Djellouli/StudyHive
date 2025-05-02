import React, { useState, useEffect, useRef } from "react";
import { useParams } from 'react-router-dom';
import MessageList from "./messageList";
import MessageInput from "./messageInput";
import socket from "../../socket";
import "./chat.css";

const ChatBox = () => {
    const [messages, setMessages] = useState([]);
    const [userId, setUserId] = useState(null);
    const [socketId, setSocketId] = useState("");
    const { idRoom: roomId } = useParams();

    const messagesEndRef = useRef(null);

    useEffect(() => {
        const storedId = localStorage.getItem("userId");
        setUserId(storedId);
    }, []);

    useEffect(() => {
        socket.emit("join_chat", roomId);
    }, [roomId]);

    useEffect(() => {
        socket.on("connect", () => {
            setSocketId(socket.id);
        });

        socket.on("receive_message", (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off("connect");
            socket.off("receive_message");
        };
    }, []);

    // Scroll automatique vers le bas à chaque nouveau message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = (newMessage) => {
        socket.emit("send_message", {
            roomId,
            message: {
                ...newMessage,
                user: userId || socketId
            }
        });
    };

    return (
        <div className="w-96 h-[340px] rounded-xl bg-[#1e1f21] flex flex-col overflow-hidden">
            <MessageList messages={messages} selfId ={userId || socketId} />
            <MessageInput onSend={handleSendMessage} />
        </div>
    );
};

export default ChatBox;
