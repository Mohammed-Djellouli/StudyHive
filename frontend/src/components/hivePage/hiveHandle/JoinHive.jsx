import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function JoinHive() {
    const { idRoom } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            alert("Vous devez être connecté pour rejoindre une ruche.");
            navigate("/LoginPage");
            return;
        }

        fetch(`http://localhost:5001/api/hive/join/${idRoom}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.userPseudo) {
                    navigate(`/hive/${idRoom}`);
                } else {
                    alert("Erreur lors de la connexion à la ruche");
                }
            });
    }, [idRoom, navigate]);

    return <div className="text-white p-6">Connexion à la ruche...</div>;
}

export default JoinHive;
