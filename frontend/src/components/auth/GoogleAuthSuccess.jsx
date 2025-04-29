import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";

const GoogleAuthSuccess = () => {
    const navigate = useNavigate();
    const [hasProcessed, setHasProcessed] = useState(false);
    console.log(" Composant GoogleAuthSuccess chargé !");

    useEffect(() => {
        console.log(" useEffect lancé");
        if (hasProcessed) return;

        const currentUrl = window.location.href;
        console.log(" Current full URL:", currentUrl);

        const urlParams = new URLSearchParams(window.location.search);

        const pseudo = urlParams.get("pseudo");
        const userId = urlParams.get("userId");
        const token = urlParams.get("token");

        console.log("🔐 Token from URL:", token);
        console.log("🔐 pseudo from URL:", pseudo);
        console.log("🔐 userId from URL:", userId);

        if (token && pseudo && userId) {
            localStorage.setItem("token", token);

            alert("Connexion avec Google réussie ");

            localStorage.setItem("userPseudo", pseudo);
            localStorage.setItem("userId", userId);
            setHasProcessed(true);
            navigate("/");
             // petit délai pour éviter race condition
        } else {
            setHasProcessed(true);
            navigate("/login");
        }
    }, [navigate, hasProcessed]);

    return null;
};

export default GoogleAuthSuccess;
