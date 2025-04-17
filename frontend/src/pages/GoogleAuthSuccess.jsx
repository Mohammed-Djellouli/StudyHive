import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GoogleAuthSuccess = () => {
    const navigate = useNavigate();

    useEffect(() => {
        console.log(" GoogleAuthSuccess mounted");

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        console.log("🔎 Token from URL:", token);

        if (token) {
            localStorage.setItem("token", token);
            alert("Connexion avec Google réussie ");
            navigate("/dashboard");
        } else {
            alert("Erreur: Token non trouvé dans l'URL !");
            navigate("/login");
        }
    }, [navigate]);


    return null;
};

export default GoogleAuthSuccess;
