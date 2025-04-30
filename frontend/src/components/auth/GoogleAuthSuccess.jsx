import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";

const GoogleAuthSuccess = () => {
    const navigate = useNavigate();
    const [hasProcessed, setHasProcessed] = useState(false);
    console.log(" Composant GoogleAuthSuccess chargé !");

    useEffect(() => {
        if (hasProcessed) return;

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const pseudo = urlParams.get("pseudo");

        if (token && pseudo) {
            localStorage.setItem("token", token);
            localStorage.setItem("userPseudo", pseudo);
            alert("Connexion avec Google réussie ");
            setHasProcessed(true);
            setTimeout(() => {
                navigate("/");
            }, 500);
        } else {
            alert("Erreur: informations manquantes !");
            setHasProcessed(true);
            navigate("/login");
        }
    }, [navigate, hasProcessed]);


    return null;
};

export default GoogleAuthSuccess;
