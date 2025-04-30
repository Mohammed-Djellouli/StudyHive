import React from "react";
import { FaPlus } from 'react-icons/fa';
import socket from '../../../../components/socket';
import { useParams } from 'react-router-dom';

const VideoItem = ({ video, onVideoSelect }) => {
    const { roomId } = useParams();

    const handleAddToPlaylist = (e) => {
        e.stopPropagation(); // Empêche le déclenchement du onClick du parent
        
        // Utiliser le même format que dans Playlist.jsx
        socket.emit('add_to_playlist', {
            roomId,
            videoId: video.id.videoId,
            title: video.snippet.title,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`
        });
    };

    return (
        <div
            className="flex items-center cursor-pointer bg-[#1a1a1a] p-2 rounded hover:bg-[#2a2a2a]"
            onClick={() => onVideoSelect(video)}
        >
            <img
                src={video.snippet.thumbnails.medium.url}
                alt={video.snippet.title}
                className="w-[120px] h-[90px] rounded mr-4"
            />
            <div className="flex-1">
                <div className="text-white text-sm font-medium line-clamp-2">{video.snippet.title}</div>
            </div>
            <button
                onClick={handleAddToPlaylist}
                className="ml-4 p-2 bg-yellow-400 text-black rounded-full hover:bg-yellow-500 transition-colors flex items-center justify-center"
                title="Ajouter à la playlist"
            >
                <FaPlus className="w-4 h-4" />
            </button>
        </div>
    );
};

export default VideoItem; 