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

                const checkAndUpdatePlayer = () => {
                    const player = playerRef.current;
                    if (!player || typeof player.getPlayerState !== "function") {
                        return;
                    }

                    try {
                        const now = Date.now();
                        const elapsed = (now - lastUpdate) / 1000;
                        const adjustedTime = isPlaying ? time + elapsed : time;

                        if (typeof player.getCurrentTime === "function") {
                            const currentTime = player.getCurrentTime();
                            const playerState = player.getPlayerState();

                            if (Math.abs(currentTime - adjustedTime) > 0.5) {
                                player.seekTo(adjustedTime, true);
                            }

                            if (isPlaying && playerState !== 1) {
                                player.playVideo().catch(error => {
                                    console.warn("Lecture automatique impossible:", error);
                                    setNeedsManualPlay(true);
                                });
                            } else if (!isPlaying && playerState === 1) {
                                player.pauseVideo();
                            }
                        }
                    } catch (error) {
                        console.warn("Player pas encore prêt:", error);
                        setTimeout(checkAndUpdatePlayer, 500);
                    }
                };

                setTimeout(checkAndUpdatePlayer, 300);

            } catch (error) {
                console.warn("Erreur de synchronisation:", error);
            }
        };

        socket.on("syncVideo", handleSyncVideo);

        return () => {
            socket.off("syncVideo", handleSyncVideo);
        };
    }, [roomId]);

    useEffect(() => {
        const handleCurrentVideoState = ({ videoId, time, isPlaying, lastUpdate }) => {
            if (!videoId) return;

            setVideoId(videoId);

            const initializeVideo = () => {
                const player = playerRef.current;
                if (!player || typeof player.seekTo !== "function") {
                    setTimeout(initializeVideo, 500);
                    return;
                }

                try {
                    const now = Date.now();
                    const elapsed = (now - lastUpdate) / 1000;
                    const adjustedTime = time + elapsed;

                    player.seekTo(adjustedTime, true);

                    if (isPlaying) {
                        player.playVideo().catch(() => {
                            setNeedsManualPlay(true);
                        });
                    }
                } catch (error) {
                    console.warn("Erreur d'initialisation:", error);
                    setNeedsManualPlay(true);
                }
            };

            setTimeout(initializeVideo, 1000);
        };

        socket.on("currentVideoState", handleCurrentVideoState);

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
            if (!roomId) {
                console.error("roomId is undefined in handleVideoSelect");
                return;
            }

            const newVideoId = video?.id?.videoId;
            if (!newVideoId) return;

            const currentTime = playerRef.current?.getCurrentTime?.() || 0;

            socket.emit("videoChanged", {
                roomId,
                videoId: newVideoId,
                time: currentTime,
            });

            setVideoId(newVideoId);
        } catch (error) {
            console.error("Error in handleVideoSelect:", error);
        }
    };

    const onPlayerReady = (event) => {
        try {
            if (!roomId) return;

            playerRef.current = event.target;

            setTimeout(() => {
                socket.emit("requestVideoState", { roomId });
            }, 500);
        } catch (error) {
            console.warn("Erreur dans onPlayerReady:", error);
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