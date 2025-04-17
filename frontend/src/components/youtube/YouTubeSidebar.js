import React from "react";

function YouTubeSidebar() {
    const icons = ["📺", "✋", "🖐️", "BRB", "🐝", "😎", "😏", "😴"];

    return (
        <div className="w-16 bg-[#1c1c1e] flex flex-col items-center py-4 space-y-4">
            {icons.map((icon, idx) => (
                <button
                    key={idx}
                    className="text-white w-10 h-10 bg-[#2c2c2e] flex items-center justify-center rounded-lg text-lg hover:bg-yellow-600"
                >
                    {icon}
                </button>
            ))}
        </div>
    );
}

export default YouTubeSidebar;
