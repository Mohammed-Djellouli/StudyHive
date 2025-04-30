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

import socket from "./components/socket";



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

    const [brbMode, setBrbMode] = useState(false);
    const toggleBrb = () => {
        setBrbMode(prev => !prev);
        const event = new CustomEvent("toggle-brb", {detail: {brb: !brbMode}});
        window.dispatchEvent(event);
    }

    const [isScreenShareWindowOpen, setIsScreenShareWindowOpen] = useState(true);

    // État pour contrôler la visibilité de la playlist
    const [showPlaylist, setShowPlaylist] = useState(false);


    const [currentPseudo, setCurrentPseudo] = useState('');
    const [currentId, setCurrentId] = useState('');


    // Utilisation des hooks personnalisés
    const webRTCFeatures = useWebRTC(idRoom);
    const videoPlayerFeatures = useVideoPlayer(idRoom);

    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

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
        const handleBeforeUnload = () => {
            localStorage.setItem("isRefreshing", "true");
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        localStorage.removeItem("isRefreshing"); //  il est revenu, on le garde
    }, []);

    useEffect(() => {
        setTimeout(() => {
            const userId = localStorage.getItem("userId");
            const isRefreshing = localStorage.getItem("isRefreshing");
            socket.emit("join_hive_room", {
                roomId: idRoom,
                userId: userId,
                isRefreshing: !!isRefreshing
            });
            localStorage.removeItem("isRefreshing");
        }, 1000);
    }, []);


    useEffect(() => {
        const pseudo = localStorage.getItem("userPseudo");
        if (pseudo) {
            setCurrentPseudo(pseudo);
        }
        const currentId = localStorage.getItem("userId") || socket.id;
        if (currentId) {
            setCurrentId(currentId);
            console.log("il rentre dans SetCurrentId", currentId);
        }
    }, []);
    useEffect(() => {
        if (socket && idRoom && currentId) {
            console.log("Emitting join_hive_room");
            socket.emit("join_hive_room", {roomId: idRoom, userId: currentId});
        }
    }, [idRoom, currentId]);


    useEffect(() => {
        const handleUserJoined = (newUser) => {
            console.log("User Joined :", newUser);
            setUsers(prevUsers => {
                if (prevUsers.find(u => u.userId === newUser.userId)) return prevUsers;
                return [...prevUsers, {
                    ...newUser,
                    _id: newUser.userId || newUser.socketId,
                    socketId: newUser.socketId,
                }];
            });
        };

        const handleUserLeft = (socketIdLeft) => {
            console.log("User Left (socket)", socketIdLeft);
            setUsers(prevUsers => prevUsers.filter(user => user.socketId !== socketIdLeft));
        };

        const handleDisconnectUser = (userIdLeft) => {
            console.log("User Left (userId)", userIdLeft);
            setUsers(prevUsers => prevUsers.filter(user => user.userId !== userIdLeft));
        };

        socket.on("user_joined", handleUserJoined);
        socket.on("user_left", handleUserLeft);
        socket.on("disconnect_user", handleDisconnectUser);

        return () => {
            socket.off("user_joined", handleUserJoined);
            socket.off("user_left", handleUserLeft);
            socket.off("disconnect_user", handleDisconnectUser);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-black bg-amber-500 animate-pulse">
                Chargement...
            </div>
        );
    }
    console.log("isInitiator dans HivePage:", webRTCFeatures.isInitiator);
    console.log("isSharing dans HivePage:", webRTCFeatures.isSharing);

    console.log("ownerId----->", ownerId, "CurrentId-------->", currentId);
    return (
        <div className="min-h-screen w-full bg-[#1D1F27] bg-center bg-cover bg-no-repeat overflow-y-auto"
             style={{ backgroundImage: "url('/assets/bg.png')", backgroundSize: "270%" }}>


        <div
                className="fixed top-2 right-[200px] transform -translate-x-1/2 bg-[#1D1F19] text-white px-4 py-2 rounded-full text-sm shadow-lg z-50">
                <span>Connected as {currentPseudo ? currentPseudo : ownerPseudo}</span>
            </div>

            <Big_Logo_At_Left/>


            <SearchBar onSearch={videoPlayerFeatures.handleSearch}/>
            {/* Main content area with video and playlist */}
            <div className=" relative group flex items-center justify-center cursor-pointer ">
                {/* Playlist below video */}
                <div className="w-[850px] mt-4 absolute top-[550px]  left-[100px] ">
                    <Playlist onVideoSelect={videoPlayerFeatures.handleVideoSelect}/>
                </div>
                {/* Video player area */}
                <div className=" realtive w-full  ">
                    <VideoContainer
                        webRTCFeatures={webRTCFeatures}
                        videoPlayerFeatures={videoPlayerFeatures}
                        isModalOpen={isScreenShareWindowOpen}
                        setIsModalOpen={setIsScreenShareWindowOpen}
                    />
                </div>





                <WhiteBoard isModalOpen={isWhiteboardOpen} setIsModalOpen={setIsWhiteboardOpen} />





                <div className="fixed bottom-[10px] right-4 w-[90vw] max-w-[385px]">
                    <ChatBox/>
                </div>
                <div className={"fixed top-[65px] right-4 w-[90vw] max-w-[385px]"}>
                    <BlocNote/>
                </div>
                {/* Membres dans la barre de gauche */}
                {/* Bloc : membres dans la room */}

                    <Left_bar_Icons_members_In_Room
                        ownerPseudo={ownerPseudo}
                        isQueenBeeMode={isQueenBeeMode}
                        users={users}
                        ownerId={ownerId}
                    />


                {/* Séparateur visuel */}
                <div className="fixed left-2 top-[300px] z-50 h-[2px] w-12 bg-gray-700 rounded"></div>

                {/* Bloc : outils */}
                <div className="fixed left-2 top-[320px] z-50">
                    <LeftBarTools
                        ownerPseudo={ownerPseudo}
                        isQueenBeeMode={isQueenBeeMode}
                        onStartSharing={webRTCFeatures.startSharing}
                        isInitiator={webRTCFeatures.isInitiator}
                        isSharing={webRTCFeatures.isSharing}
                        users={users}
                        currentUserId={localStorage.getItem("userId") || socket.id}
                        toggleBRB={toggleBrb}
                        brbMode={brbMode}
                        isScreenShareWindowOpen={isScreenShareWindowOpen}
                        onToggleScreenShareWindow={() => setIsScreenShareWindowOpen(prev => !prev)}
                        onToggleWhiteboard={() => setIsWhiteboardOpen(prev => !prev)}
                        isWhiteboardOpen={isWhiteboardOpen}
                    />
                </div>



                <HiveTimerBanner ownerId={ownerId} timerEndsAt={timerEndsAt} roomId={idRoom} currentId={currentId}
                                 ownerPseudo={ownerPseudo}/>
            </div>

        </div>
    );

}
export default HivePage;