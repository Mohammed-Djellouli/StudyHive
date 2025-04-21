import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";

const GoogleAuthSuccess = () => {
    const navigate = useNavigate();
    const [hasProcessed, setHasProcessed] = useState(false);
    console.log("🧩 Composant GoogleAuthSuccess chargé !");

    useEffect(() => {
        console.log("🎯 useEffect lancé");
        if (hasProcessed) return; // ⛔ si déjà fait, on ne refait rien

        const currentUrl = window.location.href;
        console.log("🔎 Current full URL:", currentUrl);

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        console.log("🔐 Token from URL:", token);

        if (token) {
            localStorage.setItem("token", token);
            alert("Connexion avec Google réussie ✅");
            setHasProcessed(true);
            setTimeout(() => {
                navigate("/");
            }, 500); // petit délai pour éviter race condition
        } else {
            alert("Erreur: Token non trouvé dans l'URL !");
            setHasProcessed(true);
            navigate("/login");
        }
    }, [navigate, hasProcessed]);

    return null;
};

export default GoogleAuthSuccess;
