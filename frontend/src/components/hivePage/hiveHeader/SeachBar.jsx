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
        <div className="w-full flex justify-center fixed top-0 left-0 pt-4 z-20">
            <form onSubmit={handleSubmit} className="w-[520px] h-[50px] rounded-[10px] flex items-center justify-center p-[2px]">
                <div className={`flex items-center w-full bg-[#1a1a1a] rounded-[8px] p-[6px] gap-2 ${!canSearch ? 'opacity-50' : ''}`}>
                    <img src="/assets/youtube-icon.png" alt="Youtube" className="w-[40px] h-[40px]" />
                    <input
                        type="text"
                        placeholder={canSearch ? "Bee lecture" : "Seul le créateur peut rechercher en mode Queen Bee"}
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        className="bg-[#0f0f0f] text-white px-3 py-2 rounded-[4px] flex-1 outline-none"
                        disabled={!canSearch}
                    />
                    <button 
                        type="submit" 
                        className={`bg-[#0f0f0f] p-2 rounded-[8px] ${!canSearch ? 'cursor-not-allowed' : 'hover:bg-[#2a2a2a]'}`}
                        disabled={!canSearch}
                    >
                        <img src="/assets/Search-icon.png" alt="Search" className="w-[24px] h-[24px]" />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SearchBar;
