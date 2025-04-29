import React, { useEffect, useState } from 'react';
import socket from '../../../../components/socket';
import { useParams } from 'react-router-dom';
import { FaTrash, FaPlay } from 'react-icons/fa';
import '../../../../styles/scrollbar.css';

const getYouTubeThumbnail = (videoId) =>
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

const Playlist = ({ onVideoSelect }) => {
    const [playlist, setPlaylist] = useState([]);
    const { roomId } = useParams();

    useEffect(() => {
        function fetchPlaylist() {
            socket.emit('get_playlist', { roomId });
        }

        fetchPlaylist();

        socket.on('connect', fetchPlaylist); // Re-fetch on reconnect

        const handlePlaylistUpdate = (updatedPlaylist) => {
            setPlaylist(updatedPlaylist);
        };
        socket.on('playlist_updated', handlePlaylistUpdate);

        return () => {
            socket.off('playlist_updated', handlePlaylistUpdate);
            socket.off('connect', fetchPlaylist);
        };
    }, [roomId]);

    const handleRemoveVideo = (videoId) => {
        socket.emit('remove_from_playlist', { roomId, videoId });
    };

    const handlePlayVideo = (video) => {
        if (onVideoSelect) {
            onVideoSelect(video);
        }
    };

    // Calculer la hauteur maximale en fonction du nombre de vidéos
    const maxHeight = playlist.length > 3 ? '400px' : 'auto';

    return (
        <div className="bg-[#18181b] rounded-xl p-4 flex flex-col gap-4 shadow-lg">
            <h3 className="text-yellow-400 text-lg font-semibold mb-2">Playlist</h3>
            <div 
                className="flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-[#2a2a2a]"
                style={{ 
                    maxHeight,
                    minHeight: playlist.length > 0 ? '100px' : 'auto'
                }}
            >
                {playlist.map((video) => (
                    <div
                        key={video.videoId}
                        className="flex flex-row items-center bg-[#23232a] rounded-lg p-3 shadow hover:bg-[#292933] transition-colors"
                    >
                        {/* Real YouTube thumbnail */}
                        <img
                            src={getYouTubeThumbnail(video.videoId)}
                            alt={video.videoId}
                            className="w-[120px] h-[90px] rounded mr-4 object-cover bg-black"
                        />
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="text-white text-base font-medium truncate mb-2">
                                {video.title || video.videoId}
                            </div>
                            <div className="flex gap-2 mt-1">
                                <button
                                    onClick={() => handlePlayVideo(video)}
                                    className="text-yellow-400 hover:text-yellow-300"
                                    title="Play"
                                >
                                    <FaPlay />
                                </button>
                                <button
                                    onClick={() => handleRemoveVideo(video.videoId)}
                                    className="text-red-500 hover:text-red-400"
                                    title="Remove"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {playlist.length === 0 && (
                    <div className="text-gray-400 text-center py-4 min-w-[200px]">
                        No videos in playlist
                    </div>
                )}
            </div>
        </div>
    );
};

export default Playlist; 