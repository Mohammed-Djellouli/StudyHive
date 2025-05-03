
import React, {useEffect, useState} from "react";
import {useLocation} from "react-router-dom";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";


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
import InviteModal from "./components/hivePage/hiveHandle/InviteModal";

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
    const [isScreenShareWindowOpen, setIsScreenShareWindowOpen] = useState(false);

    const [currentPseudo, setCurrentPseudo] = useState('');
    const [currentId, setCurrentId] = useState('');


    const [isChatVisible, setIsChatVisible] = useState(true);

    const navigate = useNavigate();

    const [justExcludedIds, setJustExcludedIds] = useState(new Set());
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);


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
        socket.on("whiteboard_permission_updated", ({ pseudo, whiteBoardControl }) => {
            setUsers(prev =>
                prev.map(user =>
                    user.pseudo === pseudo ? { ...user, whiteBoardControl } : user
                )
            );
        });

        return () => {
            socket.off("whiteboard_permission_updated");
        };
    }, []);


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
                if (prev.find(u => u.userId === newUser.userId || u.pseudo === newUser.pseudo)) return prev;

                const newUserWithDefaults = {
                    micControl: true,
                    whiteBoardControl: false,
                    ...newUser
                };

                setNotification({ message: `${newUser.pseudo} a rejoint la Ruche`, type: "info" });
                return [...prev, newUserWithDefaults];
            });
        });

    });

    socket.on("user_left", ({ userId: idLeft, pseudo }) => {
        const idStr = idLeft.toString();
        const id = localStorage.getItem("userId");
        const myPseudo = localStorage.getItem("userPseudo");

        if (justExcludedIds.has(idStr)) {
            console.log(" Ignoré car déjà exclu :", idStr);
            return;
        }
            setUsers((prev) => {
                const userToRemove = prev.find(user =>
                    idStr === user.userId?.toString() ||
                    idStr === user.socketId?.toString() ||
                    idStr === user._id?.toString()
                );



                if(idStr === id){
                    if (myPseudo.startsWith("Bee-")) {
                        localStorage.removeItem("userId");
                        localStorage.removeItem("userPseudo");
                    }
                    setTimeout(() => {
                        navigate("/", {
                            state: {
                                notification: {
                                    message: "Vous avez été exclu de la ruche.",
                                    type: "danger"
                                }
                            }
                        });
                    }, 1000);
                }
                else {
                    setNotification({ message: `${pseudo} a quitté la Ruche`, type: "danger" });
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

    useEffect(() => {
        const handleExclusion = (data) => {
            const kickedId = data?.userId;
            const myId = localStorage.getItem("userId");
            const myPseudo = localStorage.getItem("userPseudo");

            if (!kickedId || !myId) return;

            const isMe = String(kickedId).trim() === String(myId).trim();


            setJustExcludedIds(prev => new Set(prev).add(kickedId));

            if (isMe) {


                if (myPseudo?.startsWith("Bee-")) {
                    localStorage.removeItem("userId");
                    localStorage.removeItem("userPseudo");
                }

                setNotification({
                    message: "Vous avez été exclu de la ruche.",
                    type: "danger"
                });


                setTimeout(() => {
                    navigate("/", {
                        state: {
                            notification: {
                                message: "Vous avez été exclu de la ruche.",
                                type: "danger"
                            }
                        }
                    });
                }, 1000);
            } else {
                setNotification({
                    message: `${myPseudo} a été exclu.`,
                    type: "danger"
                });
            }
        };

        socket.on("excluded_from_room", handleExclusion);

        return () => {
            socket.off("excluded_from_room", handleExclusion);
        };
    }, [navigate]);

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

        {(!isQueenBeeMode || (isQueenBeeMode && currentId === ownerId)) && (
            <div className="absolute top-4 left-[320px] z-50">
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="bg-amber-400 text-black px-4 py-1 rounded-full text-sm shadow hover:bg-amber-300 transition"
                >
                    Inviter
                </button>
            </div>
        )}

        {isInviteModalOpen && (
            <InviteModal roomId={idRoom} onClose={() => setIsInviteModalOpen(false)} />
        )}


        

        <SearchBar onSearch={videoPlayerFeatures.handleSearch}
                   currentUserId={localStorage.getItem("userId") || socket.id}
                   ownerId={ownerId}
                   users={users}
        />



        <WhiteBoard
            roomId={idRoom}
            isModalOpen={isWhiteboardOpen}
            setIsModalOpen={setIsWhiteboardOpen}
            canDraw={users.find(u => u.userId === currentId)?.whiteBoardControl ?? true}
            setNotification={setNotification}
        />






        {/* CONTENEUR synchronisé Chat + BlocNote */}
            <div className="absolute top-[65px] right-4 w-[90vw] max-w-[385px] flex flex-col z-50 transition-all duration-500 max-h-[calc(100vh-80px)] overflow-y-auto bg-transparent">

                {/* BlocNote */}
                <div className={`transition-all duration-500 ease-in-out ${isChatVisible ? "h-[280px]" : "h-[550px]"} mb-2`}>
                    <BlocNote isChatVisible={isChatVisible} />
                </div>

                <div className={`transition-all duration-500 ease-in-out ${isChatVisible ? "h-[351px] opacity-100" : "h-0 opacity-0"} overflow-hidden`}>
                    <div className="w-full h-full">
                        <ChatBox users={users} ownerId = {ownerId} />
                    </div>
                </div>


                {/* Bouton sticky toujours visible */}
                <div className="sticky bottom-0 bg-[#1D1F27] mt-2 z-10">
                    <button
                        onClick={() => setIsChatVisible(prev => !prev)}
                        className="w-full bg-yellow-400 text-black px-2 py-1 rounded-b-md hover:bg-yellow-300 transition"
                    >
                        {isChatVisible ? "▼ Masquer le Chat" : "▲ Afficher le Chat"}
                    </button>
                </div>
            </div>






        <div className="relative group flex items-center justify-center cursor-pointer">
            <div className="w-[850px] mt-4 absolute top-[550px]  left-[100px] ">
                <Playlist
                    onVideoSelect={videoPlayerFeatures.handleVideoSelect}
                    roomId={idRoom}
                />


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
                    users={users}
                    roomId={idRoom}
                />

            </div>
        </div>

        <Left_bar_Icons_members_In_Room
            ownerPseudo={ownerPseudo}
            isQueenBeeMode={isQueenBeeMode}
            users={users}
            ownerId={ownerId}
            roomId={idRoom}
            setJustExcludedIds={setJustExcludedIds}
            setNotification={setNotification}
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