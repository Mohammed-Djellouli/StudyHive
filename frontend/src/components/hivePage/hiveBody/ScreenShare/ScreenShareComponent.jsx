import React, { useEffect, useCallback, useState, useRef } from 'react';

const ScreenShareComponent = ({ videoRef, isSharing, remoteStream, onStopSharing }) => {
    const [retryCount, setRetryCount] = useState(0);
    const [isSafari, setIsSafari] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    const [streamInfo, setStreamInfo] = useState({});
    const maxRetries = 3;
    const remoteVideoRef = useRef(null);

    // Detect Safari browser
    useEffect(() => {
        const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        setIsSafari(isSafariBrowser);
        console.log("Video component - Safari detection:", isSafariBrowser);
    }, []);

    // Check and update stream info for debugging
    useEffect(() => {
        if (remoteStream && debugMode) {
            const videoTracks = remoteStream.getVideoTracks();
            const audioTracks = remoteStream.getAudioTracks();
            
            setStreamInfo({
                id: remoteStream.id,
                active: remoteStream.active,
                videoTracks: videoTracks.length,
                audioTracks: audioTracks.length,
                videoTrackEnabled: videoTracks.length > 0 ? videoTracks[0].enabled : false,
                videoTrackReadyState: videoTracks.length > 0 ? videoTracks[0].readyState : 'none',
                audioTrackEnabled: audioTracks.length > 0 ? audioTracks[0].enabled : false
            });
        }
    }, [remoteStream, debugMode]);

    const handleVideoError = useCallback((e) => {
        console.error('Video playback error:', e);
        if (retryCount < maxRetries) {
            console.log(`Tentative de récupération ${retryCount + 1}/${maxRetries}`);
            setRetryCount(prev => prev + 1);
            
            if (e.target.srcObject) {
                const videoTracks = e.target.srcObject.getVideoTracks();
                if (videoTracks.length > 0) {
                    // Try restarting the video track
                    videoTracks[0].enabled = false;
                    setTimeout(() => {
                        videoTracks[0].enabled = true;
                    }, 1000);
                }
            }
        } else {
            console.error('Échec de la récupération après plusieurs tentatives');
            if (e.target.srcObject) {
                const tracks = e.target.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        }
    }, [retryCount]);

    const initializeVideo = useCallback((video, stream) => {
        if (!video || !stream) return;

        console.log("Initializing video stream, Safari:", isSafari, "Stream active:", stream.active);
        
        // Force stream cloning to trigger a fresh rendering
        try {
            const clonedStream = new MediaStream();
            
            // For Safari, ensure we're only getting video tracks to avoid audio issues
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0) {
                clonedStream.addTrack(videoTracks[0]);
                console.log("Added video track:", videoTracks[0].label, "Enabled:", videoTracks[0].enabled);
                
                // Force track to be enabled
                videoTracks[0].enabled = true;
                
                // For debugging - log track constraints
                console.log("Video track settings:", videoTracks[0].getSettings());
            } else {
                console.error("No video tracks found in stream");
            }
            
            video.srcObject = clonedStream;
            
            // Force autoplay with muted attribute to bypass autoplay policies
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;
            
            // Try playing immediately in case metadata is already loaded
            video.play().catch(err => {
                console.log("Initial play failed, waiting for metadata:", err);
            });
        } catch (e) {
            console.error("Failed to set up video stream:", e);
            // Fallback to original method
            video.srcObject = stream;
        }

        video.onloadedmetadata = () => {
            console.log("Métadonnées du flux distant chargées");
            video.play().catch(err => {
                console.error("Erreur de lecture après chargement des métadonnées:", err);
                // Try alternate approach by manually starting the play
                setTimeout(() => {
                    video.play().catch(e => {
                        console.error("Retry play failed:", e);
                        handleVideoError({ target: video });
                    });
                }, 1000);
            });
        };

        // Monitor track ended events
        stream.getTracks().forEach(track => {
            track.onended = () => {
                console.log("Track ended:", track.kind);
                if (track.kind === 'video' && isSharing) {
                    onStopSharing();
                }
            };
            
            // Add event for mute/unmute
            track.onmute = () => {
                console.log("Track muted:", track.kind);
                // Try to unmute
                setTimeout(() => {
                    track.enabled = true;
                }, 2000);
            };
            
            track.onunmute = () => {
                console.log("Track unmuted:", track.kind);
            };
        });
    }, [isSharing, onStopSharing, isSafari, handleVideoError]);

    // For remote video stream
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            initializeVideo(remoteVideoRef.current, remoteStream);
        }
    }, [remoteStream, initializeVideo]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            videoElement.addEventListener('error', handleVideoError);
        }
        return () => {
            if (videoElement) {
                videoElement.removeEventListener('error', handleVideoError);
            }
        };
    }, [handleVideoError]);

    // Auto-play retry mechanism with a delay instead of manual button
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            // Try playing the video automatically with delays to overcome autoplay restrictions
            const timeouts = [2000, 5000, 10000]; // Try at different intervals
            
            timeouts.forEach((delay) => {
                setTimeout(() => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.play().catch(err => {
                            console.log(`Auto-play retry after ${delay}ms failed:`, err);
                        });
                    }
                }, delay);
            });
        }
    }, [remoteStream]);

    // Reset retry count when stream changes
    useEffect(() => {
        setRetryCount(0);
    }, [remoteStream]);

    // Toggle debug mode with keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                setDebugMode(prev => !prev);
                console.log("Debug mode toggled:", !debugMode);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [debugMode]);

    return (
        <div className="relative w-full h-full">
            {isSharing ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full rounded shadow bg-black object-contain"
                        style={{ transform: 'scaleX(1)' }}
                    />
                    <button
                        onClick={onStopSharing}
                        className="absolute top-2 right-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Arrêter le partage
                    </button>
                </>
            ) : remoteStream ? (
                <>
                    <video
                        autoPlay
                        playsInline
                        className="w-full h-full rounded shadow bg-black object-contain"
                        style={{ transform: 'scaleX(1)' }}
                        ref={remoteVideoRef}
                        onError={handleVideoError}
                        muted
                    />
                    
                    {/* Debug information overlay - only visible in debug mode */}
                    {debugMode && (
                        <div className="absolute top-0 left-0 bg-black bg-opacity-70 text-white p-4 text-xs max-w-xs">
                            <h3 className="font-bold mb-2">Debug Info:</h3>
                            <p>Stream Active: {streamInfo.active ? 'Yes' : 'No'}</p>
                            <p>Video Tracks: {streamInfo.videoTracks}</p>
                            <p>Video Enabled: {streamInfo.videoTrackEnabled ? 'Yes' : 'No'}</p>
                            <p>Video State: {streamInfo.videoTrackReadyState}</p>
                            <p>Audio Tracks: {streamInfo.audioTracks}</p>
                            <p>Browser: {isSafari ? 'Safari' : 'Chrome/Other'}</p>
                            <p>Retries: {retryCount}/{maxRetries}</p>
                            <button 
                                onClick={() => setDebugMode(false)}
                                className="mt-2 px-2 py-1 bg-gray-700 text-white text-xs rounded"
                            >
                                Hide Debug
                            </button>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
};

export default ScreenShareComponent; 