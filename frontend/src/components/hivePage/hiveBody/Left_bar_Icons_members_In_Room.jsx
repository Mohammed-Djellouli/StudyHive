import React, {useEffect, useState} from 'react';
import MemberInHive from "./MemberInHive";
import socket  from "../../socket";
function Left_bar_Icons_members_In_Room({ ownerPseudo, isQueenBeeMode, users: initialUsers }) {

    const [users, setUsers] = useState(initialUsers);


    useEffect(() => {
        setUsers(initialUsers);
    },[initialUsers]);


    useEffect(() => {
        const userId = localStorage.getItem("userId")||socket.id;
        const userPseudo = localStorage.getItem("userPseudo");

        if (userId && userPseudo) {
            console.log(" LeftBar emit join_hive_room");
            socket.emit("join_hive_room", {
                roomId: window.location.pathname.split("/").pop(), // récupère idRoom depuis l'URL
                user: {
                    userId,
                    pseudo: userPseudo,
                    _id: userId,
                    socketId: socket.id
                }
            });
        }
    }, []);


    useEffect(() => {
        const handleUserJoined = (newUser) => {
            setUsers(prevUsers => {
                if (prevUsers.find(u => u.userId === newUser.userId)) return prevUsers;
                return [...prevUsers, {
                    ...newUser,
                    _id: newUser.userId
                }];
            });
        };

        const handleUserLeft = (socketIdLeft) => {
            setUsers(prevUsers => prevUsers.filter(u => u.socketId !== socketIdLeft));
        };

        socket.on("user_joined", handleUserJoined);
        socket.on("user_left", handleUserLeft);

        return () => {
            socket.off("user_joined", handleUserJoined);
            socket.off("user_left", handleUserLeft);
        };
    }, []);

    console.log("Props reçues par LeftBar :", ownerPseudo, isQueenBeeMode);
    return (
        <div className="fixed bottom-[11px] left-0 w-[50px] h-[55%] p-[2px] flex flex-col justify-end bg-[#ffffff08] rounded-[10px] z-10">
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
                {users
                    .filter((user) => user.pseudo !== ownerPseudo)
                    .map((user) => (
                        <MemberInHive key={user._id || user.userId} pseudo={user.pseudo} micControl={user.micControl} />
                    ))}





                {/* Three dots */}
                {/*
                <li>
                    <img className="bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center" src="/assets/Trois_Point_icon.png" alt="Trois_Point" />
                </li>
                */}
                </ul>
        </div>
    );
}

export default Left_bar_Icons_members_In_Room;
