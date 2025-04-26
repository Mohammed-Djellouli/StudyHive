import { useEffect, useRef, useState } from 'react';
import socket from '../components/socket';

const peerConfig = {
    trickle: false,
    config: {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
            {
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject"
            },
            {
                urls: "turn:openrelay.metered.ca:443",
                username: "openrelayproject",
                credential: "openrelayproject"
            },
            {
                urls: "turn:openrelay.metered.ca:443?transport=tcp",
                username: "openrelayproject",
                credential: "openrelayproject"
            }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        sdpSemantics: 'unified-plan'
    }
};

const useWebRTC = (roomId) => {
    const [isSharing, setIsSharing] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isInitiator, setIsInitiator] = useState(false);
    const [isSafari, setIsSafari] = useState(false);
    const [connectionState, setConnectionState] = useState('new');
    const screenStream = useRef(null);
    const peerConnections = useRef({});
    const senders = useRef({});
    const videoRef = useRef(null);
    const reconnectAttemptsRef = useRef({});
    const MAX_RECONNECT_ATTEMPTS = 3;
    const reconnectTimeoutRef = useRef(null);

    // Detect Safari browser
    useEffect(() => {
        const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        setIsSafari(isSafariBrowser);
        console.log("Browser detection - Safari:", isSafariBrowser);
    }, []);

    const createPeer = (userID) => {
        console.log("Création d'un nouveau peer pour:", userID);
        if (peerConnections.current[userID] && peerConnections.current[userID].connectionState !== 'closed') {
            console.log("Peer existe déjà, réutilisation");
            return peerConnections.current[userID];
        }

        // Close existing connection if it exists
        if (peerConnections.current[userID]) {
            peerConnections.current[userID].close();
        }

        const peer = new RTCPeerConnection(peerConfig.config);
        
        // Store ICE candidates until remote description is set
        const iceCandidatesQueue = [];
        peer.iceCandidatesQueue = iceCandidatesQueue;
        reconnectAttemptsRef.current[userID] = 0;

        peer.onicecandidate = (e) => {
            if (e.candidate) {
                console.log("Envoi du candidat ICE à:", userID);
                socket.emit("ice-candidate", {
                    target: userID,
                    candidate: e.candidate,
                });
            }
        };

        peer.onconnectionstatechange = () => {
            console.log(`Connection state change for ${userID}:`, peer.connectionState);
            setConnectionState(peer.connectionState);
            
            if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
                console.log("Connection failed or disconnected, attempting reconnection");
                
                // Clear any existing timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
                
                // Try to reconnect after a delay
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (reconnectAttemptsRef.current[userID] < MAX_RECONNECT_ATTEMPTS) {
                        console.log(`Reconnection attempt ${reconnectAttemptsRef.current[userID] + 1} for ${userID}`);
                        reconnectAttemptsRef.current[userID]++;
                        restartPeerConnection(userID);
                    } else {
                        console.log(`Max reconnection attempts reached for ${userID}`);
                        // Create a new peer connection from scratch
                        if (peerConnections.current[userID]) {
                            peerConnections.current[userID].close();
                            delete peerConnections.current[userID];
                        }
                        const newPeer = createPeer(userID);
                        initiateConnectionIfNeeded(newPeer, userID);
                        reconnectAttemptsRef.current[userID] = 0;
                    }
                }, 2000); // Wait 2 seconds before trying again
            }
            
            if (peer.connectionState === 'connected') {
                // Reset reconnect attempts counter when successfully connected
                reconnectAttemptsRef.current[userID] = 0;
                console.log(`Connection fully established with ${userID}`);
            }
        };

        peer.ontrack = (e) => {
            console.log("🎥 Flux reçu de:", userID);
            if (e.streams && e.streams[0]) {
                console.log("Mise à jour du flux distant");
                
                // Ensure the stream is active and has video tracks
                const stream = e.streams[0];
                const videoTracks = stream.getVideoTracks();
                
                // Log detailed information about the received tracks
                console.log(`Received stream with ${videoTracks.length} video tracks and ${stream.getAudioTracks().length} audio tracks`);
                
                if (videoTracks.length > 0) {
                    console.log("Video track info:", {
                        label: videoTracks[0].label,
                        enabled: videoTracks[0].enabled,
                        readyState: videoTracks[0].readyState,
                        muted: videoTracks[0].muted
                    });
                    
                    // Force enable the video track to ensure visibility
                    videoTracks[0].enabled = true;
                }
                
                // Clone the stream before setting it to ensure React rerenders the component
                const clonedStream = new MediaStream();
                stream.getTracks().forEach(track => {
                    clonedStream.addTrack(track);
                });
                
                setRemoteStream(clonedStream);
                
                // If we're receiving a track, the connection is confirmed as working properly
                setConnectionState('connected');
            }
        };

        peer.oniceconnectionstatechange = () => {
            console.log("État de la connexion ICE pour", userID, ":", peer.iceConnectionState);
            if (peer.iceConnectionState === 'failed' || peer.iceConnectionState === 'disconnected') {
                console.log("ICE connection failed, attempting restart");
                restartPeerConnection(userID);
            }
        };

        peerConnections.current[userID] = peer;
        return peer;
    };

    // Check if we need to initiate a connection
    const initiateConnectionIfNeeded = (peer, userID) => {
        if (isSharing && screenStream.current) {
            try {
                console.log("Initiating connection with shared screen");
                screenStream.current.getTracks().forEach((track) => {
                    console.log(`Adding ${track.kind} track to peer connection`);
                    const sender = peer.addTrack(track, screenStream.current);
                    if (!senders.current[userID]) senders.current[userID] = [];
                    senders.current[userID].push(sender);
                });
                
                // Create and send offer
                createAndSendOffer(peer, userID);
            } catch (err) {
                console.error("Error initiating connection:", err);
            }
        }
    };

    // Helper function to create and send an offer
    const createAndSendOffer = async (peer, userID) => {
        try {
            const offer = await peer.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await peer.setLocalDescription(offer);
            console.log("Sending offer to:", userID);
            socket.emit("offer", {
                target: userID,
                caller: socket.id,
                sdp: peer.localDescription,
            });
        } catch (err) {
            console.error("Error creating offer:", err);
        }
    };

    const restartPeerConnection = async (userID) => {
        const peer = peerConnections.current[userID];
        if (!peer) return;

        try {
            await peer.restartIce();
            const offer = await peer.createOffer({ iceRestart: true });
            await peer.setLocalDescription(offer);
            socket.emit("offer", {
                target: userID,
                caller: socket.id,
                sdp: peer.localDescription
            });
        } catch (err) {
            console.error("Error restarting ICE:", err);
        }
    };

    const startSharing = async () => {
        try {
            setIsSharing(true);

            await new Promise(resolve => setTimeout(resolve, 100));

            // Safari specific media constraints
            const mediaConstraints = isSafari ? 
                { 
                    video: {
                        width: { ideal: 1280, max: 1920 },
                        height: { ideal: 720, max: 1080 },
                        frameRate: { ideal: 24, max: 30 }
                    },
                    audio: true
                } : 
                { 
                    video: {
                        cursor: "always",
                        displaySurface: "monitor",
                        logicalSurface: true,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        frameRate: { ideal: 30 }
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100
                    }
                };

            console.log("Using media constraints:", mediaConstraints);
            
            screenStream.current = await navigator.mediaDevices.getDisplayMedia(mediaConstraints);

            // Safari-specific handling
            if (isSafari) {
                console.log("Applying Safari-specific optimizations");
                const videoTrack = screenStream.current.getVideoTracks()[0];
                if (videoTrack) {
                    // Set lower bitrate constraints for Safari
                    try {
                        const sender = peerConnections.current[Object.keys(peerConnections.current)[0]]?.getSenders().find(s => s.track.kind === 'video');
                        if (sender) {
                            const params = sender.getParameters();
                            if (!params.encodings) {
                                params.encodings = [{}];
                            }
                            params.encodings[0].maxBitrate = 1000000; // 1 Mbps
                            await sender.setParameters(params);
                            console.log("Set lower bitrate for Safari");
                        }
                    } catch (e) {
                        console.warn("Could not set encoding parameters:", e);
                    }
                }
            }

            if (!videoRef.current) {
                console.error("videoRef n'est pas initialisé");
                setIsSharing(false);
                return;
            }

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
            }

            const desc = new RTCSessionDescription(incoming.sdp);
            
            if (peer.signalingState !== "stable") {
                console.log("Signaling state not stable, rolling back");
                await Promise.all([
                    peer.setLocalDescription({type: "rollback"}),
                    peer.setRemoteDescription(desc)
                ]);
            } else {
                await peer.setRemoteDescription(desc);
            }

            console.log("Description distante définie");

            // Process any queued ICE candidates
            if (peer.iceCandidatesQueue && peer.iceCandidatesQueue.length > 0) {
                console.log("Processing queued ICE candidates");
                await Promise.all(
                    peer.iceCandidatesQueue.map(candidate => 
                        peer.addIceCandidate(candidate)
                    )
                );
                peer.iceCandidatesQueue = [];
            }

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

    const handleICECandidate = async (incoming) => {
        try {
            const peer = peerConnections.current[incoming.caller];
            if (!peer) {
                console.log("Pas de peer trouvé pour le candidat ICE de:", incoming.caller);
                return;
            }

            const candidate = new RTCIceCandidate(incoming.candidate);
            
            if (peer.remoteDescription && peer.remoteDescription.type) {
                await peer.addIceCandidate(candidate);
                console.log("ICE candidate added successfully");
            } else {
                console.log("Queuing ICE candidate until remote description is set");
                peer.iceCandidatesQueue.push(candidate);
            }
        } catch (err) {
            console.error("Erreur lors du traitement du candidat ICE:", err);
        }
    };

    // Check connection status periodically
    useEffect(() => {
        const checkConnectionInterval = setInterval(() => {
            Object.keys(peerConnections.current).forEach(userID => {
                const peer = peerConnections.current[userID];
                if (peer && (peer.connectionState === 'disconnected' || 
                    peer.iceConnectionState === 'disconnected')) {
                    console.log(`Connection check: reconnecting to ${userID}`);
                    restartPeerConnection(userID);
                }
            });
        }, 10000); // Check every 10 seconds
        
        return () => clearInterval(checkConnectionInterval);
    }, []);

    // Handle room joining effect - adjust the existing useEffect that handles "user joined" event
    useEffect(() => {
        socket.on("all users", (users) => {
            if (users.length === 0) setIsInitiator(true);
            users.forEach(userID => {
                if (!peerConnections.current[userID] || 
                    peerConnections.current[userID].connectionState === 'closed') {
                    const peer = createPeer(userID);
                    initiateConnectionIfNeeded(peer, userID);
                }
            });
        });

        socket.on("user joined", async (userID) => {
            console.log("Nouvel utilisateur rejoint:", userID);
            // Allow a small delay before creating the peer to ensure the other side is ready
            setTimeout(() => {
                const peer = createPeer(userID);
                
                if (isSharing && screenStream.current) {
                    try {
                        screenStream.current.getTracks().forEach((track) => {
                            console.log("Ajout du track pour le nouvel utilisateur");
                            const sender = peer.addTrack(track, screenStream.current);
                            if (!senders.current[userID]) senders.current[userID] = [];
                            senders.current[userID].push(sender);
                        });

                        createAndSendOffer(peer, userID);
                    } catch (err) {
                        console.error("Erreur lors de l'envoi du partage au nouvel utilisateur:", err);
                    }
                }
            }, 1000); // 1 second delay
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
        stopSharing,
        connectionState
    };
};

export default useWebRTC; 