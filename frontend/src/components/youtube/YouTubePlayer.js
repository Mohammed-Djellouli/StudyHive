import React from "react";

function YouTubePlayer({ videoId }) {
    if (!videoId) return null;

    return (
        <div className="w-full max-w-5xl mx-auto mt-4 shadow-lg rounded-xl overflow-hidden">
            <iframe
                width="100%"
                height="500"
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        </div>
    );
}

export default YouTubePlayer;
