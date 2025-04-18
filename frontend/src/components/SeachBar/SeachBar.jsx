import React from 'react';

function SearchBar() {
    return (

        <div className="w-full flex justify-center fixed top-0 left-0 pt-4 z-20">
            <div className="w-[520px] h-[50px]  rounded-[10px] flex items-center justify-center p-[2px]">
                {/* SearchBar */}
                <div className="flex items-center w-full bg-[#1a1a1a] rounded-[8px] p-[6px] gap-2">

                    <img src="/Assets/youtube-icon.png" alt="Youtube" className="w-[40px] h-[40px]" />

                    <input
                        type="text"
                        placeholder="Bee lecture"
                        className="bg-[#0f0f0f] text-white px-3 py-2 rounded-[4px] flex-1 outline-none"
                    />

                    <button className="bg-[#0f0f0f] p-2 rounded-[8px]">
                        <img src="/Assets/Search-icon.png" alt="Search" className="w-[24px] h-[24px]" />
                    </button>

                </div>
            </div>
        </div>

    );
}

export default SearchBar;
