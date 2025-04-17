import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";

function YouTubeSearchBar({ onSearch }) {
    const [query, setQuery] = useState("");

    const handleSearch = () => {
        if (query.trim()) onSearch(query);
    };

    return (
        <div className="flex items-center bg-[#1c1c1e] rounded-lg p-2 w-full max-w-2xl">
            <div className="bg-red-600 px-3 py-2 rounded-l-lg flex items-center">
                <img src="/youtube-icon.png" alt="YouTube" className="w-5 h-5" />
            </div>
            <input
                type="text"
                placeholder="Bee lecture"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent text-white flex-1 px-4 py-2 outline-none"
            />
            <button
                onClick={handleSearch}
                className="bg-[#2c2c2e] p-3 rounded-r-lg text-white hover:bg-[#3c3c3f]"
            >
                <FaSearch />
            </button>
        </div>
    );
}

export default YouTubeSearchBar;
