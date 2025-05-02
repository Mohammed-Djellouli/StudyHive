import React, { useEffect, useState } from "react";
import socket from "../../socket";

function MemberInHive({
                          pseudo,
                          micControl,
                          whiteBoardControl,
                          isOwner = false,
                          isQueenBeeMode = false,
                          currentUserId,
                          ownerId,
                          userId,
                          setNotification
                      }) {
    const [showModal, setShowModal] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSharingAllowed, setIsSharingAllowed] = useState(true);
    const [isVideoAllowed, setIsVideoAllowed] = useState(true);
    const [whiteBoardAllowed, setWhiteBoardAllowed] = useState(whiteBoardControl);

    useEffect(() => {
        setIsMuted(!micControl);
    }, [micControl]);

    // 🔄 Mise à jour en temps réel des permissions whiteboard
    useEffect(() => {
        const myPseudo = localStorage.getItem("userPseudo");

        const handleWhiteboardPermissionUpdate = ({ pseudo, whiteBoardControl }) => {
            if (pseudo === myPseudo) {
                const message = whiteBoardControl
                    ? "Tu as reçu l'accès au tableau blanc"
                    : "Ton accès au tableau blanc a été retiré";

                setNotification({ message, type: whiteBoardControl ? "info" : "danger" });
            }
        };

        socket.on("whiteboard_permission_updated", handleWhiteboardPermissionUpdate);

        return () => {
            socket.off("whiteboard_permission_updated", handleWhiteboardPermissionUpdate);
        };
    }, []);


    const handleClick = () => {
        // ✅ Seul l’owner peut ouvrir les permissions en mode QueenBee
        if (!isOwner && isQueenBeeMode && currentUserId === ownerId) {
            setShowModal((prev) => !prev);
        }
    };

    return (
        <li className="relative group bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center cursor-pointer">
            <div
                id={`user-${userId}`}
                className="relative rounded-full ring-4 ring-transparent transition-all w-[50px] h-[50px] flex items-center justify-center"
            >
                <img
                    src="/assets/SoloBee2.png"
                    alt="Bee"
                    className="w-[28px] h-[28px]"
                    onClick={handleClick}
                />
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
                                className="bg-black text-xs px-2 py-1 rounded w-[80px]"
                                onClick={() => {
                                    setIsMuted(false);
                                    socket.emit("update_mic_permission", {
                                        targetUserPseudo: pseudo,
                                        allowMic: true,
                                    });
                                }}
                            >
                                Unmute
                            </button>
                        ) : (
                            <button
                                className="bg-[#FFCE1C] text-xs px-2 py-1 rounded text-black w-[80px]"
                                onClick={() => {
                                    setIsMuted(true);
                                    socket.emit("update_mic_permission", {
                                        targetUserPseudo: pseudo,
                                        allowMic: false,
                                    });
                                }}
                            >
                                Mute
                            </button>
                        )}
                    </div>

                    {/* Whiteboard */}
                    <div className="flex gap-2">
                        {whiteBoardAllowed ? (
                            <button
                                className="bg-black text-xs px-2 py-1 rounded w-[80px]"
                                onClick={() => {
                                    socket.emit("update_whiteboard_permission", {
                                        targetUserPseudo: pseudo,
                                        allowWhiteboard: false,
                                    });
                                    setWhiteBoardAllowed(false);

                                    // ✅ Notification
                                    setNotification({
                                        message: `${pseudo} ne peut plus dessiner sur le whiteboard.`,
                                        type: "danger",
                                    });
                                }}
                            >
                                Block Draw
                            </button>
                        ) : (
                            <button
                                className="bg-[#FFCE1C] text-xs px-2 py-1 rounded text-black w-[80px]"
                                onClick={() => {
                                    socket.emit("update_whiteboard_permission", {
                                        targetUserPseudo: pseudo,
                                        allowWhiteboard: true,
                                    });
                                    setWhiteBoardAllowed(true);

                                    // ✅ Notification
                                    setNotification({
                                        message: `${pseudo} peut maintenant dessiner sur le whiteboard.`,
                                        type: "info",
                                    });
                                }}
                            >
                                Allow Draw
                            </button>
                        )}

                    </div>

                    {/* Share Screen */}
                    <div className="flex gap-2">
                        {isSharingAllowed ? (
                            <button
                                className="bg-black text-xs px-2 py-1 rounded w-[80px]"
                                onClick={() => setIsSharingAllowed(false)}
                            >
                                Block Share
                            </button>
                        ) : (
                            <button
                                className="bg-[#FFCE1C] text-xs px-2 py-1 rounded text-black w-[80px]"
                                onClick={() => setIsSharingAllowed(true)}
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
                                onClick={() => setIsVideoAllowed(false)}
                            >
                                Block Video
                            </button>
                        ) : (
                            <button
                                className="bg-[#FFCE1C] text-xs px-2 py-1 rounded text-black w-[80px]"
                                onClick={() => setIsVideoAllowed(true)}
                            >
                                Allow Video
                            </button>
                        )}
                    </div>
                </div>
            )}
        </li>
    );
}

export default MemberInHive;
