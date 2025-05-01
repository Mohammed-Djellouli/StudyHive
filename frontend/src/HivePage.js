
// HivePage.jsx (COMPLET ET NETTOYÉ)
import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

import useVideoPlayer from './hooks/useVideoPlayer';
import useWebRTC from './hooks/useWebRTC';

import Big_Logo_At_Left from "./components/hivePage/hiveHeader/Big_Logo_At_Left";
import Left_bar_Icons_members_In_Room from "./components/hivePage/hiveBody/Left_bar_Icons_members_In_Room";
import SearchBar from "./components/hivePage/hiveHeader/SeachBar";
import LeftBarTools from "./components/hivePage/hiveBody/LeftBarTools";
import HiveTimerBanner from "./components/hivePage/hiveHandle/HiveTimerBanner";
import ChatBox from "./components/Communication/Chat/chatBox";
import VoiceChat from "./components/Communication/MicChat/VoiceChat";
import BlocNote from "./components/hivePage/hiveBody/BlocNote";
import WhiteBoard from "./components/hivePage/hiveBody/whiteBoard";
import NotificationBanner from "./components/hivePage/hiveHeader/NotificationBanner";
import Playlist from "./components/hivePage/hiveBody/videoPlayer/Playlist";
import VideoContainer from "./components/hivePage/hiveHandle/VideoContainer";
import socket from "./components/socket";

// Nouvelles importations pour les composants modulaires
import ErrorBoundary from "./components/hivePage/hiveHandle/ErrorBoundary";
import HiveDataLoader from "./components/hivePage/hiveHandle/HiveDataLoader";

import "./App.css";

