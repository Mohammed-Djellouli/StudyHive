import React from "react";

function YouTubeNotes() {
    return (
        <div className="h-1/2 bg-[#2c2c2e] p-3 rounded-lg">
            <p className="text-white font-semibold mb-2">les notes sont ecrites ici</p>
            <textarea
                className="bg-transparent text-white w-full h-full resize-none outline-none"
                placeholder="Écris tes notes ici..."
            />
        </div>
    );
}

export default YouTubeNotes;
