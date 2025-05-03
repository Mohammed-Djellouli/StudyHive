import React, { useState, useEffect } from 'react';
import VoiceChat from "../../Communication/MicChat/VoiceChat";
import socket from '../../../components/socket';

function LeftBarTools({ ownerPseudo, isQueenBeeMode, onStartSharing, isInitiator, isSharing, users = [], currentUserId, toggleBRB, brbMode, isScreenShareWindowOpen, onToggleScreenShareWindow, onToggleWhiteboard, isWhiteboardOpen, ownerId, setIsInviteModalOpen  }) {
    const [micOn, setMicOn] = useState(true);
    const [handRaised, setHandRaised] = useState(false);
    const [currentSharingUser, setCurrentSharingUser] = useState(null);
    const [sharePermission, setSharePermission] = useState(false);
    const myUserId = localStorage.getItem("userId");
    const toggleMic = () => setMicOn(prev => !prev);
    const toggleHand = () => setHandRaised(prev => !prev);

    // Vérifier la permission de partage d'écran basée sur users
    useEffect(() => {
        try {
            if (!Array.isArray(users) || users.length === 0 || !currentUserId) {
                setSharePermission(false);
                return;
            }

            const currentUser = users.find(user => 
                user && (
                    (user.userId && user.userId.toString() === currentUserId.toString()) || 
                    (user._id && user._id.toString() === currentUserId.toString())
                )
            );

            if (currentUser) {
                setSharePermission(!!currentUser.screenShareControl);
            } else {
                setSharePermission(false);
            }
        } catch (error) {
            console.error("Error checking share permission:", error);
            setSharePermission(false);
        }
    }, [users, currentUserId]);

    // Écouter les mises à jour des permissions de partage d'écran
    useEffect(() => {
        if (!currentUserId) return;

        const handleScreenSharePermissionUpdate = ({ userId, screenShareControl }) => {
            try {
                if (userId && userId.toString() === currentUserId.toString()) {
                    setSharePermission(!!screenShareControl);
                }
            } catch (error) {
                console.error("Error handling screen share permission update:", error);
            }
        };

        socket.on("screen_share_permission_updated", handleScreenSharePermissionUpdate);

        return () => {
            socket.off("screen_share_permission_updated", handleScreenSharePermissionUpdate);
        };
    }, [currentUserId]);

    // Effet pour l'écoute des événements de partage d'écran
    useEffect(() => {
        const handleScreenShareUpdate = (data) => {
            try {
                if (data && data.action === "started") {
                    setCurrentSharingUser(data.userId);
                }
            } catch (error) {
                console.error("Error handling screen share update:", error);
            }
        };

        const handleScreenShareStopped = () => {
            try {
                setCurrentSharingUser(null);
            } catch (error) {
                console.error("Error handling screen share stop:", error);
            }
        };

        socket.on("screen_share_update", handleScreenShareUpdate);
        socket.on("screen_share_stopped", handleScreenShareStopped);

        return () => {
            socket.off("screen_share_update", handleScreenShareUpdate);
            socket.off("screen_share_stopped", handleScreenShareStopped);
        };
    }, []);

    // Vérifie si l'utilisateur a la permission de partager l'écran
    const hasSharePermission = !!sharePermission;

    // Vérifie si le partage est possible techniquement
    const canShare = !isSharing && !currentSharingUser;


    console.log("== INVITE CHECK ==")
    console.log("isQueenBeeMode", isQueenBeeMode)
    console.log("currentUserId", currentUserId)
    console.log("ownerId", ownerId)
    console.log("MyActualId", myUserId)

    const handleBRBToggle = () => {
        socket.emit("toggle-brb", {
            roomId: window.location.pathname.split("/").pop(),
            userId: currentUserId,
            isBRB: !brbMode
        });
        toggleBRB();
    };

    return (
        <div className="fixed top-[80px] left-0 w-[50px] p-[5px] bg-[#1D1F27] rounded-[10px] flex flex-col items-center gap-4 z-20">
            {/* Share Screen */}
            <button
                onClick={hasSharePermission && canShare ? onStartSharing : undefined}
                className={`bg-black/60 p-2 rounded-full transition ${
                    !hasSharePermission || !canShare 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 hover:bg-yellow-400/20'
                }`}
                title={
                    !hasSharePermission 
                    ? "Vous n'avez pas la permission de partager l'écran"
                    : !canShare 
                    ? "Partage d'écran déjà en cours"
                    : "Partager l'écran"
                }
                disabled={!hasSharePermission || !canShare}
            >
                <img src="/assets/share-screen.png" alt="Share Screen" className="w-[24px] h-[24px]" />
            </button>

            {/* Toggle Screen Share Window Visibility */}
            <button
                onClick={onToggleScreenShareWindow}
                className="bg-black/60 p-2 rounded-full hover:scale-105 transition hover:bg-yellow-400/20"
                title={isScreenShareWindowOpen ? "Cacher la fenêtre de partage" : "Afficher la fenêtre de partage"}
            >
                {isScreenShareWindowOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                )}
            </button>

            {/* Toggle Mic */}
            <VoiceChat users={users} currentUserId={currentUserId}/>

            {/* Toggle Raise Hand */}
            <button onClick={toggleHand} className="bg-black/60 p-2 rounded-full hover:scale-105 transition">
                <img
                    src={handRaised ? "/assets/RisedHand-icon-after.png" : "/assets/RiseHand-icon-before.png"}
                    alt="Raise Hand"
                    className="w-[24px] h-[24px]"
                />
            </button>

            {/* Toggle WhiteBoard */}
            <button
                onClick={onToggleWhiteboard}
                className="bg-black/60 p-2 rounded-full hover:scale-105 transition hover:bg-yellow-400/20"
                title={isWhiteboardOpen ? "Cacher le tableau blanc" : "Afficher le tableau blanc"}
            >
                <img
                    src={isWhiteboardOpen ? "/assets/UnshowBoard.png" : "/assets/ShowBoard.png"}
                    alt="WhiteBoard"
                    className="w-[24px] h-[24px]"
                />
            </button>

            {/* BRB */}
            <div className="bg-black/60 rounded-full w-[40px] h-[40px] text-white text-sm font-bold flex items-center justify-center">
                <button
                    onClick={() => {
                        toggleBRB();
                        handleBRBToggle();
                    }}
                    className={"${brbMode ? 'text-yellow-400' : 'text-white'}"}
                >
                    {brbMode ? "Back" : "BRB"}
                </button>
            </div>

            {(!isQueenBeeMode || (isQueenBeeMode && myUserId === ownerId)) && (
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="bg-black/60 p-2 rounded-full hover:scale-105 transition hover:bg-yellow-400/20"
                    title="Inviter un membre"
                >
                    <img src="/assets/invite.png" alt="Inviter" className="w-[24px] h-[24px]" />
                </button>
            )}
        </div>
    );
}

export default LeftBarTools;