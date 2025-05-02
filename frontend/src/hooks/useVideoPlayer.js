import { useState, useRef, useEffect } from 'react';
import socket from '../components/socket';

const useVideoPlayer = (roomId) => {
    const [videos, setVideos] = useState([]);
    const [videoId, setVideoId] = useState(null);
    const [needsManualPlay, setNeedsManualPlay] = useState(false);
    const playerRef = useRef();
    const [autoPlay, setAutoPlay] = useState(true);

    useEffect(() => {
        if (!roomId) {
            console.warn("roomId is not defined in useVideoPlayer");
            return;
        }

        const handleSyncVideo = ({ videoId, time, isPlaying, lastUpdate }) => {
            try {
                setVideoId(videoId);

                const interval = setInterval(() => {
                    const player = playerRef.current;
                    if (player && typeof player.getPlayerState === "function") {
                        const now = Date.now();
                        const elapsed = (now - lastUpdate) / 1000;
                        const adjustedTime = isPlaying ? time + elapsed : time;

                        const currentTime = player.getCurrentTime();
                        const playerState = player.getPlayerState();

                        if (Math.abs(currentTime - adjustedTime) > 0.5) {
                            player.seekTo(adjustedTime, true);
                        }

                        if (isPlaying && playerState !== 1) {
                            try {
                                player.playVideo();
                            } catch (error) {
                                console.error("Erreur lors de la lecture automatique:", error);
                                setNeedsManualPlay(true);
                            }
                        } else if (!isPlaying && playerState === 1) {
                            player.pauseVideo();
                        }

                        clearInterval(interval);
                    }
                }, 300);
            } catch (error) {
                console.error("Error in handleSyncVideo:", error);
            }
        };

        socket.on("syncVideo", handleSyncVideo);

        return () => {
            socket.off("syncVideo", handleSyncVideo);
        };
    }, [roomId]);

    useEffect(() => {
        socket.on("currentVideoState", ({ videoId, time, isPlaying, lastUpdate }) => {
            if (videoId && isPlaying && playerRef.current) {
                const now = Date.now();
                const elapsed = (now - lastUpdate) / 1000;
                const adjustedTime = time + elapsed;

                setVideoId(videoId);
                
                setTimeout(() => {
                    try {
                        playerRef.current.seekTo(adjustedTime, true);
                        if (isPlaying) {
                            playerRef.current.playVideo();
                        }
                    } catch (error) {
                        console.error("Erreur lors de la synchronisation initiale:", error);
                        setNeedsManualPlay(true);
                    }
                }, 1000);
            }
        });

        return () => {
            socket.off("currentVideoState");
        };
    }, [roomId]);

    const handleSearch = async (searchTerm) => {
        const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
        console.log('Search term:', searchTerm);
        console.log('API Key:', apiKey);

        try {
            console.log('Making API request...');
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(searchTerm)}&key=${apiKey}&type=video`
            );
            const data = await res.json();
            console.log('API Response:', data);
            
            if (data.error) {
                console.error('YouTube API Error:', data.error);
                return;
            }
            
            setVideos(data.items || []);
            setVideoId(null);
        } catch (error) {
            console.error("Error fetching videos:", error);
        }
    };

    const handleVideoSelect = (video) => {
        try {
            console.log("handleVideoSelect called with video:", video);
            if (!roomId) {
                console.error("roomId is undefined in handleVideoSelect");
                return;
            }

            const newVideoId = video?.id?.videoId;
            if (!newVideoId) {
                console.error("Invalid video ID:", video);
                return;
            }

            console.log("Setting new video ID:", newVideoId);
            setVideoId(newVideoId);

            const currentTime = playerRef.current?.getCurrentTime?.() || 0;
            console.log("Current time:", currentTime);

            socket.emit("videoChanged", {
                roomId,
                videoId: newVideoId,
                time: currentTime,
            });

        } catch (error) {
            console.error("Error in handleVideoSelect:", error);
        }
    };

    const onPlayerReady = (event) => {
        try {
            if (!roomId) {
                console.error("roomId is undefined in onPlayerReady");
                return;
            }

            playerRef.current = event.target;
            socket.emit("requestVideoState", { roomId });
        } catch (error) {
            console.error("Error in onPlayerReady:", error);
        }
    };

    const onPlayerStateChange = (event) => {
        try {
            if (!roomId) {
                console.error("roomId is undefined in onPlayerStateChange");
                return;
            }

            const state = event.data;
            const currentTime = event.target.getCurrentTime();
            const isPlaying = state === 1;

            if (state === 1 || state === 2) {
                socket.emit("syncVideo", {
                    roomId,
                    videoId,
                    time: currentTime,
                    isPlaying,
                    lastUpdate: Date.now(),
                });
            }
        } catch (error) {
            console.error("Error in onPlayerStateChange:", error);
        }
    };

    const handleSeek = () => {
        try {
            if (!roomId) {
                console.error("roomId is undefined in handleSeek");
                return;
            }

            if (!playerRef.current) return;

            const currentTime = playerRef.current.getCurrentTime();
            const isPlaying = playerRef.current.getPlayerState() === 1;

            socket.emit("syncVideo", {
                roomId,
                videoId,
                time: currentTime,
                isPlaying,
                lastUpdate: Date.now(),
            });
        } catch (error) {
            console.error("Error in handleSeek:", error);
        }
    };

    const handleManualPlay = () => {
        if (!roomId) {
            console.error("roomId is undefined in handleManualPlay");
            return;
        }

        playerRef.current?.playVideo();
        setNeedsManualPlay(false);
    };

    const playerOpts = {
        width: '100%',
        height: '100%',
        playerVars: { 
            autoplay: 1,
            playsinline: 1,
            mute: 0,
            controls: 1,
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            fs: 1
        }
    };

    return {
        videos,
        videoId,
        needsManualPlay,
        playerRef,
        playerOpts,
        handleSearch,
        handleVideoSelect,
        onPlayerReady,
        onPlayerStateChange,
        handleSeek,
        handleManualPlay
    };
};

export default useVideoPlayer; 