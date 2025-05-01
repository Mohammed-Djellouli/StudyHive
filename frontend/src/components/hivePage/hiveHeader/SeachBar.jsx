import React, { useState } from 'react';

function SearchBar({ onSearch, isQueenBeeMode, currentUserId, ownerId }) {
    const [term, setTerm] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (term.trim()) {
            onSearch(term);
        }
    };

    // Vérifie si l'utilisateur a la permission d'utiliser la recherche
    const hasSearchPermission = !isQueenBeeMode || (isQueenBeeMode && currentUserId === ownerId);

    if (!hasSearchPermission) {
        return null; // Ne pas afficher la barre de recherche si pas de permission
    }

    return (
        <div className="w-full flex justify-center fixed top-0 left-0 pt-4 z-20">
            <form onSubmit={handleSubmit} className="w-[520px] h-[50px] rounded-[10px] flex items-center justify-center p-[2px]">
                <div className="flex items-center w-full bg-[#1a1a1a] rounded-[8px] p-[6px] gap-2">
                    <img src="/assets/youtube-icon.png" alt="Youtube" className="w-[40px] h-[40px]" />
                    <input
                        type="text"
                        placeholder="Bee lecture"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        className="bg-[#0f0f0f] text-white px-3 py-2 rounded-[4px] flex-1 outline-none"
                    />
                    <button type="submit" className="bg-[#0f0f0f] p-2 rounded-[8px]">
                        <img src="/assets/Search-icon.png" alt="Search" className="w-[24px] h-[24px]" />
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SearchBar;
