import React, { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import YouTube from "react-youtube";
import socket from "./components/socket";
import Big_Logo_At_Left from "./components/hivePage/hiveHeader/Big_Logo_At_Left";
import Left_bar_Icons_members_In_Room from "./components/hivePage/hiveBody/Left_bar_Icons_members_In_Room";
import SearchBar from "./components/hivePage/hiveHeader/SeachBar";
import LeftBarTools from "./components/hivePage/hiveBody/LeftBarTools";
import VideoList from "./components/hivePage/hiveBody/videoPlayer/VideoList";
import HiveTimerBanner from "./components/hivePage/hiveHandle/HiveTimerBanner";
import ChatBox from "./components/Communication/Chat/chatBox";
import VoiceChat from "./components/Communication/MicChat/VoiceChat";
import useVideoPlayer from './hooks/useVideoPlayer';
import useWebRTC from './hooks/useWebRTC';
import ScreenShareComponent from './components/hivePage/hiveBody/ScreenShare/ScreenShareComponent';

import "./App.css";

function HivePage() {
    const { idRoom } = useParams();
    const [ownerPseudo, setOwnerPseudo] = useState(null);
    const [isQueenBeeMode, setIsQueenBeeMode] = useState(false);
    const [timerEndsAt, setTimerEndsAt] = useState(null);
    const [ownerId, setOwnerId] = useState(null);
    const [users, setUsers] = useState([]);
    const [reconnecting, setReconnecting] = useState(false);

    const {
        isSharing,
        remoteStream,
        isInitiator,
        videoRef,
        startSharing,
        stopSharing,
        connectionState
    } = useWebRTC(idRoom);

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

    React.useEffect(() => {
        window.onerror = function (message, source, lineno, colno, error) {
            console.error("Global JS Error:", { message, source, lineno, colno, error });
        };
    }, []);

    React.useEffect(() => {
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
    }, [idRoom]);

    // Handle manual reconnection
    const handleReconnect = () => {
        setReconnecting(true);
        
        // Disconnect and reconnect socket
        socket.disconnect();
        
        setTimeout(() => {
            socket.connect();
            socket.emit("joinRoom", { 
                roomId: idRoom, 
                userName: localStorage.getItem("userPseudo") || "Anonymous" 
            });
            
            setTimeout(() => {
                setReconnecting(false);
                
                // Restart sharing if needed
                if (isSharing) {
                    stopSharing();
                    setTimeout(() => {
                        startSharing();
                    }, 1000);
                }
            }, 2000);
        }, 1000);
    };

    const location = useLocation();
    const isConnectionProblem = connectionState === 'disconnected' || 
                                connectionState === 'failed' || 
                                connectionState === 'closed';

    console.log("State reçu dans HivePage :", ownerPseudo, isQueenBeeMode);
    return (
        <div className="bg-center bg-cover bg-fixed bg-no-repeat min-h-screen text-white bg-[#1a1a1a]"
            style={{ backgroundImage: "url('/assets/bg.png')", backgroundSize: "270%" }}>
            <Big_Logo_At_Left />
            <Left_bar_Icons_members_In_Room ownerPseudo={ownerPseudo} isQueenBeeMode={isQueenBeeMode} users={users.filter((user) => user._id !== ownerId)} />
            
            <SearchBar onSearch={handleSearch} />

            <div className="absolute left-[150px] top-[100px] w-[850px] h-[480px] overflow-y-auto rounded-lg bg-[#1a1a1a] p-4 z-10">
                {isSharing || remoteStream ? (
                    <div className="relative w-full h-full">
                        <ScreenShareComponent
                            videoRef={videoRef}
                            isSharing={isSharing}
                            remoteStream={remoteStream}
                            onStopSharing={stopSharing}
                        />
                        
                        {/* Only show reconnect overlay when actually reconnecting */}
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