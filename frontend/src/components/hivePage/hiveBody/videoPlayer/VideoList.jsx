import React, { useState, useEffect } from "react";
import VideoItem from "./VideoItem";
import socket from '../../../../components/socket';

const VideoList = ({ videos, onVideoSelect, roomId, currentUserId, ownerId, users }) => {
    const [videoPermission, setVideoPermission] = useState(false);

    // Initial permission check
    useEffect(() => {
        if (!users || users.length === 0 || !currentUserId) return;
        const currentUser = users.find(user => user.userId === currentUserId || user._id === currentUserId);
        if (currentUser) {
            setVideoPermission(currentUser.videoControl);
        }
    }, [users, currentUserId]);

    // Listen for real-time permission updates
    useEffect(() => {
        const handleVideoPermissionUpdate = ({ userId, videoControl }) => {
            if (userId === currentUserId) {
                setVideoPermission(videoControl);
            }
        };

        socket.on("video_permission_updated", handleVideoPermissionUpdate);
        return () => socket.off("video_permission_updated", handleVideoPermissionUpdate);
    }, [currentUserId]);

    // Check video permissions
    const hasVideoPermission = () => {
        if (currentUserId === ownerId) return true;
        return videoPermission;
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