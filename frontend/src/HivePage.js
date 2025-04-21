import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import YouTube from "react-youtube";
import socket from "./components/socket";
import Big_Logo_At_Left from "./components/hivePage/hiveHeader/Big_Logo_At_Left";
import Left_bar_Icons_members_In_Room from "./components/hivePage/hiveBody/Left_bar_Icons_members_In_Room";
import SearchBar from "./components/hivePage/hiveHeader/SeachBar";
import LeftBarTools from "./components/hivePage/hiveBody/LeftBarTools";
import VideoList from "./components/videoPlayer/VideoList";
import HiveTimerBanner from "./components/hivePage/hiveHandle/HiveTimerBanner";
import ChatBox from "./components/Communication/Chat/chatBox";
import VoiceChat from "./components/Communication/MicChat/VoiceChat";

import "./App.css";

function HivePage() {
    const { idRoom } = useParams();
    const [ownerPseudo, setOwnerPseudo] = useState(null);
    const [isQueenBeeMode, setIsQueenBeeMode] = useState(false);
    const [timerEndsAt, setTimerEndsAt] = useState(null);
    const [ownerId, setOwnerId] = useState(null);
    const [users, setUsers] = useState([]);
    const [videos, setVideos] = useState([]);
    const [videoId, setVideoId] = useState(null);
    const [needsManualPlay, setNeedsManualPlay] = useState(false);
    const playerRef = useRef();

    useEffect(() => {
        window.onerror = function (message, source, lineno, colno, error) {
            console.error("Global JS Error:", { message, source, lineno, colno, error });
        };
    }, []);

    useEffect(() => {
        fetch(`http://localhost:5001/api/hive/${idRoom}`)
            .then(res => res.json())
            .then(data => {
                console.log("ROOM :", data);
                setOwnerPseudo(data.ownerPseudo);
                setIsQueenBeeMode(data.isQueenBeeMode);
                setTimerEndsAt(data.timerEndsAt);
                setUsers(data.users);
                setOwnerId(data.idOwner);
            });

        socket.emit("joinRoom", { roomId: idRoom, userName: localStorage.getItem("userPseudo") || "Anonymous" });

        socket.on("syncVideo", ({ videoId, time, isPlaying, lastUpdate }) => {
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
                        const result = player.playVideo();
                        if (result instanceof Promise) {
                            result.catch(() => setNeedsManualPlay(true));
                        }
                    } else if (!isPlaying && playerState === 1) {
                        player.pauseVideo();
                    }

                    clearInterval(interval);
                }
            }, 300);
        });

        return () => {
            socket.off("syncVideo");
        };
    }, [idRoom]);

    const handleSearch = async (searchTerm) => {
        const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
        console.log('Search term:', searchTerm);
        console.log('API Key:', apiKey);

        try {
            console.log('Making API request...');
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(searchTerm)}&key=${apiKey}&type=video`
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
        const newVideoId = video?.id?.videoId;
        if (!newVideoId) return;

        const currentTime = playerRef.current?.getCurrentTime?.() || 0;

        socket.emit("videoChanged", {
            roomId: idRoom,
            videoId: newVideoId,
            time: currentTime,
        });

        setVideoId(newVideoId);
    };

    const onPlayerReady = (event) => {
        playerRef.current = event.target;
    };

    const onPlayerStateChange = (event) => {
        const state = event.data;
        const currentTime = event.target.getCurrentTime();
        const isPlaying = state === 1;

        if (state === 1 || state === 2) {
            socket.emit("syncVideo", {
                roomId: idRoom,
                videoId,
                time: currentTime,
                isPlaying,
                lastUpdate: Date.now(),
            });
        }
    };

    const handleSeek = () => {
        if (!playerRef.current) return;

        const currentTime = playerRef.current.getCurrentTime();
        const isPlaying = playerRef.current.getPlayerState() === 1;

        socket.emit("syncVideo", {
            roomId: idRoom,
            videoId,
            time: currentTime,
            isPlaying,
            lastUpdate: Date.now(),
        });
    };

    const handleManualPlay = () => {
        playerRef.current?.playVideo();
        setNeedsManualPlay(false);
    };

    const opts = {
        width: "90%",
        height: "90%",
        playerVars: { autoplay: 1 }
    };

    const location = useLocation();

    console.log("State reçu dans HivePage :", ownerPseudo, isQueenBeeMode);
    return (
        <div className="bg-center bg-cover bg-fixed bg-no-repeat min-h-screen text-white bg-[#1a1a1a]"
            style={{ backgroundImage: "url('/assets/bg.png')", backgroundSize: "270%" }}>
            <Big_Logo_At_Left />
            <Left_bar_Icons_members_In_Room ownerPseudo={ownerPseudo} isQueenBeeMode={isQueenBeeMode} users={users.filter((user) => user._id !== ownerId)} />
            
            <SearchBar onSearch={handleSearch} />

            <div className="absolute left-[80px] top-[140px] w-[850px] h-[480px] overflow-y-auto rounded-lg bg-[#1a1a1a] p-4 z-10">
                {videoId ? (
                    <div onMouseUp={handleSeek} className="w-[913px] h-[516px] bg-black/40 shadow-lg rounded-lg overflow-hidden">
                        <YouTube
                            videoId={videoId}
                            opts={opts}
                            onReady={onPlayerReady}
                            onStateChange={onPlayerStateChange}
                            className="w-full h-full"
                        />
                        {needsManualPlay && (
                            <div className="mt-4 text-center">
                                <button className="px-4 py-2 bg-yellow-400 text-black font-bold rounded shadow-md" onClick={handleManualPlay}>
                                    ▶️ Lancer la lecture
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <VideoList videos={videos} onVideoSelect={handleVideoSelect} />
                )}
            </div>

            <div className="fixed bottom-10 right-4 w-[90vw] max-w-[385px]">
                <ChatBox />
            </div>
            <div className="fixed bottom-3 right-80">
                <VoiceChat />
            </div>
            <HiveTimerBanner ownerPseudo={ownerPseudo} timerEndsAt={timerEndsAt} roomId={idRoom} />
            <LeftBarTools/>
        </div>
    );
}

export default HivePage;