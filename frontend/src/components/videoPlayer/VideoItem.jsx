import React from "react";

const VideoItem = ({ video, onVideoSelect }) => {
    return (
        <div
            className="flex items-center cursor-pointer bg-[#1a1a1a] p-2 rounded hover:bg-[#2a2a2a]"
            onClick={() => onVideoSelect(video)}
        >
            <img
                src={video.snippet.thumbnails.medium.url}
                alt={video.snippet.title}
                className="w-[120px] h-[80px] rounded mr-4"
            />
            <div className="text-white text-sm font-medium">{video.snippet.title}</div>
        </div>
    );
};

export default VideoItem; 