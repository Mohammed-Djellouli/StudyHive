import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../socket"; // importe bien socket

function JoinHive() {
    const { idRoom } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        console.log(" JoinHive useEffect triggered");
        const userId = localStorage.getItem("userId");
        const userPseudo = localStorage.getItem("userPseudo");

        if (!userId) {
            console.log(" No userId in localStorage, redirect to login");
            alert("Vous devez être connecté pour rejoindre une ruche.");
            navigate("/LoginPage");
            return;
        }

        console.log(" userId found:", userId);
        console.log(" Fetching join hive...");

        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/hive/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, idRoom }),
        })
            .then((res) => {
                console.log(" Server response status:", res.status);
                return res.json();
            })
            .then((data) => {
                console.log("Server data:", data);

                if (data.message === "User joined successfully" || data.userPseudo) {
                    console.log(" Join successful, navigating to Hive page");
                    // Emit socket event
                    socket.emit("join_hive_room", {
                        roomId: idRoom,
                        user: {
                            userId,
                            pseudo: userPseudo,
                            _id: userId,
                            socketId: socket.id
                        }
                    });

                    navigate(`/hive/${idRoom}`);
                } else {
                    console.log(" Join failed:", data);
                    alert("Erreur lors de la connexion à la ruche");
                }
            })
            .catch((error) => {
                console.error(" Fetch error:", error);
                alert("Erreur réseau pour rejoindre la ruche");
            });
    }, [idRoom, navigate]);

    return (
        <div className="text-white p-6">
            Connexion à la ruche...
        </div>
    );
}

export default JoinHive;
