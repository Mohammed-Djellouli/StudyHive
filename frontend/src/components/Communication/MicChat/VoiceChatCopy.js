import React, { useEffect, useRef, useState } from "react";
import {useParams} from "react-router-dom";
import Peer from "simple-peer/simplepeer.min.js";
import socket from "../../socket";
import getAudioStream from "./getAudio";

const VoiceChat = ({users = [],currentUserId}) =>{
    const peersRef = useRef({});
    const [stream,setStream] = useState(null);
    const {idRoom} = useParams();
    const [roomId] = useState(idRoom);
    const [muted, setMuted] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const currentUser = users.find(u => u.userId === currentUserId || u._id === currentUserId) || null;
    const micAllowed = currentUser ? currentUser.micControl:false;
    //stun to help peer find the best route to connect
    //turn used when stun fails (fairewalls problems...)
    const peerConfig ={
        trickle: false,
        config:{
            iceServers: [
                {urls: "stun:stun.l.google.com:19302"} ,
                {
                    urls: "turn:numb.viagenie.ca",
                    username: "webrtc@live.com",
                    credential: "muazkh"
                }
            ]
        }
    };

    //ask for mic access
    //store audio stream
    useEffect(() =>{
        async function initStream() {
            const audioStream = await getAudioStream();
            if (audioStream){
                console.log("Micro activé");
                setStream(audioStream);
            }
        }
        initStream();
    }, []);

    useEffect(() => {
        if (!stream) return;
        if(!currentUser) return;
        stream.getAudioTracks().forEach(track => {
            track.enabled = currentUser.micControl;
        });
        setMuted(!currentUser.micControl);
        setMicOn(!currentUser.micControl);
    }, [currentUser, stream]);

    //handle all events and peer creation
    useEffect(()=>{
        if (!stream) return;

        //join hive
        socket.emit("join_voice",roomId);


        //create peers with users already in the hive
        socket.on("all_users", (users) =>{
            console.log("Utilisateurs déjà présents :",users);

            users.forEach((userId) =>{
                //skip peer creation in doubles
                if(peersRef.current[userId]){
                    console.log("user exsits already",userId);
                    return;
                }

                const peer = new Peer({
                    ...peerConfig,
                    initiator: true,
                    stream,
                });

                //send offer
                peer.on("signal",(signal) =>{
                    console.log("sending signal to",userId);
                    socket.emit("sending_signal",{targetId: userId,signal});
                });

                //receive audio
                peer.on("stream", (remoteStream) => {
                    console.log("audo flux", userId);
                    playAudio(remoteStream);
                });

                peersRef.current[userId] = peer;
            });
        });

        //received offer from another user
        socket.on("user_signal",({ signal, callerId }) => {
            // verifacation if he exists and he is connected
            if (peersRef.current[callerId]) {
                console.log("peer exists already", callerId);
                return;
            }

            const peer = new Peer({
                ...peerConfig,
                initiator: false,
                stream,
            });

            peer.on("signal", (signal) => {
                socket.emit("returning_signal", { callerId, signal });
            });

            peer.on("stream", (remoteStream) => {
                console.log("Audio received", callerId);
                playAudio(remoteStream);
            });

            peer.signal(signal);
            peer.__connected = true;
            peersRef.current[callerId] = peer;
        });



        //received answer from peer
        socket.on("receive_returned_signal", ({ signal, id }) => {
            const peer = peersRef.current[id];
            if (!peer) {
                console.log("peer doesn't exist", id);
                const newPeer = new Peer({
                    ...peerConfig,
                    initiator: true,
                    stream,
                });

                newPeer.on("signal", (newSignal) => {
                    socket.emit("sending_signal", { targetId: id, signal: newSignal });
                });

                newPeer.on("stream", (remoteStream) => {
                    playAudio(remoteStream);
                });

                newPeer.signal(signal);
                newPeer.__connected = true;
                peersRef.current[id] = newPeer;
                return;
            }

            if (!peer.__connected) {
                try {
                    peer.signal(signal);
                    peer.__connected = true;
                } catch (err) {
                    console.log("error when signal:");
                }
            } else {
                console.log("signal ignored", id);
            }
        });




        socket.on("user_disconnected", (userId) => {
            console.log("user disconnected:", userId);
            if (peersRef.current[userId]) {
                peersRef.current[userId].destroy();
                delete peersRef.current[userId];
            }
        });

        return () => {
            Object.values(peersRef.current).forEach((peer) => peer.destroy());
            socket.off("all_users");
            socket.off("user_signal");
            socket.off("receive_returned_signal");
            socket.off("user_disconnected");
        };
    }, [stream, roomId]);


    //play audio stream that is coming
    const playAudio = (stream) => {
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.muted = false;
        audio.controls = false;
        audio.setAttribute("playsinline", "true");
        document.body.appendChild(audio);
    };

    const toggleMute = () =>{
        if (!stream) return;
        stream.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
        });
        setMuted(prev => !prev);
    };

    const toggleMic = () => setMicOn(prev => !prev);

    return (
        <button onClick={()=>{toggleMic();toggleMute()}} className="bg-black/60 p-2 rounded-full hover:scale-105 transition">
            <img
                src={micOn ? "/assets/open-microphone.png" : "/assets/mute-microphone.png"}
                alt="Mic"
                className="w-[24px] h-[24px] "
            />
        </button>
    );

};

export default VoiceChat;