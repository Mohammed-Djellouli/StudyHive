import React, { useEffect, useState } from "react";
import { FaPlus, FaLock } from 'react-icons/fa';
import socket from '../../../../components/socket';

const VideoItem = ({ video, onVideoSelect, roomId, hasPermission }) => {
    const [isEnabled, setIsEnabled] = useState(hasPermission);

    useEffect(() => {
        setIsEnabled(hasPermission);
    }, [hasPermission]);

    const handleAddToPlaylist = (e) => {
        e.stopPropagation();

        if (!isEnabled) {
            return;
        }

        socket.emit('add_to_playlist', {
            roomId,
            videoId: video.id.videoId,
            title: video.snippet.title,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`
        });
    };

    return (
        <div
            className={`flex items-center ${isEnabled ? 'cursor-pointer' : 'cursor-not-allowed'} bg-[#1a1a1a] p-2 rounded hover:bg-[#2a2a2a] relative group transition-all duration-300`}
            onClick={() => isEnabled && onVideoSelect && onVideoSelect(video)}
        >
            <img
                src={video.snippet.thumbnails.medium.url}
                alt={video.snippet.title}
                className={`w-[100px] h-[75px] rounded mr-3 object-cover transition-opacity duration-300 ${!isEnabled && 'opacity-50'}`}
            />
            <div className="flex-1 min-w-0">
                <div className={`text-white text-sm font-medium line-clamp-2 transition-opacity duration-300 ${!isEnabled && 'opacity-50'}`}>
                    {video.snippet.title}
                </div>
            </div>
            {isEnabled ? (
                <button
                    onClick={handleAddToPlaylist}
                    className="ml-4 p-2 bg-yellow-400 text-black rounded-full hover:bg-yellow-500 transition-colors flex items-center justify-center"
                    title="Ajouter à la playlist"
                >
                    <FaPlus className="w-4 h-4" />
                </button>
            ) : (
                <div className="ml-4 p-2 bg-gray-600 text-white rounded-full flex items-center justify-center">
                    <FaLock className="w-4 h-4" />
                </div>
            )}

            {!isEnabled && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm">Permissions insuffisantes</span>
                </div>
            )}
        </div>
    );
};

export default VideoItem;