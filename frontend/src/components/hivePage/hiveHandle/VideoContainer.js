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
const VideoContainer = ({ webRTCFeatures, videoPlayerFeatures, isModalOpen, setIsModalOpen }) => {
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

  // État pour la position du modal
  const [modalPosition, setModalPosition] = useState({ x: 150, y: 100 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Écouter les événements de partage d'écran pour rafraîchir le contenu
  useEffect(() => {
    socket.on("screen_share_update", (data) => {
      if (data.action === "started") {
        setIsModalOpen(true); // Ouvre la fenêtre si un partage commence
      }
    });
    socket.on("screen_share_stopped", () => {
      // Le modal reste monté, mais son contenu sera vide
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

  // Gestionnaires pour le déplacement du modal
  const handleDragStart = (e) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y
    };
    document.addEventListener('mousemove', handleDragging);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragging = (e) => {
    if (!isDraggingRef.current) return;
    
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    // Limites pour empêcher le modal de sortir de l'écran
    const maxX = window.innerWidth - 850;  // largeur du modal
    const maxY = window.innerHeight - 480; // hauteur du modal
    
    setModalPosition({
      x: Math.min(Math.max(0, newX), maxX),
      y: Math.min(Math.max(0, newY), maxY)
    });
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleDragging);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  // Nettoyage des event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragging);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);

  // Détermine si on doit afficher le contenu du partage d'écran
  const shouldShowScreenShare = isSharing || (remoteStream && isModalOpen);

  return (
    <div className="relative">
      {/* Container principal pour le lecteur vidéo - toujours visible */}
      <div className="absolute left-[100px] top-[100px] w-[850px] h-[450px]  rounded-lg items-center bg-[#1a1a1a] p-4">
        {videoId ? (
          <VideoDisplay 
            videoId={videoId}
            playerOpts={playerOpts}
            onPlayerReady={onPlayerReady}
            onPlayerStateChange={onPlayerStateChange}
            handleSeek={handleSeek}
            needsManualPlay={needsManualPlay}
            handleManualPlay={handleManualPlay}
          />
        ) : (
          <VideoList videos={videos} onVideoSelect={handleVideoSelect} />
        )}
      </div>

      {/* Modal de partage d'écran - toujours monté mais peut être caché */}
      <div
        className={`fixed w-[850px] h-[480px] bg-[#1a1a1a] rounded-lg overflow-hidden shadow-2xl z-20 transition-opacity duration-300 ${
          isModalOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        style={{
          left: `${modalPosition.x}px`,
          top: `${modalPosition.y}px`,
          pointerEvents: isModalOpen ? 'auto' : 'none'
        }}
      >
        {/* Barre de contrôle supérieure (draggable) */}
        <div
          className="absolute top-0 left-0 right-0 bg-[#2a2a2a] p-2 flex justify-between items-center cursor-move"
          onMouseDown={handleDragStart}
        >
          <span className="text-white text-sm select-none">Partage d'écran</span>
          {/* Bouton pour cacher la fenêtre */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 rounded ml-2"
          >
            Cacher
          </button>
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
            <span className="text-gray-400">Aucun partage d'écran en cours</span>
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
const VideoDisplay = ({ videoId, playerOpts, onPlayerReady, onPlayerStateChange, handleSeek, needsManualPlay, handleManualPlay }) => {
  return (
    <div className="w-full h-full bg-transparent rounded-lg overflow-hidden" onMouseUp={handleSeek}>
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
  );
};

export default VideoContainer; 