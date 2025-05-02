import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GithubAuthSuccess = () => {
    const navigate = useNavigate();
    const [hasProcessed, setHasProcessed] = useState(false);
    console.log(" Composant GithubAuthSuccess chargé !");

    useEffect(() => {
        console.log(" useEffect lancé");
        if (hasProcessed) return;

        const currentUrl = window.location.href;
        console.log(" Current full URL:", currentUrl);

        const urlParams = new URLSearchParams(window.location.search);

        const pseudo = urlParams.get("pseudo");
        const userId = urlParams.get("userId");
        const token = urlParams.get("token");

        console.log(" Token from URL:", token);
        console.log(" Pseudo from URL:", pseudo);
        console.log(" UserId from URL:", userId);

        if (token && pseudo && userId) {
            localStorage.setItem("token", token);
            localStorage.setItem("userPseudo", pseudo);
            localStorage.setItem("userId", userId);

            alert("Connexion avec GitHub réussie ");
            setHasProcessed(true);
            setTimeout(() => {
                navigate("/");
            }, 500);
        } else {
            alert("Erreur lors de la connexion GitHub");
            setHasProcessed(true);
            navigate("/login");
        }
    }, [navigate, hasProcessed]);

    return null;
};

export default GithubAuthSuccess;
