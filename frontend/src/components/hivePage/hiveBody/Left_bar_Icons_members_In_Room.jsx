import React, { useEffect } from 'react';
import MemberInHive from "./MemberInHive";
import socket from "../../socket";

function Left_bar_Icons_members_In_Room({ ownerPseudo, isQueenBeeMode, users, ownerId }) {
    useEffect(() => {
        const userId = localStorage.getItem("userId") || socket.id;
        const userPseudo = localStorage.getItem("userPseudo");

        if (userId && userPseudo) {
            socket.emit("join_hive_room", {
                roomId: window.location.pathname.split("/").pop(),
                user: {
                    userId,
                    pseudo: userPseudo,
                    _id: userId,
                    socketId: socket.id
                }
            });
        }
    }, []);

    return (
        <div className="fixed top-[410px] left-0 w-[50px] p-[2px] flex flex-col bg-[#ffffff08] rounded-[10px] z-10 ">
            <ul className="flex flex-col gap-2 items-center m-0 p-0 list-none">

                {ownerId && (
                    <li className="relative group bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center">
                        <img
                            src={isQueenBeeMode ? "/assets/queen-bee.png" : "/assets/SoloBee2.png"}
                            alt={isQueenBeeMode ? "Queen Bee" : "Bee"}
                            className="w-[28px] h-[28px]"
                        />
                        <span className="absolute left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 transition-opacity duration-200">
              {users.find(u => u.userId === ownerId)?.pseudo || "Queen Bee"}
            </span>
                    </li>
                )}

                {users
                    .filter((user) => user.userId !== ownerId)
                    .map((user) => (
                        <MemberInHive
                            key={user._id || user.userId}
                            pseudo={user.pseudo}
                            micControl={user.micControl}
                            screenShareControl={user.screenShareControl}
                            videoControl={user.videoControl}
                            isOwner={user.userId === ownerId}
                            isQueenBeeMode={isQueenBeeMode}
                            currentUserId={localStorage.getItem("userId")}
                            ownerId={ownerId}
                            userId={user.userId}
                        />
                    ))}
            </ul>
        </div>
    );
}

export default Left_bar_Icons_members_In_Room;