function HivePage() {
    const { idRoom } = useParams();
    const location = useLocation();

    const [ownerPseudo, setOwnerPseudo] = useState(location.state?.ownerPseudo || null);
    const [isQueenBeeMode, setIsQueenBeeMode] = useState(false);
    const [timerEndsAt, setTimerEndsAt] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [ownerId, setOwnerId] = useState(null);
    const [users, setUsers] = useState([]);
    const [notification, setNotification] = useState(null);

    const webRTCFeatures = useWebRTC(idRoom);
    const videoPlayerFeatures = useVideoPlayer(idRoom);

    const [brbMode, setBrbMode] = useState(false);
    const toggleBrb = () => {
        setBrbMode(prev => !prev);
        const event = new CustomEvent("toggle-brb", {detail: {brb: !brbMode}});
        window.dispatchEvent(event);
    }

    const [isScreenShareWindowOpen, setIsScreenShareWindowOpen] = useState(false);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [currentPseudo, setCurrentPseudo] = useState('');
    const [currentId, setCurrentId] = useState('');

    const navigate = useNavigate();


    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        if (socket.connected) {
            socket.emit("register_identity", { userId });
        } else {
            socket.once("connect", () => {
                socket.emit("register_identity", { userId });
            });
        }
    }, []);

    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        const userPseudo = localStorage.getItem("userPseudo");

        // Si pas d'utilisateur en mémoire → rediriger vers /join/:idRoom
        if (!userId || !userPseudo) {
            navigate(`/join/${idRoom}`);
        }
    }, [idRoom, navigate]);
    useEffect(() => {
        const userId = localStorage.getItem("userId");
        const userPseudo = localStorage.getItem("userPseudo");

        const url = new URL(`${process.env.REACT_APP_BACKEND_URL}/api/hive/${idRoom}`);
        if (userId) url.searchParams.append("userId", userId);
        if (userPseudo) url.searchParams.append("userPseudo", userPseudo);

        fetch(url.toString())
            .then(res => res.json())
            .then(data => {
                setIsQueenBeeMode(data.isQueenBeeMode);
                setTimerEndsAt(data.timerEndsAt);
                setOwnerPseudo(data.ownerPseudo || null);
                setUsers(data.users);
                setOwnerId(data.idOwner?._id || data.ownerSocketId || data.idOwner);
                setIsLoading(false);
            });
    }, [idRoom]);

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
        localStorage.removeItem("isRefreshing");
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
        const storedId = localStorage.getItem("userId") || socket.id;
        if (storedId) {
            setCurrentId(storedId);
            console.log("il rentre dans SetCurrentId", storedId);
        }
    }, []);

    useEffect(() => {

        const userId = localStorage.getItem("userId");
        const isRefreshing = localStorage.getItem("isRefreshing");

        if (userId && idRoom) {
            socket.emit("join_hive_room", {
                roomId: idRoom,
                userId: userId,
                isRefreshing: !!isRefreshing,
            });

            setTimeout(() => {
                localStorage.removeItem("isRefreshing");
            }, 3000);

        }
    }, [idRoom]);


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



    useEffect(() => {
        const handleBeforeUnload = () => {
            //console.log("########################################################################## Le navigateur est en train d’être fermé / rafraîchi");
            localStorage.setItem("isRefreshing", "true");
        };
        localStorage.removeItem("userPseudo");
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);





    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-black bg-amber-500 animate-pulse">
                Chargement...
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#1D1F27] bg-center bg-cover bg-no-repeat overflow-y-auto"
             style={{ backgroundImage: "url('/assets/bg.png')", backgroundSize: "270%" }}>

            <div className="fixed top-2 right-[200px] transform -translate-x-1/2 bg-[#1D1F19] text-white px-4 py-2 rounded-full text-sm shadow-lg z-50">
                <span>Connected as {currentPseudo ? currentPseudo : ownerPseudo}</span>
            </div>

            <Big_Logo_At_Left/>

            <SearchBar 
                onSearch={videoPlayerFeatures.handleSearch}
                isQueenBeeMode={isQueenBeeMode}
                currentUserId={localStorage.getItem("userId") || socket.id}
                ownerId={ownerId}
            />

            <div className="relative group flex items-center justify-center cursor-pointer">
                <div className="w-[850px] mt-4 absolute top-[550px] left-[100px]">
                    <Playlist 
                        onVideoSelect={videoPlayerFeatures.handleVideoSelect}
                        isQueenBeeMode={isQueenBeeMode}
                        currentUserId={localStorage.getItem("userId") || socket.id}
                        ownerId={ownerId}
                        roomId={idRoom}
                    />
                </div>

                <div className="relative w-full">
                    <VideoContainer
                        webRTCFeatures={webRTCFeatures}
                        videoPlayerFeatures={videoPlayerFeatures}
                        isModalOpen={isScreenShareWindowOpen}
                        setIsModalOpen={setIsScreenShareWindowOpen}
                        isQueenBeeMode={isQueenBeeMode}
                        currentUserId={localStorage.getItem("userId") || socket.id}
                        ownerId={ownerId}
                        roomId={idRoom}
                        users={users}
                    />
                </div>

                <WhiteBoard isModalOpen={isWhiteboardOpen} setIsModalOpen={setIsWhiteboardOpen} />

                <div className="fixed bottom-[10px] right-4 w-[90vw] max-w-[385px]">
                    <ChatBox/>
                </div>

                <div className="fixed top-[100px] left-[100px] z-20">
                    <WhiteBoard roomId={idRoom}/>
                </div>

                <div className="fixed top-[65px] right-4 w-[90vw] max-w-[385px]">
                    <BlocNote/>
                </div>

                <Left_bar_Icons_members_In_Room
                    ownerPseudo={ownerPseudo}
                    isQueenBeeMode={isQueenBeeMode}
                    users={users}
                    ownerId={ownerId}
                />

                <div className="fixed left-2 top-[300px] z-50 h-[2px] w-12 bg-gray-700 rounded"></div>

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
                        ownerId={ownerId}
                        onToggleWhiteboard={() => setIsWhiteboardOpen(prev => !prev)}
                        isWhiteboardOpen={isWhiteboardOpen}
                    />
                </div>

                <HiveTimerBanner
                    ownerId={ownerId}
                    timerEndsAt={timerEndsAt}
                    roomId={idRoom}
                    currentId={currentId}
                    ownerPseudo={ownerPseudo}
                />
            </div>
        </div>
    );
}

export default HivePage;
