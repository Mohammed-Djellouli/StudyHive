import React, { useState } from "react";
import YouTubeSearchBar from "./YouTubeSearchBar";
import YouTubePlayer from "./YouTubePlayer";
import YouTubeResults from "./YouTubeResults";
import YouTubeSidebar from "./YouTubeSidebar";
import YouTubeNotes from "./YouTubeNotes";
import YouTubeChat from "./YouTubeChat";

export default function YouTubeModule() {
    const [results, setResults] = useState([]);
    const [selectedVideoId, setSelectedVideoId] = useState(null);

    const searchYouTube = async (query) => {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${query}&key=${process.env.REACT_APP_YOUTUBE_API_KEY}`
        );
        const data = await res.json();
        setResults(data.items);
    };

    return (
        <div className="bg-[#121212] text-white h-screen w-screen overflow-hidden flex flex-col">
            <div className="p-4 flex justify-center border-b border-gray-700">
                <YouTubeSearchBar onSearch={searchYouTube} />
            </div>
            <div className="flex flex-1">
                <YouTubeSidebar />

                <div className="flex-1 p-4 flex flex-col">
                    <YouTubePlayer videoId={selectedVideoId} />
                    <YouTubeResults results={results} onSelect={setSelectedVideoId} />
                </div>

                <div className="w-[300px] bg-[#1c1c1e] p-4 space-y-4">
                    <YouTubeNotes />
                    <YouTubeChat />
                </div>
            </div>
        </div>
    );
}
