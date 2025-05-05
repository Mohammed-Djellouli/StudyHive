import React, { useState, useEffect, useRef } from 'react';
import YouTube from "react-youtube";
import VideoList from "../hiveBody/videoPlayer/VideoList";
import ScreenShareComponent from "../hiveBody/ScreenShare/ScreenShareComponent";
import useReconnectionHandler from './ReconnectionHandler';
import socket from '../../socket';

/**
 * Composant pour l'affichage du contenu vidéo
 * Gère la liste de vidéos, le lecteur YouTube et le partage d'écran
 */
const VideoContainer = ({ 
    webRTCFeatures, 
    videoPlayerFeatures, 
    isModalOpen, 
    setIsModalOpen,
    isQueenBeeMode,
    currentUserId,
    ownerId,
    roomId,
    users
}) => {
    const { 
        isSharing, 
        remoteStream, 
        videoRef, 
        startSharing, 
        stopSharing,
        connectionState,
        isInitiator
    } = webRTCFeatures;

    const {
        videos,
        videoId,
        needsManualPlay,
        playerOpts,
        handleVideoSelect,
        onPlayerReady,
        onPlayerStateChange,
        handleSeek,
        handleManualPlay,
        isPlayerReady
    } = videoPlayerFeatures;

    const [videoPermission, setVideoPermission] = useState(false);

    // Vérifier la permission vidéo basée sur users
    useEffect(() => {
        if (!users || users.length === 0 || !currentUserId) return;

        const currentUser = users.find(user => user.userId === currentUserId || user._id === currentUserId);
        if (currentUser) {
            setVideoPermission(currentUser.videoControl);
        }
    }, [users, currentUserId]);

    // Écouter les mises à jour des permissions vidéo en temps réel
    useEffect(() => {
        const handleVideoPermissionUpdate = ({ userId, videoControl }) => {
            if (userId === currentUserId) {
                setVideoPermission(videoControl);
            }
        };

        socket.on("video_permission_updated", handleVideoPermissionUpdate);
        return () => socket.off("video_permission_updated", handleVideoPermissionUpdate);
    }, [currentUserId]);

    // État pour la position du modal
    const [modalPosition, setModalPosition] = useState({ x: 150, y: 100 });
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const [currentSharingUser, setCurrentSharingUser] = useState(null);

    // Check if user has permission to control video
    const hasVideoPermission = () => {
        return videoPermission;
    };

    // Check if user has permission to share screen
    const hasScreenSharePermission = () => {
        if (isQueenBeeMode) {
            return currentUserId === ownerId;
        } else {
            // In WorkerBee mode:
            // - If owner is sharing, no one else can share
            // - If a regular user is sharing, only they can stop their share
            // - If no one is sharing, anyone can start
            if (currentSharingUser === ownerId) {
                return currentUserId === ownerId;
            }
            return !currentSharingUser || currentUserId === currentSharingUser;
        }
    };

    // Écouter les événements de partage d'écran pour rafraîchir le contenu
    useEffect(() => {
        socket.on("screen_share_update", (data) => {
            if (data.action === "started") {
                setIsModalOpen(true);
                setCurrentSharingUser(data.userId);
            }
        });
        socket.on("screen_share_stopped", () => {
            setCurrentSharingUser(null);
        });
        return () => {
            socket.off("screen_share_update");
            socket.off("screen_share_stopped");
        };
    }, [setIsModalOpen]);

    // Gestion de la reconnexion
    const { reconnecting } = useReconnectionHandler({
        idRoom: videoRef?.current?.dataset?.roomId,
        isSharing,
        startSharing,
        stopSharing
    });

    // Modified video player options
    const modifiedPlayerOpts = {
        ...playerOpts,
        playerVars: {
            ...playerOpts.playerVars,
            controls: hasVideoPermission() ? 1 : 0, // Disable controls if no permission
        }
    };

    // Modified event handlers
    const handleModifiedPlayerStateChange = (event) => {
        if (!hasVideoPermission()) {
            return; // Ignore state changes if no permission
        }
        onPlayerStateChange(event);  // Remove roomId here as it's already in closure
    };

    const handleModifiedSeek = (event) => {
        if (!hasVideoPermission()) {
            return; // Ignore seek events if no permission
        }
        handleSeek();  // Remove event parameter as it's not needed
    };

    const handleModifiedStartSharing = () => {
        if (!hasScreenSharePermission()) {
            alert("Vous n'avez pas la permission de partager votre écran.");
            return;
        }
        startSharing();
    };

    // Gestionnaires pour le déplacement du modal
    const handleDragStart = (e) => {
        isDraggingRef.current = true;
        dragStartRef.current = {
            x: e.clientX - modalPosition.x,
            y: e.clientY - modalPosition.y
        };
    };

    const handleDrag = (e) => {
        if (!isDraggingRef.current) return;
        
        setModalPosition({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y
        });
    };

    const handleDragEnd = () => {
        isDraggingRef.current = false;
    };

    useEffect(() => {
        if (isModalOpen) {
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleDragEnd);
        }
        return () => {
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isModalOpen]);

    // Détermine si on doit afficher le contenu du partage d'écran
    const shouldShowScreenShare = isSharing || (remoteStream && isModalOpen);

    return (
        <div className="relative">
            {/* Container principal pour le lecteur vidéo - toujours visible */}
            <div className="relative w-full max-h-[550px] min-h-[400px] mx-auto aspect-video rounded-lg bg-[#1a1a1a] p-4">
            {videoId ? (
                    <div className="w-full h-full flex items-center max-h-[500px] min-h-[400px] justify-center">
                        <VideoDisplay 
                            videoId={videoId}
                            playerOpts={modifiedPlayerOpts}
                            onPlayerReady={onPlayerReady}
                            onPlayerStateChange={handleModifiedPlayerStateChange}
                            handleSeek={handleModifiedSeek}
                            needsManualPlay={needsManualPlay}
                            handleManualPlay={hasVideoPermission() ? handleManualPlay : null}
                            hasPermission={hasVideoPermission()}
                        />
                    </div>
                ) : (
                    <div className="relative w-full h-full">
                        {/* Logo YouTube centré */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <img 
                                src="/assets/youtube-icon.png" 
                                alt="YouTube" 
                                className="w-24 h-24 opacity-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            />
                        </div>
                        {/* Liste des vidéos */}
                        <div className="relative z-10 h-full overflow-hidden">
                            <div className="h-full overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-[#2a2a2a]">
                                <VideoList 
                                    videos={videos} 
                                    onVideoSelect={hasVideoPermission() ? handleVideoSelect : null}
                                    roomId={roomId}
                                    currentUserId={currentUserId}
                                    ownerId={ownerId}
                                    users={users}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de partage d'écran */}
            <div
                className={`fixed bg-[#1a1a1a] rounded-lg overflow-hidden shadow-2xl z-20 transition-opacity duration-300 ${
                    isModalOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                style={{
                    width: 'min(90vw, 850px)',
                    height: 'min(90vh, 480px)',
                    left: `${modalPosition.x}px`,
                    top: `${modalPosition.y}px`,
                    pointerEvents: isModalOpen ? 'auto' : 'none'
                }}
            >
                {/* Barre de contrôle supérieure */}
                <div
                    className="absolute top-0 left-0 right-0 bg-[#2a2a2a] p-2 flex justify-between items-center cursor-move"
                    onMouseDown={handleDragStart}
                >
                    <span className="text-white text-sm select-none">
                        {currentSharingUser ? 'Partage d\'écran en cours' : 'Partage d\'écran'}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 rounded"
                        >
                            Cacher
                        </button>
                    </div>
                </div>

                {/* Contenu du partage d'écran */}
                <div className="mt-10 h-[calc(100%-2.5rem)] flex items-center justify-center">
                    {shouldShowScreenShare ? (
                        <ScreenShareComponent
                            videoRef={videoRef}
                            isSharing={isSharing}
                            remoteStream={remoteStream}
                            onStopSharing={stopSharing}
                        />
                    ) : (
                        <span className="text-gray-400">
                            {isQueenBeeMode && currentUserId !== ownerId 
                                ? "Seul le créateur peut partager son écran en mode Queen Bee"
                                : currentSharingUser === ownerId
                                ? "Le créateur est en train de partager son écran"
                                : "Aucun partage d'écran en cours"}
                        </span>
                    )}
                </div>
                
                {/* Overlay de reconnexion */}
                {reconnecting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                            <p>Reconnexion en cours...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Composant pour l'affichage du lecteur YouTube
 */
const VideoDisplay = ({ 
    videoId, 
    playerOpts, 
    onPlayerReady, 
    onPlayerStateChange, 
    handleSeek, 
    needsManualPlay, 
    handleManualPlay,
    hasPermission 
}) => {
    return (
        <div className="w-full h-full bg-transparent rounded-lg overflow-hidden relative group">
            <div className="w-full h-full">
                <YouTube
                    videoId={videoId}
                    opts={playerOpts}
                    onReady={onPlayerReady}
                    onStateChange={onPlayerStateChange}
                    className="w-full h-full max-h-[500px] min-h-[400px]"
                    iframeClassName="w-full h-full aspect-video"
                />
            </div>
            {!hasPermission && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-lg">Seul le créateur peut contrôler la vidéo en mode Queen Bee</p>
                </div>
            )}
            {needsManualPlay && handleManualPlay && (
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
    );
};

export default VideoContainer;