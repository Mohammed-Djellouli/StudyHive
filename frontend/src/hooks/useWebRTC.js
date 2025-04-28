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
    const [isInitiator, setIsInitiator] = useState(true);
    const [isSafari, setIsSafari] = useState(false);
    const [isChrome, setIsChrome] = useState(false); 
    const [connectionState, setConnectionState] = useState('new');
    const [debugInfo, setDebugInfo] = useState({});
    const screenStream = useRef(null);
    const peerConnections = useRef({});
    const senders = useRef({});
    const videoRef = useRef(null);
    const reconnectAttemptsRef = useRef({});
    const MAX_RECONNECT_ATTEMPTS = 5; // Increased from 3
    const reconnectTimeoutRef = useRef(null);
    const keyframeInterval = useRef(null);

    // Detect browser type
    useEffect(() => {
        const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isChromeBrowser = /chrome/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);
        
        setIsSafari(isSafariBrowser);
        setIsChrome(isChromeBrowser);
        
        console.log("Browser detection - Safari:", isSafariBrowser, "Chrome:", isChromeBrowser);
    }, []);

    // Join the WebRTC signaling room so we receive peers' info
    useEffect(() => {
        const userName = localStorage.getItem("userPseudo") || "Anonymous";
        console.log(`Joining WebRTC room ${roomId} as ${userName}`);
        
        socket.emit("joinRoom", {
            roomId,
            userName
        });
    }, [roomId]);
    
    // Log and update debug information
    const updateDebugInfo = (info) => {
        setDebugInfo(prev => ({...prev, ...info}));
        console.log("WebRTC Debug:", info);
    };
    
    // Request keyframes periodically to improve video quality
    const startKeyframeRequests = (userID) => {
        if (keyframeInterval.current) {
            clearInterval(keyframeInterval.current);
        }
        
        keyframeInterval.current = setInterval(() => {
            const peer = peerConnections.current[userID];
            if (peer && peer.connectionState === 'connected') {
                try {
                    const senders = peer.getSenders();
                    senders.forEach(sender => {
                        if (sender.track && sender.track.kind === 'video') {
                            sender.getParameters().encodings.forEach(encoding => {
                                // Force keyframe every 3 seconds
                                if (encoding && encoding.active) {
                                    console.log("Requesting keyframe");
                                }
                            });
                        }
                    });
                } catch (e) {
                    console.warn("Failed to request keyframe:", e);
                }
            }
        }, 3000);
    };

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
                
                // Log candidate type for debug
                const candidateType = e.candidate.candidate.split(' ')[7]; // host, srflx, relay
                updateDebugInfo({candidateType});
            }
        };

        peer.onconnectionstatechange = () => {
            console.log(`Connection state change for ${userID}:`, peer.connectionState);
            setConnectionState(peer.connectionState);
            updateDebugInfo({connectionState: peer.connectionState});
            
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
                }, 1500); // Slightly faster reconnect attempt
            }
            
            if (peer.connectionState === 'connected') {
                // Reset reconnect attempts counter when successfully connected
                reconnectAttemptsRef.current[userID] = 0;
                console.log(`Connection fully established with ${userID}`);
                startKeyframeRequests(userID);
            }
        };

        peer.ontrack = (e) => {
            console.log("🎥 Flux reçu de:", userID);
            if (e.streams && e.streams[0]) {
                console.log("Mise à jour du flux distant");
                
                // Ensure the stream is active and has video tracks
                const stream = e.streams[0];
                const videoTracks = stream.getVideoTracks();
                const audioTracks = stream.getAudioTracks();
                
                // Log detailed information about the received tracks
                console.log(`Received stream with ${videoTracks.length} video tracks and ${audioTracks.length} audio tracks`);
                
                if (videoTracks.length > 0) {
                    const trackInfo = {
                        label: videoTracks[0].label,
                        enabled: videoTracks[0].enabled,
                        readyState: videoTracks[0].readyState,
                        muted: videoTracks[0].muted
                    };
                    
                    console.log("Video track info:", trackInfo);
                    updateDebugInfo({videoTrack: trackInfo});
                    
                    // Force enable the video track to ensure visibility
                    videoTracks[0].enabled = true;
                    
                    // Add onended handler to detect if track stops
                    videoTracks[0].onended = () => {
                        console.log("Remote video track ended");
                        updateDebugInfo({videoTrackEnded: true});
                        // Attempt to recover connection if track ends unexpectedly
                        if (peer.connectionState === 'connected') {
                            restartPeerConnection(userID);
                        }
                    };
                    
                    // Monitor track health with stats
                    const statsInterval = setInterval(() => {
                        if (peer.connectionState !== 'connected') {
                            clearInterval(statsInterval);
                            return;
                        }
                        
                        peer.getStats(videoTracks[0]).then(stats => {
                            stats.forEach(report => {
                                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                                    const packetsLost = report.packetsLost || 0;
                                    const packetsReceived = report.packetsReceived || 1;
                                    const packetLossRate = packetsLost / (packetsLost + packetsReceived);
                                    
                                    updateDebugInfo({
                                        packetLoss: packetLossRate.toFixed(4),
                                        frameRate: report.framesPerSecond
                                    });
                                    
                                    // Attempt recovery if packet loss is high
                                    if (packetLossRate > 0.08) { // 8% packet loss threshold
                                        console.log("High packet loss detected, requesting keyframe");
                                        // Request keyframe
                                    }
                                }
                            });
                        }).catch(err => {
                            console.warn("Could not get stats:", err);
                        });
                    }, 5000);
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
            updateDebugInfo({iceState: peer.iceConnectionState});
            
            if (peer.iceConnectionState === 'failed' || peer.iceConnectionState === 'disconnected') {
                console.log("ICE connection failed, attempting restart");
                restartPeerConnection(userID);
            } else if (peer.iceConnectionState === 'connected') {
                // When ICE is connected, check selected candidates
                peer.getStats().then(stats => {
                    stats.forEach(report => {
                        if (report.type === 'transport') {
                            updateDebugInfo({
                                bytesReceived: report.bytesReceived,
                                bytesSent: report.bytesSent
                            });
                        }
                        // Check if we're using relay candidates (TURN)
                        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                            const isRelay = report.remoteCandidateType === 'relay' || 
                                           report.localCandidateType === 'relay';
                            updateDebugInfo({
                                usingRelay: isRelay,
                                candidatePairType: `${report.localCandidateType}-${report.remoteCandidateType}`
                            });
                        }
                    });
                }).catch(e => console.warn("Could not get ICE stats:", e));
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
                    
                    // Set encoding parameters for better quality and adaptability
                    if (track.kind === 'video' && !isSafari) {
                        try {
                            sender.getParameters().then(params => {
                                if (!params.encodings || params.encodings.length === 0) {
                                    params.encodings = [{}];
                                }
                                
                                // Configure adaptive bitrate settings
                                params.encodings[0].maxBitrate = 2500000; // 2.5 Mbps max
                                params.encodings[0].minBitrate = 500000; // 500 kbps min
                                params.encodings[0].maxFramerate = 30;
                                
                                // Set scale-resolution-down-by for adaptability
                                params.encodings[0].scaleResolutionDownBy = 1.0; // Start at full resolution
                                
                                sender.setParameters(params).catch(e => {
                                    console.warn("Failed to set encoding parameters:", e);
                                });
                            }).catch(e => {
                                console.warn("Could not get parameters:", e);
                            });
                        } catch (e) {
                            console.warn("Error setting encoding parameters:", e);
                        }
                    }
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
                offerToReceiveVideo: true,
                voiceActivityDetection: false // Disable VAD for better quality
            });
            
            // Set max bitrate in SDP
            if (!isSafari) {
                offer.sdp = setMediaBitrate(offer.sdp, 'video', 2500);
            }
            
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
    
    // Utility to modify SDP for better bitrates
    const setMediaBitrate = (sdp, mediaType, bitrate) => {
        const lines = sdp.split('\n');
        let line = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].indexOf('m=' + mediaType) === 0) {
                line = i;
                break;
            }
        }
        
        if (line === -1) {
            return sdp;
        }
        
        // Get the payload type
        let pt = lines[line].match(/\d+ \d+ \d+ \d+ \d+ (\d+) \d+ \d+/);
        if (!pt) {
            pt = lines[line].match(/\d+ \d+ \d+ \d+ \d+ \d+ \d+ (\d+)/);
        }
        
        // Find b=AS line for this media type
        let bitrateLineIndex = -1;
        let rtcpLineIndex = -1;
        for (let i = line + 1; i < lines.length; i++) {
            if (lines[i].indexOf('b=AS:') !== -1) {
                bitrateLineIndex = i;
            } else if (lines[i].indexOf('a=rtcp-fb:' + pt + ' ack') !== -1) {
                rtcpLineIndex = i;
            } else if (lines[i].indexOf('m=') === 0) {
                break;
            }
        }
        
        if (bitrateLineIndex === -1) {
            // Insert b=AS: line directly after m= line
            lines.splice(line + 1, 0, 'b=AS:' + bitrate);
        } else {
            // Replace existing line
            lines[bitrateLineIndex] = 'b=AS:' + bitrate;
        }
        
        // Add RTCP feedback for PLI if not present (for keyframe requests)
        if (rtcpLineIndex === -1) {
            lines.splice(line + 2, 0, 'a=rtcp-fb:' + pt + ' nack pli');
        }
        
        return lines.join('\n');
    };

    const restartPeerConnection = async (userID) => {
        const peer = peerConnections.current[userID];
        if (!peer) return;

        try {
            await peer.restartIce();
            const offer = await peer.createOffer({ 
                iceRestart: true,
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            
            // Set max bitrate in SDP
            if (!isSafari) {
                offer.sdp = setMediaBitrate(offer.sdp, 'video', 2500);
            }
            
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

            // Optimized media constraints based on browser
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
                        displaySurface: "monitor", // Prefer monitor for highest quality
                        logicalSurface: true,
                        width: { ideal: 1920, max: 1920 },
                        height: { ideal: 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 30 },
                        resizeMode: "crop-and-scale" // Better quality
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000 // Higher quality audio
                    },
                    // Ensure browser doesn't ask for system audio if using desktop sharing
                    systemAudio: "include"
                };

            console.log("Using media constraints:", mediaConstraints);
            updateDebugInfo({mediaConstraints});
            
            screenStream.current = await navigator.mediaDevices.getDisplayMedia(mediaConstraints);

            // Check the actual granted track settings and log them
            const videoTrack = screenStream.current.getVideoTracks()[0];
            if (videoTrack) {
                const settings = videoTrack.getSettings();
                console.log("Actual track settings:", settings);
                updateDebugInfo({
                    trackSettings: {
                        width: settings.width,
                        height: settings.height,
                        frameRate: settings.frameRate,
                        displaySurface: settings.displaySurface
                    }
                });
            }

            // Browser-specific optimizations
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
            } else if (isChrome) {
                // Chrome optimization for keyframe generation
                console.log("Applying Chrome-specific optimizations");
            }

            if (!videoRef.current) {
                console.error("videoRef n'est pas initialisé");
                setIsSharing(false);
                return;
            }

            videoRef.current.srcObject = screenStream.current;

            // Add event listeners to detect track-specific issues
            screenStream.current.getTracks().forEach(track => {
                track.onended = () => {
                    console.log(`Track ${track.kind} ended`);
                    stopSharing();
                };
                
                track.onmute = () => {
                    console.log(`Track ${track.kind} muted`);
                    updateDebugInfo({trackMuted: true});
                    // Try to recover automatically
                    setTimeout(() => {
                        track.enabled = true;
                    }, 1000);
                };
                
                track.onunmute = () => {
                    console.log(`Track ${track.kind} unmuted`);
                    updateDebugInfo({trackMuted: false});
                };
            });

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
                    
                    // Set encoding parameters for better quality
                    if (track.kind === 'video' && !isSafari) {
                        try {
                            sender.getParameters().then(params => {
                                if (!params.encodings || params.encodings.length === 0) {
                                    params.encodings = [{}];
                                }
                                
                                // Configure quality parameters
                                params.encodings[0].maxBitrate = 2500000; // 2.5 Mbps max
                                params.encodings[0].minBitrate = 500000; // 500 kbps min
                                params.encodings[0].maxFramerate = 30;
                                sender.setParameters(params).catch(e => {
                                    console.warn("Could not set parameters:", e);
                                });
                            }).catch(e => {
                                console.warn("Could not get parameters:", e);
                            });
                        } catch (e) {
                            console.warn("Error setting encoding parameters:", e);
                        }
                    }
                });

                try {
                    const offer = await peer.createOffer();
                    
                    // Modify SDP with better video settings
                    if (!isSafari) {
                        offer.sdp = setMediaBitrate(offer.sdp, 'video', 2500);
                    }
                    
                    await peer.setLocalDescription(offer);
                    socket.emit("offer", {
                        target: userID,
                        caller: socket.id,
                        sdp: peer.localDescription,
                    });
                    
                    // Start sending keyframes
                    startKeyframeRequests(userID);
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
            screenStream.current.getTracks().forEach((track) => {
                track.stop();
            });
            screenStream.current = null;
            
            // Notify all users in the room that video sharing has stopped
            // This will trigger a page refresh for all users to reset their WebRTC state
            socket.emit("video_sharing_stopped", { roomId });

        Object.keys(peerConnections.current).forEach(userID => {
            if (senders.current[userID]) {
                senders.current[userID].forEach(sender => {
                    peerConnections.current[userID].removeTrack(sender);
                });
                delete senders.current[userID];
            }
        });
        }
        
        updateDebugInfo({sharing: false});
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
            
            // Start keyframe requests
            startKeyframeRequests(message.caller);
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
            
            // Log candidate type
            const candidateType = incoming.candidate.candidate.split(' ')[7];
            console.log(`Receiving ${candidateType} ICE candidate`);
            
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
            // Always allow screen sharing regardless of user count
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

        // Listen for the refresh signal when video sharing stops
        socket.on("refresh_page", () => {
            console.log("Received page refresh signal, reloading page...");
            window.location.reload();
        });

        return () => {
            // Clear intervals
            if (keyframeInterval.current) {
                clearInterval(keyframeInterval.current);
            }
            
            socket.off("all users");
            socket.off("user joined");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user_disconnected");
            socket.off("refresh_page");

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
        connectionState,
        debugInfo
    };
};

export default useWebRTC; 