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
    const [isSidePanelVisible, setIsSidePanelVisible] = useState(true);
    const matchedUser = users.find(u => u.userId === currentId);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024); // lg = 1024
        };

        handleResize(); // appel initial
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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
        const handleManualMuteUpdate = ({ userId, isMuted }) => {
            window.dispatchEvent(new CustomEvent("mic-status-updated", {
                detail: {
                    userId,
                    micOn: !isMuted,
                    micAllowed: true
                }
            }));
        };

        socket.on("manual_mute_status_update", handleManualMuteUpdate);

        return () => {
            socket.off("manual_mute_status_update", handleManualMuteUpdate);
        };
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
                if (!newUser?.pseudo) return prev;
                if (prev.find(u => u.userId === newUser.userId || u.pseudo?.trim() === newUser.pseudo.trim())) return prev;


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
                }, 10);
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


        socket.on("manual_mute_status_update", ({ userId, isMuted }) => {
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.userId === userId || user._id === userId
                        ? { ...user, manualMuted: isMuted }
                        : user
                )
            );
        });

        const handleMicPermissionUpdated = ({ userId, micControl }) => {
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.userId === userId || user._id === userId
                        ? { ...user, micControl }
                        : user
                )
            );
        };

        socket.on("mic_permission_updated", handleMicPermissionUpdated);

        return () => {
            socket.off("user_joined");
            socket.off("user_left");
            socket.off("manual_mute_status_update");
            socket.off("mic_permission_updated", handleMicPermissionUpdated);
        };
    }, []);



    const handleManualLeave = () => {
        const userId = localStorage.getItem("userId");
        const roomId = idRoom; // depuis useParams

        if (userId && roomId) {
            socket.emit("manual_disconnect", { userId, roomId });
        }

        socket.disconnect();

        localStorage.removeItem("userId");
        localStorage.removeItem("userPseudo");
        localStorage.removeItem("token");

        navigate("/", {
            state: {
                notification: {
                    message: "Vous avez quitté la ruche.",
                    type: "info"
                }
            }
        });
    };


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

    useEffect(() => {
        const handleRoomClosed = ({ message }) => {
            const pseudo = localStorage.getItem("userPseudo");

            if (pseudo?.startsWith("Bee-")) {
                localStorage.removeItem("userId");
                localStorage.removeItem("userPseudo");
                localStorage.removeItem("token");
            }

            navigate("/", {
                state: {
                    notification: {
                        message: message || "La ruche a été fermée.",
                        type: "danger"
                    }
                }
            });
        };

        socket.on("room_closed", handleRoomClosed);

        return () => {
            socket.off("room_closed", handleRoomClosed);
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
        <div className="min-h-screen flex flex-col bg-[#1D1F27]" style={{ backgroundImage: "url('/assets/bg.png')", backgroundSize: "270%" }}>
            {/* Notification */}
            {notification && (
                <NotificationBanner
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {/* Header */}
            <div className="w-full px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-start">
                    <Big_Logo_At_Left />
                </div>

                <div className="flex-1 w-full md:w-auto max-w-[800px]">
                    <SearchBar
                        onSearch={videoPlayerFeatures.handleSearch}
                        currentUserId={localStorage.getItem("userId") || socket.id}
                        ownerId={ownerId}
                        users={users}
                    />
                </div>

                <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-end">
                    <HiveTimerBanner
                        ownerId={ownerId}
                        timerEndsAt={timerEndsAt}
                        roomId={idRoom}
                        currentId={currentId}
                        ownerPseudo={ownerPseudo}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-visible px-4 pb-4 gap-4">
                {/* Left Tools */}
                <div className="w-full lg:w-[80px] flex flex-row lg:flex-col items-center gap-4 justify-center">
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
                        ownerId={ownerId}
                        setIsInviteModalOpen={setIsInviteModalOpen}
                    />

                    <Left_bar_Icons_members_In_Room
                        key={users.map(u => u.userId).join("-")}
                        ownerPseudo={ownerPseudo}
                        isQueenBeeMode={isQueenBeeMode}
                        users={users}
                        ownerId={ownerId}
                        roomId={idRoom}
                        setJustExcludedIds={setJustExcludedIds}
                        setNotification={setNotification}
                    />
                </div>

                {/* CENTER COLUMN */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="w-full min-h-[200px]">
                        <VideoContainer
                            webRTCFeatures={webRTCFeatures}
                            videoPlayerFeatures={videoPlayerFeatures}
                            isModalOpen={isScreenShareWindowOpen}
                            setIsModalOpen={setIsScreenShareWindowOpen}
                            isQueenBeeMode={isQueenBeeMode}
                            currentUserId={currentId}
                            ownerId={ownerId}
                            users={users}
                            roomId={idRoom}
                        />
                    </div>

                    <div className="w-full min-h-[180px]">
                        <Playlist
                            onVideoSelect={videoPlayerFeatures.handleVideoSelect}
                            roomId={idRoom}
                            currentUserId={currentId}
                            ownerId={ownerId}
                            users={users}
                        />
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="w-full lg:max-w-[500px] flex flex-col justify-between gap-2">
                    {isMobile ? (
                        <div className="relative w-full h-[370px] mb-2">
                            {/* Switch button */}
                            <div className="absolute top-2 right-2 z-10">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${!isChatVisible ? "bg-white" : "bg-gray-500"}`} />
                                    <button
                                        onClick={() => setIsChatVisible(prev => !prev)}
                                        className="w-8 h-8 rounded-full bg-yellow-400 text-black font-bold shadow hover:bg-yellow-300 transition"
                                        title="Switcher BlocNote / Chat"
                                    >
                                        ⇄
                                    </button>
                                    <div className={`w-2 h-2 rounded-full ${isChatVisible ? "bg-white" : "bg-gray-500"}`} />
                                </div>
                            </div>

                            <div className="w-full h-full mt-8">
                                {isChatVisible ? (
                                    <ChatBox users={users} ownerId={ownerId} />
                                ) : (
                                    <BlocNote isChatVisible={isChatVisible} />
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={`transition-all duration-300 ${isChatVisible ? "h-[40%]" : "h-[calc(100%-40px)]"}`}>
                                <BlocNote isChatVisible={isChatVisible} />
                            </div>

                            <div className={`transition-all duration-300 ${isChatVisible ? "flex-1 opacity-100" : "h-0 opacity-0 overflow-hidden"}`}>
                                <ChatBox users={users} ownerId={ownerId} />
                            </div>

                            <div className="h-[40px]">
                                <button
                                    onClick={() => setIsChatVisible(prev => !prev)}
                                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-4 rounded w-full h-full"
                                >
                                    {isChatVisible ? "▼ Masquer le chat" : "▲ Afficher le chat"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isInviteModalOpen && (
                <InviteModal roomId={idRoom} onClose={() => setIsInviteModalOpen(false)} />
            )}

            <WhiteBoard
                roomId={idRoom}
                isModalOpen={isWhiteboardOpen}
                setIsModalOpen={setIsWhiteboardOpen}
                canDraw={matchedUser ? matchedUser.whiteBoardControl : true}
                setNotification={setNotification}
            />
        </div>
    );





}

export default HivePage;