import React, { useState } from 'react';
import VoiceChat from "../../Communication/MicChat/VoiceChat";


function LeftBarTools({ ownerPseudo, isQueenBeeMode, onStartSharing, isInitiator, isSharing,users,currentUserId,toggleBRB,brbMode, isScreenShareWindowOpen, onToggleScreenShareWindow, onToggleWhiteboard,isWhiteboardOpen  }){

    const [micOn, setMicOn] = useState(true);
    const [handRaised, setHandRaised] = useState(false);
    const toggleMic = () => setMicOn(prev => !prev);
    const toggleHand = () => setHandRaised(prev => !prev);

    return (
        <div className="fixed top-[60px] left-0 w-[50px] p-[5px] bg-[#1D1F27] rounded-[10px] flex flex-col items-center gap-4 z-20">
            {/* Share Screen */}
            {!isSharing && (
                <button
                    onClick={onStartSharing}
                    className="bg-black/60 p-2 rounded-full hover:scale-105 transition hover:bg-yellow-400/20"
                    title="Partager l'écran"
                >
                    <img src="/assets/share-screen.png" alt="Share Screen" className="w-[24px] h-[24px]" />
                </button>
            )}

            {/* Toggle Screen Share Window Visibility */}
            <button
                onClick={onToggleScreenShareWindow}
                className="bg-black/60 p-2 rounded-full hover:scale-105 transition hover:bg-yellow-400/20"
                title={isScreenShareWindowOpen ? "Cacher la fenêtre de partage" : "Afficher la fenêtre de partage"}
            >
                {isScreenShareWindowOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <button onClick={toggleBRB}
                >{brbMode ? "Back" : "BRB"}</button>
            </div>
        </div>
    );
}

export default LeftBarTools;