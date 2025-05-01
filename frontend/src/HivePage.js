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
import BlocNote from "./components/hivePage/hiveBody/BlocNote";
import WhiteBoard from "./components/hivePage/hiveBody/whiteBoard";
import NotificationBanner from "./components/hivePage/hiveHeader/NotificationBanner";
import Playlist from "./components/hivePage/hiveBody/videoPlayer/Playlist";
import VideoContainer from "./components/hivePage/hiveHandle/VideoContainer";
import socket from "./components/socket";

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
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
    const [isScreenShareWindowOpen, setIsScreenShareWindowOpen] = useState(true);

    const [currentPseudo, setCurrentPseudo] = useState('');
    const [currentId, setCurrentId] = useState('');
    const navigate = useNavigate();

    const toggleBrb = () => {
        const newValue = !brbMode;
        setBrbMode(newValue);
        const event = new CustomEvent("toggle-brb", { detail: { brb: newValue } });
        window.dispatchEvent(event);
    };



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
    const pseudo = localStorage.getItem("userPseudo");
    const id = localStorage.getItem("userId") || socket.id;
    if (pseudo) setCurrentPseudo(pseudo);
    if (id) setCurrentId(id);
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
    socket.on("user_joined", (newUser) => {
        setUsers((prev) => {
            if (prev.find(u => u.userId === newUser.userId)) return prev;
            setNotification({message: `${newUser.pseudo} a rejoint la Ruche`, type: "info"});
            return [...prev, newUser];
        });
    });

    socket.on("user_left", (idLeft) => {
        const idStr = idLeft.toString();
        setUsers((prev) => {
            const userToRemove = prev.find(user =>
                idStr === user.userId?.toString() ||
                idStr === user.socketId?.toString() ||
                idStr === user._id?.toString()
            );

            if (userToRemove) {
                setNotification({ message: `${userToRemove.pseudo} a quitté la Ruche`, type: "danger" });
            }

            return prev.filter(user =>
                idStr !== user.userId?.toString() &&
                idStr !== user.socketId?.toString() &&
                idStr !== user._id?.toString()
            );
        });

        return () => {
            socket.off("user_joined");
            socket.off("user_left");
        };

    });

    return () => {
        socket.off("user_joined");
        socket.off("user_left");
    };
}, []);



useEffect(() => {
        const handleBeforeUnload = () => {
            console.log("########################################################################## Le navigateur est en train d’être fermé / rafraîchi");
            localStorage.setItem("isRefreshing", "true");
        };

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
        {notification && (
            <NotificationBanner
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(null)}
            />
        )}

        <div className="fixed top-2 right-[200px] transform -translate-x-1/2 bg-[#1D1F19] text-white px-4 py-2 rounded-full text-sm shadow-lg z-50">
            <span>Connected as {currentPseudo || ownerPseudo}</span>
        </div>

        <Big_Logo_At_Left />
        <SearchBar onSearch={videoPlayerFeatures.handleSearch} />


        <div className="relative group flex items-center justify-center cursor-pointer">
            <div className="w-[850px] mt-4 absolute top-[550px]  left-[100px] ">
                <Playlist onVideoSelect={videoPlayerFeatures.handleVideoSelect} />

            </div>
            <div className="realtive w-full">
                <VideoContainer
                    webRTCFeatures={webRTCFeatures}
                    videoPlayerFeatures={videoPlayerFeatures}
                    isModalOpen={isScreenShareWindowOpen}
                    setIsModalOpen={setIsScreenShareWindowOpen}
                    isQueenBeeMode={isQueenBeeMode}
                    currentUserId={localStorage.getItem("userId") || socket.id}
                    ownerId={ownerId}
                />
            </div>
        </div>

        <WhiteBoard roomId={idRoom} isModalOpen={isWhiteboardOpen} setIsModalOpen={setIsWhiteboardOpen}/>
        <div className="fixed bottom-[10px] right-4 w-[90vw] max-w-[385px]"><ChatBox users={users} ownerId = {ownerId} /></div>
        <div className="fixed top-[65px] right-4 w-[90vw] max-w-[385px]"><BlocNote /></div>

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
                currentUserId={currentId}
                toggleBRB={toggleBrb}
                brbMode={brbMode}
                isScreenShareWindowOpen={isScreenShareWindowOpen}
                onToggleScreenShareWindow={() => setIsScreenShareWindowOpen(prev => !prev)}
                onToggleWhiteboard={() => setIsWhiteboardOpen(prev => !prev)}
                isWhiteboardOpen={isWhiteboardOpen}
            />
        </div>

        <HiveTimerBanner ownerId={ownerId} timerEndsAt={timerEndsAt} roomId={idRoom} currentId={currentId} ownerPseudo={ownerPseudo} />
    </div>
);
}

export default HivePage;