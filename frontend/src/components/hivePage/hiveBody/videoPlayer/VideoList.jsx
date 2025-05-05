import React from "react";
import VideoItem from "./VideoItem";

const VideoList = ({ videos, onVideoSelect, roomId, currentUserId, ownerId, users }) => {
    console.log('VideoList received videos:', videos);

    // Vérifier les permissions vidéo
    const hasVideoPermission = () => {
        if (currentUserId === ownerId) return true;
        const currentUser = users.find(user =>
            user.userId === currentUserId ||
            user._id === currentUserId
        );
        return currentUser?.videoControl || false;
    };

    if (!videos || videos.length === 0) {
        return (
            <div className="flex justify-center items-center h-full text-gray-400">
                No videos found. Try searching for something else.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 h-full overflow-y-auto">
            {videos.map((video) => (
                <VideoItem
                    key={video.id.videoId}
                    video={video}
                    onVideoSelect={hasVideoPermission() ? onVideoSelect : null}
                    roomId={roomId}
                    hasPermission={hasVideoPermission()}
                />
            ))}
        </div>
    );
};

export default VideoList;