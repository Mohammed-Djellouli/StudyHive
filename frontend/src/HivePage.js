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



// Nouvelles importations pour les composants modulaires
import ErrorBoundary from "./components/hivePage/hiveHandle/ErrorBoundary";
import HiveDataLoader from "./components/hivePage/hiveHandle/HiveDataLoader";
import VideoContainer from "./components/hivePage/hiveHandle/VideoContainer";

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
    const [currentPseudo, setCurrentPseudo] = useState('');

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

    useEffect(() => {
        const pseudo = localStorage.getItem("userPseudo");
        if (pseudo) {
            setCurrentPseudo(pseudo);
        }
    }, []);

    console.log("State reçu dans HivePage :", ownerPseudo, isQueenBeeMode ,users);
    if(isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-black bg-amber-500 animate-pulse">
                Chargement...
            </div>
        );
    }
    console.log("isInitiator dans HivePage:", webRTCFeatures.isInitiator);
    console.log("isSharing dans HivePage:", webRTCFeatures.isSharing);
    return (
        <ErrorBoundary>
            {/*<HiveDataLoader
                idRoom={idRoom}
                setOwnerPseudo={setOwnerPseudo}
                setIsQueenBeeMode={setIsQueenBeeMode}
                setTimerEndsAt={setTimerEndsAt}
                setUsers={setUsers}
                setOwnerId={setOwnerId}
            />*/}

            <div className="bg-center bg-cover bg-fixed bg-no-repeat min-h-screen text-white bg-[#1a1a1a]"
                 style={{backgroundImage: "url('/assets/bg.png')", backgroundSize: "270%"}}>
                <div className="fixed top-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm shadow-lg z-50">
                    <span>Connected as {currentPseudo ?currentPseudo : ownerPseudo }</span>
                </div>

                <Big_Logo_At_Left/>
                <Left_bar_Icons_members_In_Room ownerPseudo={ownerPseudo} isQueenBeeMode={isQueenBeeMode}
                                                users={users.filter((user) => user._id !== ownerId)}/>

                <SearchBar onSearch={videoPlayerFeatures.handleSearch}/>

                <VideoContainer
                    webRTCFeatures={webRTCFeatures}
                    videoPlayerFeatures={videoPlayerFeatures}
                />

                {/*
            <div className="fixed top-[100px] left-[200px] z-20">
                <WhiteBoard />
            </div>*/}


                <div className="fixed bottom-10 right-4 w-[90vw] max-w-[385px]">
                    <BlocNote/>
                    <ChatBox/>
                </div>

                <div className="fixed bottom-3 right-80">
                    <LeftBarTools
                        ownerPseudo={ownerPseudo}
                        isQueenBeeMode={isQueenBeeMode}
                        onStartSharing={webRTCFeatures.startSharing}
                        isInitiator={webRTCFeatures.isInitiator}
                        isSharing={webRTCFeatures.isSharing}
                    />
                </div>

                <HiveTimerBanner ownerPseudo={ownerPseudo} timerEndsAt={timerEndsAt} roomId={idRoom}/>
            </div>
        <div/>
        </ErrorBoundary>
    );

}
export default HivePage;