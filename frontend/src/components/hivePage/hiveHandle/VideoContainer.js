import React, { useState, useEffect } from 'react';
import YouTube from "react-youtube";
import VideoList from "../hiveBody/videoPlayer/VideoList";
import ScreenShareComponent from "../hiveBody/ScreenShare/ScreenShareComponent";
import useReconnectionHandler from './ReconnectionHandler';

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
    handleManualPlay
  } = videoPlayerFeatures;

  // Gestion de la reconnexion
  const { reconnecting } = useReconnectionHandler({
    idRoom: videoRef?.current?.dataset?.roomId,
    isSharing,
    startSharing,
    stopSharing
  });

  return (
    <div className="absolute left-[150px] top-[100px] w-[850px] h-[480px] overflow-y-auto rounded-lg bg-[#1a1a1a] p-4 z-10">
      {isSharing || remoteStream ? (
        <div className="relative w-full h-full">
          <ScreenShareComponent
            videoRef={videoRef}
            isSharing={isSharing}
            remoteStream={remoteStream}
            onStopSharing={stopSharing}
          />
          
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
      ) : videoId ? (
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
  );
};

/**
 * Composant pour l'affichage du lecteur YouTube
 */
const VideoDisplay = ({ videoId, playerOpts, onPlayerReady, onPlayerStateChange, handleSeek, needsManualPlay, handleManualPlay }) => {
  return (
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
  );
};

export default VideoContainer; 