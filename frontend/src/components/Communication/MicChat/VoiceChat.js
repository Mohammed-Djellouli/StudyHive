import React, { useEffect, useRef, useState } from "react";
import {useParams} from "react-router-dom";
import Peer from "simple-peer/simplepeer.min.js";
import socket from "../../socket";
import getAudioStream from "./getAudio";
import NotificationBanner from "../../hivePage/hiveHeader/NotificationBanner";

const VoiceChat = ({users = [],currentUserId}) =>{
    const peersRef = useRef({});
    const [stream,setStream] = useState(null);
    const {idRoom} = useParams();
    const [roomId] = useState(idRoom);
    const [muted, setMuted] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [micAllowed, setMicAllowed] = useState(true);
    const [usersState,setUsers] = useState(users);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [brbActive, setBrbActive] = useState(false);
    const [notification,setNotification] = useState(null);




    //stun to help peer find the best route to connect
    //turn used when stun fails (fairewalls problems...)

    //console.log("current user id is : ",currentUserId)
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
                setMuted(false);
            }
        }
        initStream();
    }, []);

    useEffect(() => {
        if (!usersState || usersState.length === 0 || !currentUserId) return;

        const currentUser = usersState.find(user => user.userId === currentUserId || user._id === currentUserId);
        if (currentUser) {
            setMicAllowed(currentUser.micControl);
        }
    }, [usersState, currentUserId]);


    useEffect(() => {
        if (!stream) return;

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const dataArray = new Uint8Array(analyser.fftSize);

        microphone.connect(analyser);

        const checkSpeaking = () => {
            analyser.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((a,b) => a+b)/dataArray.length;

            const speaking = volume > 1;
            setIsSpeaking(speaking);
            socket.emit("user_speaking", { roomId, userId: currentUserId, speaking });
        };

        const interval = setInterval(checkSpeaking, 100);

        return () => clearInterval(interval);
    }, [stream]);


    useEffect(() => {
        socket.on("user_speaking_status", ({ userId,speaking }) => {
            const userElement = document.getElementById(`user-${userId}`);
            if (userElement) {
                userElement.classList.toggle("ring-4",speaking);
                userElement.classList.toggle("ring-yellow-400",speaking);
            }
        });

        return () => {
            socket.off("user_speaking_status");
        };
    }, []);




    useEffect(()=>{
        if(!stream){
            return;
        }
        stream.getAudioTracks().forEach((track)=>{
            track.enabled = micAllowed && micOn;
        })
    },[micOn,micAllowed,stream]);


    useEffect(() => {
        const handleMicPermissionUpdated = ({ userId, micControl }) => {
            console.log("Received mic_permission_updated:", { userId, micControl });
            if (userId === currentUserId) {
                setMicAllowed(micControl);
                console.log("Updated micAllowed to:", micControl);

                if(micControl){
                    setNotification({
                        message: "🐝 Ton micro est ouvert, bourdonne à volonté! 🐝",
                        type: "success",
                    })
                }
                if(!micControl){
                    setNotification({
                        message: "Tu as été mis en silence par la reine. Attends son feu vert pour parler.",
                        type: "danger",
                    })
                }

                if (stream) {
                    stream.getAudioTracks().forEach(track => {
                        track.enabled = micControl;
                    });
                }
            }

            setUsers(prevUsers => prevUsers.map(user => user.userId === userId || user._id === userId ? {
                ...user,
                micControl,
            }:user));
        };

        socket.on("mic_permission_updated", handleMicPermissionUpdated);

        return () => {
            socket.off("mic_permission_updated", handleMicPermissionUpdated);
        };
    }, [currentUserId, stream]);




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


    useEffect(()=>{
        const handleBRB = (event)=>{
            const {brb} = event.detail;
            console.log("BRB MODE : ",brb);
            setBrbActive(brb);
            if(stream){
                stream.getAudioTracks().forEach((track)=>{
                    track.enabled = !brb && micAllowed;
                });
            }
            document.querySelectorAll('audio').forEach((audio)=>{
                audio.muted = brb;
            });
            setBrbActive(brb);
            setMicOn(!brb && micAllowed);
        }
        window.addEventListener("toggle-brb",handleBRB);
        return()=>{
            window.removeEventListener("toggle-brb", handleBRB);
        }
    },[stream])


    //play audio stream that is coming
    const playAudio = (stream) => {
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.muted = false;
        audio.controls = false;
        audio.setAttribute("playsinline", "true");
        document.body.appendChild(audio);
        //audiosRef.current.push(audio); //here i'm saving the audio in a list (for the Bee Right back mode)
    };

    const handleToggleMic =()=>{
        if(!stream || !micAllowed || brbActive){
            return;
        }
        setMicOn(prev=>!prev);
    }
    //console.log("Button rendering: micAllowed =", micAllowed);
    return (
    <div>
        {notification && (
            <NotificationBanner
                message={notification.message}
                type={notification.type}
                onClose={()=>setNotification(null)}/>
        )}
        <button onClick={handleToggleMic}
                disabled={!micAllowed}
                className="bg-black/60 p-2 rounded-full hover:scale-105 transition">
            <img
                src={micOn ? "/assets/open-microphone.png" : "/assets/mute-microphone.png"}
                alt="Mic"
                className="w-[24px] h-[24px] "
            />
        </button>
    </div>
    );

};

export default VoiceChat;