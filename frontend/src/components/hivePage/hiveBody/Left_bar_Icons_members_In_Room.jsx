import React from 'react';
import MemberInHive from "./MemberInHive";
function Left_bar_Icons_members_In_Room({ ownerPseudo, isQueenBeeMode, users }) {
    console.log("Props reçues par LeftBar :", ownerPseudo, isQueenBeeMode);
    return (
        <div className="fixed bottom-[11px] left-0 w-[50px] h-[55%] p-[2px] flex flex-col justify-end bg-[#ffffff08] rounded-[10px] z-10">
            <ul className="flex flex-col items-center justify-start overflow-y-auto h-full max-h-[90%] scrollbar-thin scrollbar-thumb-yellow-500" />
            <ul className="flex flex-col items-center h-full m-0 p-0 list-none">

                {ownerPseudo && (
                    <li className="relative group bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center">
                        <img
                            src={isQueenBeeMode ? "/assets/queen-bee.png" : "/assets/SoloBee2.png"}
                            alt={isQueenBeeMode ? "Queen Bee" : "Bee"}
                            className="w-[28px] h-[28px]"
                        />
                        <span className="absolute left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 transition-opacity duration-200">
                            {ownerPseudo}
                        </span>
                    </li>
                )}

                {/* Bees */}
                {users.map((user) => (
                    <MemberInHive key={user._id} pseudo={user.pseudo} />
                    ))
                }
                {/* Three dots */}
                <li>
                    <img className="bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center" src="/assets/Trois_Point_icon.png" alt="Trois_Point" />
                </li>
                </ul>
        </div>
    );
}

export default Left_bar_Icons_members_In_Room;
