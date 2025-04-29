import React, { useEffect, useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import socket from "../../../socket";


function ButtonConnexInscrForCreationHivePage() {
    const [userPseudo,setUserPseudo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const pseudo = localStorage.getItem('userPseudo');
        if(pseudo){
            setUserPseudo(pseudo);
        }
    }, []);
    const handleLogout = () => {
        try {
            const pseudo = localStorage.getItem("userPseudo");




            if (pseudo && pseudo.startsWith("Bee-")) {
                console.log("this is the pseudo that we should delete , it Enters Here ------------->:  " + pseudo );
                console.log("Déconnexion d'un invité,.");
                localStorage.removeItem("userId");
                localStorage.removeItem("userPseudo");
                localStorage.removeItem("token");

            }

            console.log("Déconnexion d'un utilisateur normal,");
            localStorage.removeItem("userId");
            localStorage.removeItem("userPseudo");
            localStorage.removeItem("token");

            if (socket.connected) {
                socket.disconnect();
            }

            window.location.href = "/";
        }
        catch(err) {
            console.error("Erreur durant la déconnexion :", err);
            }
        }

    return (
        <div className=" mt-11 fixed top-12 right-0 w-[700px] h-[50px] bg-[#ffffff08] rounded-l-[60px] rounded-r-none flex items-center justify-center p-[8px] gap-[200px] z-20">
            {userPseudo ? (
                <div className="flex items-center gap-6">
                    <p className="text-white text-lg">Bonjour Abeille <span className="text-[#FFCE1C] font-bold">{userPseudo}</span></p>
                    <button onClick={handleLogout} className="text-red-400 font-bold hover:text-red-600">Se déconnecter</button>
                </div>
                ) : (
                    <>
                        <Link to="/LoginPage"><button className="text-gray-300 font-bold text-lg hover:text-amber-500">Connexion</button></Link>
                        <Link to="/RegisterPage"><button className="text-gray-300 font-bold text-lg hover:text-amber-500">Inscription</button></Link>
                    </>
            )}
        </div>

    );
}
export default ButtonConnexInscrForCreationHivePage;