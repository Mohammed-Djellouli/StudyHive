import React from "react";

function YouTubeChat() {
    return (
        <div className="h-1/2 bg-[#2c2c2e] p-3 rounded-lg overflow-y-auto">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span>🐝</span>
                    <p>Hello world</p>
                </div>
                <div className="flex items-center gap-2">
                    <span>🐝</span>
                    <p>Nice world</p>
                </div>
                <div className="flex justify-end items-center gap-2">
                    <p>I’m the one typing</p>
                    <span>🐝</span>
                </div>
            </div>
        </div>
    );
}

export default YouTubeChat;
