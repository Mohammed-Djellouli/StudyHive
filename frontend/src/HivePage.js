import React, {useEffect, useState} from "react";
import {useLocation} from "react-router-dom";
import { useParams } from "react-router-dom";
import useVideoPlayer from './hooks/useVideoPlayer';
import useWebRTC from './hooks/useWebRTC';

// Composants
import Big_Logo_At_Left from "./components/hivePage/hiveHeader/Big_Logo_At_Left";
import Left_bar_Icons_members_In_Room from "./components/hivePage/hiveBody/Left_bar_Icons_members_In_Room";
import SearchBar from "./components/hivePage/hiveHeader/SeachBar";
import LeftBarTools from "./components/hivePage/hiveBody/LeftBarTools";
import HiveTimerBanner from "./components/hivePage/hiveHandle/HiveTimerBanner";
import ChatBox from "./components/Communication/Chat/chatBox";
import VoiceChat from "./components/Communication/MicChat/VoiceChat";
import BlocNote from "./components/hivePage/hiveBody/BlocNote";
import WhiteBoard from "./components/hivePage/hiveBody/whiteBoard";
import Playlist from "./components/hivePage/hiveBody/videoPlayer/Playlist";
import VideoContainer from "./components/hivePage/hiveHandle/VideoContainer";

// Nouvelles importations pour les composants modulaires
import ErrorBoundary from "./components/hivePage/hiveHandle/ErrorBoundary";
import HiveDataLoader from "./components/hivePage/hiveHandle/HiveDataLoader";

import "./App.css";

// Composant principal HivePage
function HivePage() {
    const {idRoom} = useParams();
    const location = useLocation();
    const [ownerPseudo, setOwnerPseudo] = useState(location.state?.ownerPseudo || null);
    const [isQueenBeeMode, setIsQueenBeeMode] = useState(false);
    const [timerEndsAt, setTimerEndsAt] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [ownerId, setOwnerId] = useState(null);
    const [users, setUsers] = useState([]);
    const [isScreenShareWindowOpen, setIsScreenShareWindowOpen] = useState(true);
    // État pour contrôler la visibilité de la playlist
    const [showPlaylist, setShowPlaylist] = useState(false);
    // Utilisation des hooks personnalisés
    const webRTCFeatures = useWebRTC(idRoom);
    const videoPlayerFeatures = useVideoPlayer(idRoom);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/hive/${idRoom}`)
            .then(res => res.json())
            .then(data => {
                console.log("ROOM :", data);
                setIsQueenBeeMode(data.isQueenBeeMode);
                setTimerEndsAt(data.timerEndsAt);

                if (data.ownerPseudo) {
                    setOwnerPseudo(data.ownerPseudo);
                }
                setUsers(data.users);
                setOwnerId(data.idOwner?._id || data.ownerSocketId || data.idOwner);
                setIsLoading(false);
            });
    }, [idRoom, location.state]);

    console.log("State reçu dans HivePage :", ownerPseudo, isQueenBeeMode);
    if(isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white animate-pulse">
                Chargement...
            </div>
        );
    }
    console.log("isInitiator dans HivePage:", webRTCFeatures.isInitiator);
    console.log("isSharing dans HivePage:", webRTCFeatures.isSharing);
    
    return (
        <div className="bg-center bg-cover bg-fixed bg-no-repeat min-h-screen text-white bg-[#1a1a1a]"
             style={{backgroundImage: "url('/assets/bg.png')", backgroundSize: "270%"}}>
            <Big_Logo_At_Left/>
            <Left_bar_Icons_members_In_Room ownerPseudo={ownerPseudo} isQueenBeeMode={isQueenBeeMode}
                                            users={users.filter((user) => user._id !== ownerId)}/>

            <SearchBar onSearch={videoPlayerFeatures.handleSearch}/>

            {/* Main content area with video and playlist */}
            <div className="flex flex-col items-center relative">
                {/* Playlist below video */}
                <div className="w-[850px] mt-4 absolute top-[600px] left-1/2 transform -translate-x-1/2 z-10">
                    <Playlist onVideoSelect={videoPlayerFeatures.handleVideoSelect} />
                </div>

                {/* Video player area */}
                <div className="relative w-full z-20">
                    <VideoContainer
                        webRTCFeatures={webRTCFeatures}
                        videoPlayerFeatures={videoPlayerFeatures}
                        isModalOpen={isScreenShareWindowOpen}
                        setIsModalOpen={setIsScreenShareWindowOpen}
                    />
                </div>
            </div>

            {/* Whiteboard Placement
            <div className="fixed top-[100px] left-[200px] z-20">
                <WhiteBoard />
            </div>
            */}

            <div className="fixed bottom-10 right-4 w-[90vw] max-w-[385px] z-30">
                <BlocNote/>
                <ChatBox/>
            </div>

            <div className="fixed bottom-3 right-80 z-30">
                <LeftBarTools
                    ownerPseudo={ownerPseudo}
                    isQueenBeeMode={isQueenBeeMode}
                    onStartSharing={webRTCFeatures.startSharing}
                    isInitiator={webRTCFeatures.isInitiator}
                    isSharing={webRTCFeatures.isSharing}
                    isScreenShareWindowOpen={isScreenShareWindowOpen}
                    onToggleScreenShareWindow={() => setIsScreenShareWindowOpen(prev => !prev)}
                />
            </div>

            <HiveTimerBanner ownerPseudo={ownerPseudo} timerEndsAt={timerEndsAt} roomId={idRoom}/>
        </div>
    );
}
export default HivePage;