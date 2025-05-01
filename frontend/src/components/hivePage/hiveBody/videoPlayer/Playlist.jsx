import React, { useEffect, useState } from 'react';
import socket from '../../../../components/socket';
import { useParams } from 'react-router-dom';
import { FaTrash, FaPlay, FaSearch, FaPlus } from 'react-icons/fa';
import '../../../../styles/scrollbar.css';

const getYouTubeThumbnail = (videoId) =>
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

const Playlist = ({ onVideoSelect }) => {
    const [playlist, setPlaylist] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchMode, setSearchMode] = useState('playlist');
    const { roomId } = useParams();

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

    // Function to add video to playlist
    const handleAddToPlaylist = (video) => {
        socket.emit('add_to_playlist', {
            roomId,
            videoId: video.id.videoId,
            title: video.snippet.title,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`
        });
        if (searchMode === 'youtube') {
            setSearchTerm('');
            setSearchResults([]);
        }
    };

    // Function to remove video from playlist
    const handleRemoveVideo = (videoId) => {
        socket.emit('remove_from_playlist', { roomId, videoId });
    };

    // YouTube search function
    const searchYoutube = async (term) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }
        
        setIsSearching(true);
        const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
        
        try {
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(term)}&key=${apiKey}&type=video`;
            const response = await fetch(searchUrl);
            const data = await response.json();
            
            if (data.error) {
                return;
            }
            
            if (data.items && data.items.length > 0) {
                setSearchResults(data.items);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Search change handler
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        if (searchMode === 'youtube' && value.trim()) {
            const timeoutId = setTimeout(() => {
                searchYoutube(value);
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    };

    // Filter videos based on search mode
    const getDisplayedVideos = () => {
        if (searchMode === 'youtube') {
            return searchResults;
        } else {
            return searchTerm.trim()
                ? playlist.filter(video => 
                    video.title.toLowerCase().includes(searchTerm.toLowerCase()))
                : playlist;
        }
    };

    const displayedVideos = getDisplayedVideos();
    const maxHeight = '400px';

    const handlePlayVideo = (video) => {
        if (onVideoSelect) {
            const videoForPlayer = {
                id: { videoId: video.videoId || video.id.videoId },
                snippet: {
                    title: video.title || video.snippet.title,
                    thumbnails: {
                        medium: { 
                            url: video.videoId 
                                ? getYouTubeThumbnail(video.videoId)
                                : video.snippet.thumbnails.medium.url 
                        }
                    }
                }
            };
            onVideoSelect(videoForPlayer);
        }
    };

    return (
        <div className="bg-[#1a1a1a] rounded-xl p-4 flex flex-col gap-4 shadow-lg">
            <h3 className="text-yellow-400 text-lg font-semibold mb-2">Playlist</h3>

            
            {/* Barre de recherche avec sélecteur de mode */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder={searchMode === 'playlist' ? "Filtrer la playlist..." : "Rechercher sur YouTube..."}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full bg-[#2a2a2a] text-white px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
                    />
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <button
                    onClick={() => {
                        setSearchMode(searchMode === 'playlist' ? 'youtube' : 'playlist');
                        setSearchTerm('');
                        setSearchResults([]);
                    }}
                    className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333333] transition-colors"
                >
                    {searchMode === 'playlist' ? 'YouTube' : 'Playlist'}
                </button>
            </div>

            <div 
                className="flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-[#2a2a2a]"
                style={{ 
                    maxHeight,
                    minHeight: '100px'
                }}
            >
                {isSearching ? (
                    <div className="text-gray-400 text-center py-4">
                        Recherche en cours...
                    </div>
                ) : searchMode === 'youtube' ? (
                    // Affichage des résultats YouTube
                    displayedVideos.map((video) => (
                        <div
                            key={video.id.videoId}
                            className="flex flex-row items-center bg-[#2a2a2a] rounded-lg p-3 shadow hover:bg-[#333333] transition-colors"
                        >
                            <img
                                src={video.snippet.thumbnails.medium.url}
                                alt={video.snippet.title}
                                className="w-[120px] h-[90px] rounded mr-4 object-cover"
                            />
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="text-white text-base font-medium truncate mb-2">
                                    {video.snippet.title}
                                </div>
                                <button
                                    onClick={() => handleAddToPlaylist(video)}
                                    className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300"
                                >
                                    <FaPlus /> Ajouter à la playlist
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    // Affichage de la playlist filtrée
                    displayedVideos.map((video) => (
                        <div
                            key={video.videoId}
                            className="flex flex-row items-center bg-[#2a2a2a] rounded-lg p-3 shadow hover:bg-[#333333] transition-colors cursor-pointer"
                            onClick={() => handlePlayVideo(video)}
                        >
                            <img
                                src={getYouTubeThumbnail(video.videoId)}
                                alt={video.title}
                                className="w-[120px] h-[90px] rounded mr-4 object-cover bg-black"
                            />
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="text-white text-base font-medium truncate mb-2">
                                    {video.title}
                                </div>
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
                            </div>
                        </div>
                    ))
                )}
                {!isSearching && displayedVideos.length === 0 && (
                    <div className="text-gray-400 text-center py-4 min-w-[200px]">
                        {searchMode === 'youtube' 
                            ? (searchTerm ? "Aucune vidéo trouvée" : "Recherchez des vidéos YouTube à ajouter")
                            : (searchTerm ? "Aucune vidéo trouvée" : "Aucune vidéo dans la playlist")}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Playlist; 