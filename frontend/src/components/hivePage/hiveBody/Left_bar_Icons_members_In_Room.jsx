import React, {useEffect, useState} from 'react';
import MemberInHive from "./MemberInHive";
import socket  from "../../socket";
function Left_bar_Icons_members_In_Room({ ownerPseudo, isQueenBeeMode, users: initialUsers,ownerId  }) {

    const [users, setUsers] = useState(initialUsers);
    console.log("This is the users in the Hive",users);

    useEffect(() => {
        setUsers(initialUsers);
    },[initialUsers]);





    useEffect(() => {
        const handleUserJoined = (newUser) => {
            setUsers(prevUsers => {
                const exists = prevUsers.some(u =>
                    (u.userId && newUser.userId && u.userId.toString() === newUser.userId.toString()) ||
                    (u.socketId && newUser.socketId && u.socketId === newUser.socketId)
                );

                if (exists) return prevUsers;

                return [...prevUsers, {
                    ...newUser,
                    _id: newUser.userId || newUser.socketId,
                    socketId: newUser.socketId,
                }];
            });
        };

        const handleUserLeft = (idLeft) => {
            console.log("User Left received id:", idLeft);

            setUsers(prevUsers => prevUsers.filter(user => {
                const matchUserId = user.userId?.toString() === idLeft.toString();
                const matchSocketId = user.socketId === idLeft;

                if (matchUserId || matchSocketId) {
                    console.log(`Removing user with ID: ${idLeft}`);
                }

                return !(matchUserId || matchSocketId);
            }));
        };

        const handleDisconnectUser = (idLeft) => {
            console.log("Disconnect_user received id:", idLeft);

            setUsers(prevUsers => prevUsers.filter(user => {
                const matchUserId = user.userId?.toString() === idLeft.toString();
                const matchSocketId = user.socketId === idLeft;

                if (matchUserId || matchSocketId) {
                    console.log(`Removing user with ID (disconnect): ${idLeft}`);
                }

                return !(matchUserId || matchSocketId);
            }));
        };

        const handleUpdateUsersList = (updatedUsers) => {
            console.log("Received updated users list:", updatedUsers);
            setUsers(updatedUsers);
        };

        // Listen to events
        socket.on("user_joined", handleUserJoined);
        socket.on("user_left", handleUserLeft);
        socket.on("disconnect_user", handleDisconnectUser);
        socket.on("update_users_list", handleUpdateUsersList);

        // Clean up listeners
        return () => {
            socket.off("user_joined", handleUserJoined);
            socket.off("user_left", handleUserLeft);
            socket.off("disconnect_user", handleDisconnectUser);
            socket.off("update_users_list", handleUpdateUsersList);
        };
    }, []);



    console.log("Props reçues par LeftBar :", ownerPseudo, isQueenBeeMode);
    return (
        <div className="fixed bottom-[11px] left-0 w-[50px] h-[55%] p-[2px] flex flex-col justify-end bg-[#ffffff08] rounded-[10px] z-10">
            <ul className="flex flex-col items-center h-full m-0 p-0 list-none">

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




                {/* Bees */}
                {users
                    .filter((user) => user.userId !== ownerId) // Pour ne pas afficher l'owner deux fois
                    .map((user) => (
                        <MemberInHive
                            key={user._id || user.userId}
                            pseudo={user.pseudo}
                            isOwner={user.userId === ownerId}
                            isQueenBeeMode={isQueenBeeMode}
                            currentUserId={localStorage.getItem("userId")} //
                            ownerId={ownerId}
                        />
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
