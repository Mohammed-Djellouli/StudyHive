import React from "react";
import VideoItem from "./VideoItem";

const VideoList = ({ videos, onVideoSelect }) => {
    console.log('VideoList received videos:', videos);

    if (!videos || videos.length === 0) {
        return (
            <div className="flex justify-center items-center h-full text-gray-400">
                No videos found. Try searching for something else.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {videos.map((video) => (
                <VideoItem 
                    key={video.id.videoId} 
                    video={video} 
                    onVideoSelect={onVideoSelect}
                />
            ))}
        </div>
    );
};

export default VideoList; 