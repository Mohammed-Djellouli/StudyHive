import React, { useState, useEffect, useRef } from 'react';
import YouTube from "react-youtube";
import VideoList from "../hiveBody/videoPlayer/VideoList";
import ScreenShareComponent from "../hiveBody/ScreenShare/ScreenShareComponent";
import useReconnectionHandler from './ReconnectionHandler';
import socket from '../../../components/socket';

/**
 * Composant pour l'affichage du contenu vidéo
 * Gère la liste de vidéos, le lecteur YouTube et le partage d'écran
 */
const VideoContainer = ({ webRTCFeatures, videoPlayerFeatures }) => {
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

  // État pour contrôler la visibilité du modal
  const [isModalVisible, setIsModalVisible] = useState(true);
  // État pour la position du modal
  const [modalPosition, setModalPosition] = useState({ x: 150, y: 100 });
  // État pour forcer le rafraîchissement du modal
  const [modalKey, setModalKey] = useState(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Écouter l'événement d'arrêt du partage d'écran et les mises à jour de statut
  useEffect(() => {
    socket.on("screen_share_stopped", () => {
      setIsModalVisible(false);
    });

    socket.on("screen_share_status_update", ({ isSharing }) => {
      if (isSharing) {
        setIsModalVisible(true);
      }
    });

    return () => {
      socket.off("screen_share_stopped");
      socket.off("screen_share_status_update");
    };
  }, []);

  // Forcer le rafraîchissement du modal quand le statut du partage change
  useEffect(() => {
    if (isSharing || remoteStream) {
      setModalKey(prev => prev + 1);
      setIsModalVisible(true);
    } else {
      setIsModalVisible(false);
    }
  }, [isSharing, remoteStream]);

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

  return (
    <div className="relative">
      {/* Container principal pour le lecteur vidéo - toujours visible */}
      <div className="absolute left-[150px] top-[100px] w-[850px] h-[480px] overflow-y-auto rounded-lg bg-[#1a1a1a] p-4 z-10">
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

      {/* Bouton flottant pour réafficher le modal quand il est caché */}
      {(isSharing || remoteStream) && !isModalVisible && (
        <button
          onClick={() => setIsModalVisible(true)}
          className="fixed bottom-4 right-4 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-full shadow-lg z-30"
        >
          Afficher le partage d'écran
        </button>
      )}

      {/* Container pour le partage d'écran - modal déplaçable */}
      {(isSharing || remoteStream) && isModalVisible && (
        <div 
          key={modalKey}
          className="fixed w-[850px] h-[480px] bg-[#1a1a1a] rounded-lg overflow-hidden shadow-2xl z-20"
          style={{
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`
          }}
        >
          {/* Barre de contrôle supérieure (draggable) */}
          <div 
            className="absolute top-0 left-0 right-0 bg-[#2a2a2a] p-2 flex justify-between items-center cursor-move"
            onMouseDown={handleDragStart}
          >
            <span className="text-white text-sm select-none">Partage d'écran</span>
            <button 
              onClick={() => setIsModalVisible(false)}
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 rounded"
            >
              Réduire
            </button>
          </div>

          {/* Contenu du partage d'écran */}
          <div className="mt-10 h-[calc(100%-2.5rem)]">
            <ScreenShareComponent
              key={`screen-${modalKey}`}
              videoRef={videoRef}
              isSharing={isSharing}
              remoteStream={remoteStream}
              onStopSharing={stopSharing}
            />
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
      )}
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