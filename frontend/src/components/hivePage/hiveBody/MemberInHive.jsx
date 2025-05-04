import React, { useEffect, useState } from "react";
import socket from "../../socket";

import { useNavigate } from "react-router-dom";


function MemberInHive({
                          pseudo,
                          micControl,
                          whiteBoardControl,
                          screenShareControl,
                          videoControl,
                          isOwner = false,
                          isQueenBeeMode = false,
                          currentUserId,
                          roomId,
                          ownerId,
                          userId,
                          manualMuted,
                          setNotification,

                      }) {
    const [showModal, setShowModal] = useState(false);

    const [isMuted, setIsMuted] = useState(!micControl || manualMuted);
    const [isWhiteboardAllowed, setIsWhiteboardAllowed] = useState(whiteBoardControl) ;
    const [isSharingAllowed, setIsSharingAllowed] = useState(screenShareControl);
    const [isVideoAllowed, setIsVideoAllowed] = useState(videoControl);
    const [isBRB, setIsBRB] = useState(false);
    const navigate = useNavigate();
    const [handIsRaised, setHandIsRaised] = useState(false);


    // Mettre à jour les états de partage d'écran et vidéo quand les props changent
    useEffect(() => {
        setIsSharingAllowed(screenShareControl);
        setIsVideoAllowed(videoControl);
    }, [screenShareControl, videoControl]);

    useEffect(() => {
        if(micControl === false) {
            setIsMuted(true);
        }else{
            setIsMuted(false);
        }
    }, [micControl]);



    useEffect(() => {
        const handleMicStatus = ({ detail }) => {
            if (detail.userId === userId) {
                const muted = !detail.micOn || !detail.micAllowed;
                setIsMuted(muted);
            }
        };

        window.addEventListener("mic-status-updated", handleMicStatus);
        return () => window.removeEventListener("mic-status-updated", handleMicStatus);
    }, [userId]);


    useEffect(() => {
        setIsWhiteboardAllowed(whiteBoardControl);
    }, [whiteBoardControl]);






    useEffect(() => {
        const handleScreenSharePermissionUpdate = ({ userId: updatedUserId, screenShareControl: newScreenShareControl }) => {
            if (updatedUserId === userId) {
                setIsSharingAllowed(newScreenShareControl);
                if (currentUserId === userId) {
                    setNotification({
                        message: newScreenShareControl
                            ? "Tu peux maintenant partager ton écran!"
                            : "Le partage d'écran a été désactivé par la reine.",
                        type: newScreenShareControl ? "info" : "danger"
                    });
                }
            }
        };

        const handleVideoPermissionUpdate = ({ userId: updatedUserId, videoControl: newVideoControl }) => {
            if (updatedUserId === userId) {
                setIsVideoAllowed(newVideoControl);
                if (currentUserId === userId) {
                    setNotification({
                        message: newVideoControl
                            ? "Tu peux maintenant contrôler la vidéo!"
                            : "Le contrôle de la vidéo a été désactivé par la reine.",
                        type: newVideoControl ? "info" : "danger"
                    });
                }
            }
        };

        socket.on("screen_share_permission_updated", handleScreenSharePermissionUpdate);
        socket.on("video_permission_updated", handleVideoPermissionUpdate);

        return () => {
            socket.off("screen_share_permission_updated", handleScreenSharePermissionUpdate);
            socket.off("video_permission_updated", handleVideoPermissionUpdate);
        };
    }, [userId,currentUserId,setNotification]);

    useEffect(() => {
        socket.on("user_brb_status", ({ userId: updatedUserId, isBRB: newBRBStatus }) => {
            if (updatedUserId === userId) {
                setIsBRB(newBRBStatus);
                setNotification({
                    message: newBRBStatus
                        ? `${pseudo} est en mode Bee Right Back`
                        : `${pseudo} est de retour!`,
                    type: "info"
                });
            }
        });

        return () => {
            socket.off("user_brb_status");
        };
    }, [userId, pseudo, setNotification]);

    const canModifyPermissions = currentUserId === ownerId;

    const handleClick = () => {
        //  Seul l’owner peut ouvrir les permissions en mode QueenBee
        if (!isOwner && isQueenBeeMode && currentUserId === ownerId) {
            setShowModal((prev) => !prev);
        }
    }


    const handleExclusion = () => {
        socket.emit("exclude_user", { roomId, userId });
    };


    useEffect(() => {
        const handleRaiseHand = ({ userId: raisedUserId, raised }) => {
            if (raisedUserId === userId) {
                setHandIsRaised(raised);
            }
        };

        socket.on("user_raise_hand_status", handleRaiseHand);

        return () => {
            socket.off("user_raise_hand_status", handleRaiseHand);
        };
    }, [userId]);



    return (
        <li className="relative group bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center cursor-pointer ">
            {/* le div pour le cercle autour de l'icon quand l'utilisateur parle*/}
            <div
                id={`user-${userId}`}
                className={`relative rounded-full transition-all w-[50px] h-[50px] flex items-center justify-center cursor-pointer
                ${handIsRaised && isMuted ? 'ring-4 ring-red-500' : 'ring-4 ring-transparent'}
              `}
                onClick={handleClick}
            >

            {isMuted? (
                    <span className="text-white text-xs">Muted</span>
                ):isBRB ? (

                    <span className="text-white text-xs">BRB</span>
                ):isMuted ? (
                    <span className="text-white text-xs">Muted</span>
                    ) : (
                    <img
                        src="/assets/SoloBee2.png"
                        alt="Bee"
                        className="w-[28px] h-[28px]"
                    />
                )}
            </div>

            <span className="absolute left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 transition-opacity duration-200">
        {pseudo}
      </span>

            {showModal && (
                <div className="absolute left-14 top-0 bg-[#1D1F27] text-white rounded-lg shadow-md p-3 space-y-2 z-50 w-max">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold">Gérer {pseudo}</p>
                        <button
                            className="text-gray-400 hover:text-white text-lg font-bold"
                            onClick={() => setShowModal(false)}
                        >
                            ×
                        </button>
                    </div>

                    {/* Mute / Unmute */}
                    <div className="flex gap-2">
                        {isMuted ? (
                            <button
                                className="bg-[#FFCE1C] text-xs px-2 py-1 rounded text-black w-[80px]"
                                onClick={() => {
                                    setIsMuted(false);
                                    socket.emit("update_mic_permission", {
                                        targetUserPseudo: pseudo,

                                        allowMic: true

                                    });
                                }}
                            >
                                Unmute
                            </button>
                        ) : (
                            <button
                                className="bg-black text-xs px-2 py-1 rounded w-[80px]"
                                onClick={() => {
                                    setIsMuted(true);
                                    socket.emit("update_mic_permission", {
                                        targetUserPseudo: pseudo,

                                        allowMic: false

                                    });
                                }}
                            >
                                Mute
                            </button>
                        )}
                    </div>

                    {/* Whiteboard Control */}
                    <div className="flex gap-2">
                        {isWhiteboardAllowed ? (
                            <button
                                className="bg-black text-xs px-2 py-1 rounded w-[80px]"
                                onClick={() => {
                                    setIsWhiteboardAllowed(false);
                                    socket.emit("update_whiteboard_permission", {
                                        targetUserPseudo: pseudo,
                                        allowWhiteboard: false
                                    });

                                    // Notification côté Owner
                                    setNotification({
                                        message: ` ${pseudo} ne peut plus utiliser le whiteboard.`,
                                        type: "danger",
                                    });
                                }}
                            >
                                Block Board
                            </button>
                        ) : (
                            <button
                                className="bg-[#FFCE1C] text-xs px-2 py-1 rounded text-black w-[80px]"
                                onClick={() => {
                                    setIsWhiteboardAllowed(true);
                                    socket.emit("update_whiteboard_permission", {
                                        targetUserPseudo: pseudo,
                                        allowWhiteboard: true
                                    });

                                    // Notification côté Owner
                                    setNotification({
                                        message: ` ${pseudo} peut maintenant utiliser le whiteboard.`,
                                        type: "info",
                                    });
                                }}
                            >
                                Allow Board
                            </button>
                        )}
                    </div>



                    {/* Share Screen */}
                    <div className="flex gap-2">
                        {isSharingAllowed ? (
                            <button
                                className="bg-black text-xs px-2 py-1 rounded w-[80px]"
                                onClick={() => {
                                    setIsSharingAllowed(false);
                                    socket.emit("update_screen_share_permission", {
                                        targetUserPseudo: pseudo,
                                        allowScreenShare: false,
                                    });
                                    setNotification({
                                        message: `${pseudo} ne peut plus partager son écran.`,
                                        type: "danger"
                                    });
                                }}
                            >
                                Block Share
                            </button>
                        ) : (
                            <button
                                className="bg-[#FFCE1C] text-xs px-2 py-1 rounded text-black w-[80px]"
                                onClick={() => {
                                    setIsSharingAllowed(true);
                                    socket.emit("update_screen_share_permission", {
                                        targetUserPseudo: pseudo,
                                        allowScreenShare: true
                                    });
                                    setNotification({
                                        message: `${pseudo} peut maintenant partager son écran.`,
                                        type: "info"
                                    });
                                }}
                            >
                                Allow Share
                            </button>
                        )}
                    </div>

                    {/* Video */}
                    <div className="flex gap-2">
                        {isVideoAllowed ? (
                            <button
                                className="bg-black text-xs px-2 py-1 rounded w-[80px]"
                                onClick={() => {
                                    setIsVideoAllowed(false);
                                    socket.emit("update_video_permission", {
                                        targetUserPseudo: pseudo,
                                        allowVideo: false
                                    });
                                    setNotification({
                                        message: `${pseudo} ne peut plus contrôler la vidéo.`,
                                        type: "danger"
                                    });
                                }}
                            >
                                Block Video
                            </button>
                        ) : (
                            <button
                                className="bg-[#FFCE1C] text-xs px-2 py-1 rounded text-black w-[80px]"
                                onClick={() => {
                                    setIsVideoAllowed(true);
                                    socket.emit("update_video_permission", {
                                        targetUserPseudo: pseudo,
                                        allowVideo: true
                                    });
                                    setNotification({
                                        message: `${pseudo} peut maintenant contrôler la vidéo.`,
                                        type: "info"
                                    });
                                }}
                            >
                                Allow Video
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExclusion}
                            className="bg-red-600 text-xs px-4 py-1 rounded hover:bg-red-700 w-[80px]"
                        >
                            Exclure
                        </button>
                    </div>
                </div>
            )}
        </li>
    );
}

export default MemberInHive;
