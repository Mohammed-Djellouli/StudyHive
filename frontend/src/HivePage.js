import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import YouTube from "react-youtube";
import socket from "./components/socket";
import Big_Logo_At_Left from "./components/hivePage/hiveHeader/Big_Logo_At_Left";
import Left_bar_Icons_members_In_Room from "./components/hivePage/hiveBody/Left_bar_Icons_members_In_Room";
import SearchBar from "./components/hivePage/hiveHeader/SeachBar";
import LeftBarTools from "./components/hivePage/hiveBody/LeftBarTools";
import VideoList from "./components/videoPlayer/VideoList";
import HiveTimerBanner from "./components/hivePage/hiveHandle/HiveTimerBanner";
import ChatBox from "./components/Communication/Chat/chatBox";
import VoiceChat from "./components/Communication/MicChat/VoiceChat";
import useVideoPlayer from './hooks/useVideoPlayer';

import "./App.css";

function HivePage() {
    const { idRoom } = useParams();
    const [ownerPseudo, setOwnerPseudo] = useState(null);
    const [isQueenBeeMode, setIsQueenBeeMode] = useState(false);
    const [timerEndsAt, setTimerEndsAt] = useState(null);
    const [ownerId, setOwnerId] = useState(null);
    const [users, setUsers] = useState([]);
    const [isSharing, setIsSharing] = useState(false);
    const [isInitiator, setIsInitiator] = useState(false);
    const videoRef = useRef(null);
    const screenStream = useRef(null);
    const peerConnections = useRef({});
    const senders = useRef({});
    const [remoteStream, setRemoteStream] = useState(null);

    const {
        videos,
        videoId,
        needsManualPlay,
        playerRef,
        playerOpts,
        handleSearch,
        handleVideoSelect,
        onPlayerReady,
        onPlayerStateChange,
        handleSeek,
        handleManualPlay
    } = useVideoPlayer(idRoom);

    const peerConfig = {
        trickle: false,
        config: {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                {
                    urls: "turn:numb.viagenie.ca",
                    username: "webrtc@live.com",
                    credential: "muazkh"
                }
            ]
        }
    };

    const createPeer = (userID) => {
        console.log("Création d'un nouveau peer pour:", userID);
        if (peerConnections.current[userID]) {
            console.log("Peer existe déjà, réutilisation");
            return peerConnections.current[userID];
        }

        const peer = new RTCPeerConnection(peerConfig.config);

        peer.onicecandidate = (e) => {
            if (e.candidate) {
                console.log("Envoi du candidat ICE à:", userID);
                socket.emit("ice-candidate", {
                    target: userID,
                    candidate: e.candidate,
                });
            }
        };

        peer.ontrack = (e) => {
            console.log("🎥 Flux reçu de:", userID);
            if (e.streams && e.streams[0]) {
                console.log("Mise à jour du flux distant");
                setRemoteStream(e.streams[0]);
            }
        };

        peer.oniceconnectionstatechange = () => {
            console.log("État de la connexion ICE pour", userID, ":", peer.iceConnectionState);
            if (peer.iceConnectionState === 'failed') {
                console.log("Tentative de reconnexion pour:", userID);
                peer.restartIce();
            }
        };

        peerConnections.current[userID] = peer;
        return peer;
    };

    const startSharing = async () => {
        try {
            setIsSharing(true);

            await new Promise(resolve => setTimeout(resolve, 100));

            if (!videoRef.current) {
                console.error("videoRef n'est pas initialisé");
                setIsSharing(false);
                return;
            }

            screenStream.current = await navigator.mediaDevices.getDisplayMedia({ 
                video: {
                    cursor: "always"
                },
                audio: false
            });

            videoRef.current.srcObject = screenStream.current;

            Object.keys(peerConnections.current).forEach(async (userID) => {
                const peer = peerConnections.current[userID];
                
                if (senders.current[userID]) {
                    senders.current[userID].forEach(sender => {
                        peer.removeTrack(sender);
                    });
                }

                senders.current[userID] = [];
                screenStream.current.getTracks().forEach((track) => {
                    const sender = peer.addTrack(track, screenStream.current);
                    if (!senders.current[userID]) senders.current[userID] = [];
                    senders.current[userID].push(sender);
                });

                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit("offer", {
                        target: userID,
                        caller: socket.id,
                        sdp: peer.localDescription,
                    });
                } catch (err) {
                    console.error("Erreur lors de la création de l'offre:", err);
                }
            });

            screenStream.current.getVideoTracks()[0].onended = () => {
                stopSharing();
            };
        } catch (err) {
            console.error("Erreur de partage d'écran:", err);
            setIsSharing(false);
            if (screenStream.current) {
                screenStream.current.getTracks().forEach(track => track.stop());
                screenStream.current = null;
            }
        }
    };

    const stopSharing = () => {
        if (screenStream.current) {
            screenStream.current.getTracks().forEach(track => track.stop());
            screenStream.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsSharing(false);

        Object.keys(peerConnections.current).forEach(userID => {
            if (senders.current[userID]) {
                senders.current[userID].forEach(sender => {
                    peerConnections.current[userID].removeTrack(sender);
                });
                delete senders.current[userID];
            }
        });
    };

    const handleReceiveOffer = async (incoming) => {
        try {
            console.log("Traitement de l'offre reçue de:", incoming.caller);
            let peer = peerConnections.current[incoming.caller];
            
            if (!peer) {
                console.log("Création d'un nouveau peer pour l'offre");
                peer = createPeer(incoming.caller);
            } else if (peer.signalingState !== "stable") {
                console.log("Peer non stable, ignoré");
                return;
            }

            await peer.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
            console.log("Description distante définie");

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            console.log("Envoi de la réponse à:", incoming.caller);
            socket.emit("answer", {
                target: incoming.caller,
                caller: socket.id,
                sdp: peer.localDescription,
            });
        } catch (err) {
            console.error("Erreur lors de la réception de l'offre:", err);
        }
    };

    const handleAnswer = async (message) => {
        try {
            console.log("Traitement de la réponse de:", message.caller);
            const peer = peerConnections.current[message.caller];
            
            if (!peer) {
                console.log("Pas de peer trouvé pour:", message.caller);
                return;
            }

            if (peer.signalingState === "stable") {
                console.log("Connection déjà stable, ignoré");
                return;
            }

            await peer.setRemoteDescription(new RTCSessionDescription(message.sdp));
            console.log("Description distante définie avec succès");
        } catch (err) {
            console.error("Erreur lors de la réception de la réponse:", err);
        }
    };

    const handleICECandidate = (incoming) => {
        try {
            const peer = peerConnections.current[incoming.caller];
            if (!peer) {
                console.log("Pas de peer trouvé pour le candidat ICE de:", incoming.caller);
                return;
            }
            
            if (peer.remoteDescription === null) {
                console.log("Pas de description distante, candidat ICE ignoré");
                return;
            }

            const candidate = new RTCIceCandidate(incoming.candidate);
            peer.addIceCandidate(candidate).catch(e => {
                console.error("Erreur lors de l'ajout du candidat ICE:", e);
            });
        } catch (err) {
            console.error("Erreur lors du traitement du candidat ICE:", err);
        }
    };

    useEffect(() => {
        window.onerror = function (message, source, lineno, colno, error) {
            console.error("Global JS Error:", { message, source, lineno, colno, error });
        };
    }, []);

    useEffect(() => {
        fetch(`http://localhost:5001/api/hive/${idRoom}`)
            .then(res => res.json())
            .then(data => {
                console.log("ROOM :", data);
                setOwnerPseudo(data.ownerPseudo);
                setIsQueenBeeMode(data.isQueenBeeMode);
                setTimerEndsAt(data.timerEndsAt);
                setUsers(data.users);
                setOwnerId(data.idOwner);
            });

        socket.emit("joinRoom", { roomId: idRoom, userName: localStorage.getItem("userPseudo") || "Anonymous" });

        socket.on("all users", (users) => {
            if (users.length === 0) setIsInitiator(true);
            users.forEach(userID => {
                if (!peerConnections.current[userID]) {
                    createPeer(userID);
                }
            });
        });

        socket.on("user joined", async (userID) => {
            console.log("Nouvel utilisateur rejoint:", userID);
            const peer = createPeer(userID);
            
            // Si on est en train de partager l'écran, on l'envoie au nouvel utilisateur
            if (isSharing && screenStream.current) {
                try {
                    screenStream.current.getTracks().forEach((track) => {
                        console.log("Ajout du track pour le nouvel utilisateur");
                        const sender = peer.addTrack(track, screenStream.current);
                        if (!senders.current[userID]) senders.current[userID] = [];
                        senders.current[userID].push(sender);
                    });

                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    console.log("Envoi de l'offre au nouvel utilisateur");
                    socket.emit("offer", {
                        target: userID,
                        caller: socket.id,
                        sdp: peer.localDescription,
                    });
                } catch (err) {
                    console.error("Erreur lors de l'envoi du partage au nouvel utilisateur:", err);
                }
            }
        });

        socket.on("offer", async (incoming) => {
            console.log("Offre reçue de:", incoming.caller);
            await handleReceiveOffer(incoming);
        });

        socket.on("answer", async (message) => {
            console.log("Réponse reçue de:", message.caller);
            await handleAnswer(message);
        });

        socket.on("ice-candidate", (incoming) => {
            console.log("Candidat ICE reçu de:", incoming.caller);
            handleICECandidate(incoming);
        });

        socket.on("user_disconnected", (userId) => {
            console.log("Utilisateur déconnecté:", userId);
            if (peerConnections.current[userId]) {
                peerConnections.current[userId].close();
                delete peerConnections.current[userId];
            }
            if (senders.current[userId]) {
                delete senders.current[userId];
            }
        });

        return () => {
            socket.off("all users");
            socket.off("user joined");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user_disconnected");
            socket.off("syncVideo");

            // Nettoyer les connexions existantes
            Object.keys(peerConnections.current).forEach(userId => {
                if (peerConnections.current[userId]) {
                    peerConnections.current[userId].close();
                }
            });
            peerConnections.current = {};
            senders.current = {};
        };
    }, [idRoom, isSharing]);

    const location = useLocation();

    console.log("State reçu dans HivePage :", ownerPseudo, isQueenBeeMode);
    return (
        <div className="bg-center bg-cover bg-fixed bg-no-repeat min-h-screen text-white bg-[#1a1a1a]"
            style={{ backgroundImage: "url('/assets/bg.png')", backgroundSize: "270%" }}>
            <Big_Logo_At_Left />
            <Left_bar_Icons_members_In_Room ownerPseudo={ownerPseudo} isQueenBeeMode={isQueenBeeMode} users={users.filter((user) => user._id !== ownerId)} />
            
            <SearchBar onSearch={handleSearch} />

            <div className="absolute left-[150px] top-[100px] w-[850px] h-[480px] overflow-y-auto rounded-lg bg-[#1a1a1a] p-4 z-10">
                {isSharing ? (
                    <div className="relative w-full h-full">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full rounded shadow bg-black object-contain"
                            srcObject={screenStream.current}
                        />
                        <button
                            onClick={stopSharing}
                            className="absolute top-2 right-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Arrêter le partage
                        </button>
                    </div>
                ) : remoteStream ? (
                    <div className="relative w-full h-full">
                        <video
                            autoPlay
                            playsInline
                            className="w-full h-full rounded shadow bg-black object-contain"
                            ref={(video) => {
                                if (video) {
                                    video.srcObject = remoteStream;
                                    video.onloadedmetadata = () => {
                                        console.log("Métadonnées du flux distant chargées");
                                        video.play().catch(err => 
                                            console.error("Erreur de lecture:", err)
                                        );
                                    };
                                }
                            }}
                        />
                    </div>
                ) : videoId ? (
                    <div className="w-[913px] h-[516px] bg-black/40 shadow-lg rounded-lg overflow-hidden" onMouseUp={handleSeek}>
                        <YouTube
                            videoId={videoId}
                            opts={playerOpts}
                            onReady={onPlayerReady}
                            onStateChange={onPlayerStateChange}
                            onSeek={handleSeek}
                            className="w-full h-full"
                        />
                        {needsManualPlay && (
                            <div className="mt-4 text-center">
                                <button 
                                    className="px-4 py-2 bg-yellow-400 text-black font-bold rounded shadow-md" 
                                    onClick={handleManualPlay}
                                >
                                    Lancer la lecture
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <VideoList videos={videos} onVideoSelect={handleVideoSelect} />
                )}
            </div>

            <div className="fixed bottom-10 right-4 w-[90vw] max-w-[385px]">
                <ChatBox />
            </div>
            <div className="fixed bottom-3 right-80">
                <VoiceChat />
            </div>
            <HiveTimerBanner ownerPseudo={ownerPseudo} timerEndsAt={timerEndsAt} roomId={idRoom} />
            <LeftBarTools 
                ownerPseudo={ownerPseudo} 
                isQueenBeeMode={isQueenBeeMode} 
                onStartSharing={startSharing}
                isInitiator={isInitiator}
                isSharing={isSharing}
            />
        </div>
    );
}

export default HivePage;