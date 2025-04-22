import { useEffect, useRef, useState } from 'react';
import socket from '../components/socket';

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

const useWebRTC = (roomId) => {
    const [isSharing, setIsSharing] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isInitiator, setIsInitiator] = useState(false);
    const screenStream = useRef(null);
    const peerConnections = useRef({});
    const senders = useRef({});
    const videoRef = useRef(null);

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

        socket.on("offer", handleReceiveOffer);
        socket.on("answer", handleAnswer);
        socket.on("ice-candidate", handleICECandidate);

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

            Object.keys(peerConnections.current).forEach(userId => {
                if (peerConnections.current[userId]) {
                    peerConnections.current[userId].close();
                }
            });
            peerConnections.current = {};
            senders.current = {};
        };
    }, [roomId, isSharing]);

    return {
        isSharing,
        remoteStream,
        isInitiator,
        videoRef,
        startSharing,
        stopSharing
    };
};

export default useWebRTC; 