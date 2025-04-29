import React, { useState } from "react";

function MemberInHive({
                          pseudo,
                          isOwner = false,
                          isQueenBeeMode = false,
                          currentUserId,
                          ownerId
                      }) {
    const [showModal, setShowModal] = useState(false);

    const [isMuted, setIsMuted] = useState(false);
    const [isSharingAllowed, setIsSharingAllowed] = useState(true);
    const [isVideoAllowed, setIsVideoAllowed] = useState(true);

    const handleClick = () => {
        if (!isOwner && isQueenBeeMode && currentUserId === ownerId) {
            setShowModal(prev => !prev);
        }
    }
    return (
        <li className="relative group bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center cursor-pointer">
            <img
                src="/assets/SoloBee2.png"
                alt="Bee"
                className="w-[28px] h-[28px]"
                onClick={handleClick}
            />

            {/* Hover - pseudo */}
            <span className="absolute left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 transition-opacity duration-200">
                {pseudo}
            </span>

            {/* Modal */}
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
                                className="bg-black text-xs px-2 py-1 rounded w-[80px] "
                                onClick={() => setIsMuted(false)}
                            >
                                Unmute
                            </button>
                        ) : (
                            <button
                                className="bg-[#FFCE1C] text-xs px-2 py-1 rounded text-black w-[80px]"
                                onClick={() => setIsMuted(true)}
                            >
                                Mute
                            </button>
                        )}
                    </div>

                    {/* Share Screen Permission */}
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

                    {/* Video Control */}
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
