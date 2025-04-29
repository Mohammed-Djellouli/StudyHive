import React, { useState,useEffect } from "react";
import {useParams} from 'react-router-dom';
import MessageList from "./messageList";
import MessageInput from "./messageInput";
import socket from "../../../socket";
import "./chat.css";

const ChatBox = () => {
    const [messages, setMessages] = useState([]);
    const[userId, setUserId] = useState(null);
    const[socketId, setSocketId] = useState("");
    const {idRoom:roomId} = useParams();

    useEffect(() => {

        //getting the user's ID from localStroage and setting the ID
        const storedId=localStorage.getItem("userId");
        setUserId(storedId);
    }, []);

    useEffect(() =>{
        socket.emit("join_chat",roomId);
    },[roomId]);

    useEffect(() => {

        //setting the socketId while connected
        socket.on("connect",()=>{
            setSocketId(socket.id);
        })

        socket.on("receive_message", (message) => {
            //console.log("message is:", message);
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off("connect");
            socket.off("receive_message");
        };
    }, []);


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
        <div className="w-96 h-[351px] rounded-xl bg-[#1e1f21] flex flex-col overflow-hidden">
            <MessageList messages={messages} selfId ={userId || socketId} />
            <MessageInput onSend={handleSendMessage} />
        </div>
    );
};

export default ChatBox;
