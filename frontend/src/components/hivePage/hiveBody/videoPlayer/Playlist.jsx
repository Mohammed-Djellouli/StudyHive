import React, { useEffect, useState } from 'react';
import socket from '../../../../components/socket';
import { FaTrash, FaPlay, FaSearch } from 'react-icons/fa';
import '../../../../styles/scrollbar.css';

const getYouTubeThumbnail = (videoId) =>
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

const Playlist = ({ onVideoSelect, roomId, currentUserId, ownerId, users }) => {
    const [playlist, setPlaylist] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasVideoPermission, setHasVideoPermission] = useState(false);

    // Vérifier la permission vidéo basée sur users
    useEffect(() => {
        if (!users || users.length === 0 || !currentUserId) return;

        const currentUser = users.find(user => user.userId === currentUserId || user._id === currentUserId);
        if (currentUser) {
            setHasVideoPermission(currentUser.videoControl);
        }
    }, [users, currentUserId]);

    // Écouter les mises à jour des permissions vidéo en temps réel
    useEffect(() => {
        const handleVideoPermissionUpdate = ({ userId, videoControl }) => {
            if (userId === currentUserId) {
                setHasVideoPermission(videoControl);
            }
        };

        socket.on("video_permission_updated", handleVideoPermissionUpdate);
        return () => socket.off("video_permission_updated", handleVideoPermissionUpdate);
    }, [currentUserId]);

    // Function to fetch playlist
    function fetchPlaylist() {
        socket.emit('get_playlist', { roomId });
    }

    useEffect(() => {
        // Initial fetch
        fetchPlaylist();

        // Set up interval for periodic refresh (every 1 second)
        const refreshInterval = setInterval(() => {
            fetchPlaylist();
        }, 1000);

        // Socket event handlers
        const handlePlaylistUpdate = (updatedPlaylist) => {
            setPlaylist(updatedPlaylist);
        };

        const handleVideoRemoved = (data) => {
            setPlaylist(prevPlaylist => {
                const newPlaylist = prevPlaylist.filter(video => video.videoId !== data.videoId);
                return newPlaylist;
            });
        };

        const handleVideoAdded = (video) => {
            setPlaylist(prevPlaylist => {
                if (prevPlaylist.some(v => v.videoId === video.videoId)) {
                    return prevPlaylist;
                }
                const newPlaylist = [video, ...prevPlaylist];
                return newPlaylist;
            });
        };

        // Socket event listeners
        socket.on('connect', fetchPlaylist);
        socket.on('playlist_updated', handlePlaylistUpdate);
        socket.on('video_removed', handleVideoRemoved);
        socket.on('video_added', handleVideoAdded);

        // Cleanup function
        return () => {
            clearInterval(refreshInterval);
            socket.off('connect', fetchPlaylist);
            socket.off('playlist_updated', handlePlaylistUpdate);
            socket.off('video_removed', handleVideoRemoved);
            socket.off('video_added', handleVideoAdded);
        };
    }, [roomId]);

    // Function to remove video from playlist
    const handleRemoveVideo = (videoId) => {
        if (!hasVideoPermission) {
            return; // Ne rien faire si l'utilisateur n'a pas la permission
        }
        socket.emit('remove_from_playlist', { roomId, videoId });
    };

    // Search change handler
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Filter videos based on search
    const getDisplayedVideos = () => {
        return searchTerm.trim()
            ? playlist.filter(video =>
                video.title.toLowerCase().includes(searchTerm.toLowerCase()))
            : playlist;
    };

    const displayedVideos = getDisplayedVideos();
    const maxHeight = '400px';

    const handlePlayVideo = (video) => {
        if (!hasVideoPermission) {
            return; // Ne rien faire si l'utilisateur n'a pas la permission
        }
        if (onVideoSelect) {
            const videoForPlayer = {
                id: { videoId: video.videoId },
                snippet: {
                    title: video.title,
                    thumbnails: {
                        medium: {
                            url: getYouTubeThumbnail(video.videoId)
                        }
                    }
                }
            };
            onVideoSelect(videoForPlayer);
        }
    };

    return (
        <div className="w-full bg-[#1a1a1a] rounded-xl p-4 flex flex-col gap-4 shadow-lg">
        <h3 className="text-yellow-400 text-lg font-semibold mb-2">Playlist</h3>

            {/* Barre de recherche avec état disabled basé sur les permissions */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder={hasVideoPermission ? "Filtrer la playlist..." : "Vous n'avez pas la permission de contrôler la playlist"}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        disabled={!hasVideoPermission}
                        className={`w-full bg-[#2a2a2a] text-white px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400 ${!hasVideoPermission && 'opacity-50 cursor-not-allowed'}`}
                    />
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            <div
                className="flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-[#2a2a2a]
                max-h-[300px] min-h-[250px]"
            >
                {displayedVideos.map((video) => (
                    <div
                        key={video.videoId}
                        className={`flex flex-row items-center bg-[#2a2a2a] rounded-lg p-3 shadow transition-colors ${
                            hasVideoPermission ? 'hover:bg-[#333333] cursor-pointer' : 'cursor-not-allowed opacity-75'
                        }`}
                        onClick={() => handlePlayVideo(video)}
                    >
                        <img
                            src={getYouTubeThumbnail(video.videoId)}
                            alt={video.title}
                            className="w-[120px] h-[70px] rounded mr-4 object-cover bg-black"
                        />
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="text-white text-base font-medium truncate mb-2">
                                {video.title}
                            </div>
                            {hasVideoPermission && (
                                <div className="flex gap-2 mt-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlayVideo(video);
                                        }}
                                        className="text-yellow-400 hover:text-yellow-300"
                                        title="Lire"
                                    >
                                        <FaPlay />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveVideo(video.videoId);
                                        }}
                                        className="text-red-500 hover:text-red-400"
                                        title="Supprimer"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {displayedVideos.length === 0 && (
                    <div className="text-gray-400 text-center py-4 min-w-[200px]">
                        {searchTerm ? "Aucune vidéo trouvée" : "Aucune vidéo dans la playlist"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Playlist; 