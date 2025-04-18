import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Erreur: Token non trouvé !");
            navigate("/login");
        } else {
            console.log(" Token trouvé :", token);

        }
    }, [navigate]);

    return (
        <div className="text-white min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <h1 className="text-4xl font-bold mb-6">Bienvenue dans ton espace 🐝</h1>
            <p className="text-lg">Tu es connecté avec succès !</p>
        </div>
    );
};

export default Dashboard;
