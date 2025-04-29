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
        // Fonction pour récupérer la playlist
        function fetchPlaylist() {
            socket.emit('get_playlist', { roomId });
        }

        // Récupérer la playlist au chargement et à la reconnexion
        fetchPlaylist();
        socket.on('connect', fetchPlaylist);

        // Gestionnaire de mise à jour de la playlist
        const handlePlaylistUpdate = (updatedPlaylist) => {
            console.log('Playlist mise à jour:', updatedPlaylist);
            setPlaylist(updatedPlaylist);
        };

        // Gestionnaire de suppression de vidéo
        const handleVideoRemoved = (data) => {
            console.log('Vidéo supprimée:', data);
            setPlaylist(prevPlaylist => 
                prevPlaylist.filter(video => video.videoId !== data.videoId)
            );
        };

        // Gestionnaire d'ajout de vidéo
        const handleVideoAdded = (video) => {
            console.log('Nouvelle vidéo ajoutée:', video);
            setPlaylist(prevPlaylist => [...prevPlaylist, video]);
        };

        // Écouter les événements de mise à jour
        socket.on('playlist_updated', handlePlaylistUpdate);
        socket.on('video_removed', handleVideoRemoved);
        socket.on('video_added', handleVideoAdded);

        return () => {
            socket.off('playlist_updated', handlePlaylistUpdate);
            socket.off('video_removed', handleVideoRemoved);
            socket.off('video_added', handleVideoAdded);
            socket.off('connect', fetchPlaylist);
        };
    }, [roomId]);

    const handleRemoveVideo = (videoId) => {
        console.log('Demande de suppression de la vidéo:', videoId);
        socket.emit('remove_from_playlist', { roomId, videoId });
    };

    const handlePlayVideo = (video) => {
        console.log('Lecture de la vidéo:', video);
        if (onVideoSelect) {
            // Créer un objet compatible avec le format attendu par le lecteur
            const videoForPlayer = {
                id: { videoId: video.videoId },
                snippet: {
                    title: video.title,
                    thumbnails: {
                        medium: { url: getYouTubeThumbnail(video.videoId) }
                    }
                }
            };
            onVideoSelect(videoForPlayer);
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
                        className="flex flex-row items-center bg-[#23232a] rounded-lg p-3 shadow hover:bg-[#292933] transition-colors cursor-pointer"
                        onClick={() => handlePlayVideo(video)}
                    >
                        {/* Miniature YouTube */}
                        <img
                            src={getYouTubeThumbnail(video.videoId)}
                            alt={video.title || video.videoId}
                            className="w-[120px] h-[90px] rounded mr-4 object-cover bg-black"
                        />
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="text-white text-base font-medium truncate mb-2">
                                {video.title || video.videoId}
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
                ))}
                {playlist.length === 0 && (
                    <div className="text-gray-400 text-center py-4 min-w-[200px]">
                        Aucune vidéo dans la playlist
                    </div>
                )}
            </div>
        </div>
    );
};

export default Playlist; 