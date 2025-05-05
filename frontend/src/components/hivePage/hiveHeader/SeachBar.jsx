import React, { useState, useEffect } from 'react';
import socket from '../../../components/socket';

function SearchBar({ onSearch, currentUserId, ownerId, users }) {
    const [term, setTerm] = useState('');
    const [hasVideoPermission, setHasVideoPermission] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (term.trim() && (currentUserId === ownerId || hasVideoPermission)) {
            onSearch(term);
        }
    };

    // Vérifier la permission vidéo basée sur users
    useEffect(() => {
        if (!users || users.length === 0 || !currentUserId) return;

        const currentUser = users.find(user => user.userId === currentUserId || user._id === currentUserId);
        if (currentUser) {
            setHasVideoPermission(currentUser.videoControl);
        }
    }, [users, currentUserId]);

    // Écouter les mises à jour des permissions vidéo
    useEffect(() => {
        const handleVideoPermissionUpdate = ({ userId, videoControl }) => {
            if (userId === currentUserId) {
                setHasVideoPermission(videoControl);
            }
        };

        socket.on("video_permission_updated", handleVideoPermissionUpdate);
        return () => socket.off("video_permission_updated", handleVideoPermissionUpdate);
    }, [currentUserId]);

    // Vérifie si l'utilisateur a la permission d'utiliser la recherche
    const canSearch = currentUserId === ownerId || hasVideoPermission;

    return (
        <div className="w-full">
            <form
                onSubmit={handleSubmit}
                className="w-full h-[50px] flex items-center justify-center gap-4"
            >
                <div className={`flex items-center w-full max-w-[700px] bg-[#1a1a1a] rounded-[8px] p-[6px] gap-2 ${
                    !canSearch ? 'opacity-50' : ''
                }`}>
                    <img
                        src="/assets/youtube-icon.png"
                        alt="Youtube"
                        className="w-[35px] h-[35px] md:w-[40px] md:h-[40px]"
                    />
                    <input
                        type="text"
                        placeholder={
                            canSearch
                                ? 'Bee lecture'
                                : 'Seul le créateur peut rechercher en mode Queen Bee'
                        }
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        className="bg-[#0f0f0f] text-white px-4 py-2 rounded-[4px] flex-1 outline-none text-sm md:text-base"
                        disabled={!canSearch}
                    />
                    <button
                        type="submit"
                        className={`bg-[#0f0f0f] p-2 rounded-[8px] ${
                            !canSearch ? 'cursor-not-allowed' : 'hover:bg-[#2a2a2a]'
                        }`}
                        disabled={!canSearch}
                    >
                        <img
                            src="/assets/Search-icon.png"
                            alt="Search"
                            className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]"
                        />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SearchBar;