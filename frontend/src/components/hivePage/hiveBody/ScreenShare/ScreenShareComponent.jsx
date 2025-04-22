import React from 'react';

const ScreenShareComponent = ({ videoRef, isSharing, remoteStream, onStopSharing }) => {
    return (
        <div className="relative w-full h-full">
            {isSharing ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full rounded shadow bg-black object-contain"
                    />
                    <button
                        onClick={onStopSharing}
                        className="absolute top-2 right-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Arrêter le partage
                    </button>
                </>
            ) : remoteStream ? (
                <video
                    autoPlay
                    playsInline
                    className="w-full h-full rounded shadow bg-black object-contain"
                    ref={(video) => {
                        if (video) {
                            video.srcObject = remoteStream;
                            video.onloadedmetadata = () => {
                                console.log("Métadonnées du flux distant chargées");
                                video.play().catch(err => 
                                    console.error("Erreur de lecture:", err)
                                );
                            };
                        }
                    }}
                />
            ) : null}
        </div>
    );
};

export default ScreenShareComponent; 