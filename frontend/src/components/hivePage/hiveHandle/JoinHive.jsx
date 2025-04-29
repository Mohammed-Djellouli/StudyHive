import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../../socket";

function JoinHive() {
    const { idRoom } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        console.log("JoinHive useEffect triggered");

        const joinHiveRequest = async () => {
            let userId = localStorage.getItem("userId");
            let userPseudo = localStorage.getItem("userPseudo");

            if (!userId || !userPseudo) {
                console.log("No user found, creating guest...");
                let generatedNumber = Math.floor(1000 + Math.random() * 9000)
                userId = `${socket.id}-${generatedNumber}`;
                userPseudo = `Bee-${generatedNumber}`;
                localStorage.setItem("userId", userId);
                localStorage.setItem("userPseudo", userPseudo);
            }

            console.log("Final UserId for JoinHive:", userId);

            try {
                const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/hive/join`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId,userPseudo, idRoom }),
                });

                const data = await response.json();
                console.log("Server data:", data);

                if (response.ok && (data.message === "User joined successfully" || userPseudo)) {
                    console.log("Join successful!");

                    // **seulement maintenant après backend ok**, on émet socket.io
                    socket.emit("join_hive_room", {
                           roomId: idRoom,
                           userId: userId,
                    });

                    navigate(`/hive/${idRoom}`);
                } else {
                    console.error("Join failed:", data);
                    alert("Erreur lors de la connexion à la ruche (serveur)");
                }

            } catch (error) {
                console.error("Fetch error:", error);
                alert("Erreur réseau ou serveur pour rejoindre la ruche");
            }
        };

        // 🛡️ attendre que le socket soit connecté
        if (socket.connected) {
            joinHiveRequest();
        } else {
            socket.once("connect", joinHiveRequest);
        }

        // Nettoyage
        return () => {
            socket.off("connect", joinHiveRequest);
        };

    }, [idRoom, navigate]);

    return (
        <div className="text-white p-6">
            Connexion à la ruche...
        </div>
    );
}

export default JoinHive;
