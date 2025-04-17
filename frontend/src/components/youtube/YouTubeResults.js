import React from "react";

function YouTubeResults({ results, onSelect }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {results.map((video) => (
                <div
                    key={video.id.videoId}
                    onClick={() => onSelect(video.id.videoId)}
                    className="cursor-pointer bg-[#2c2c2e] rounded-lg overflow-hidden text-white shadow-md hover:shadow-xl transition"
                >
                    <img
                        src={video.snippet.thumbnails.medium.url}
                        alt={video.snippet.title}
                        className="w-full h-48 object-cover"
                    />
                    <div className="p-3 text-sm font-medium">
                        {video.snippet.title}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default YouTubeResults;
