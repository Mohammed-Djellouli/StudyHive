import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import LogoAtLeftCreationHive from "./components/firstPage/appHeader/LogoAtLeftCreationHive";
import ButtonConnexInscForCreationHivePage from "./components/firstPage/appHeader/ButtonConnexInscForCreationHivePage";
import PhraseAccrocheAvecButtonCreationHive from "./components/firstPage/appBody/PhraseAccrocheAvecButtonCreationHive";
import TwoTextExplain from "./components/firstPage/appFooter/Text_Bars_Worker_And_Queen_Bee_Mode"
import NotificationBanner from "./components/hivePage/hiveHeader/NotificationBanner";


import "./App.css";


function App(){
    const location = useLocation();
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (location.state?.notification) {
            setNotification(location.state.notification);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    return (
        <div
            className="min-h-screen w-full overflow-y-auto md:overflow-y-visible bg-[#1D1F27] bg-center bg-cover bg-no-repeat pb-32"
            style={{
                backgroundImage: "url('/assets/bg.png')",
                backgroundSize: "270%",
            }}
        >
            {notification && (
                <NotificationBanner
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {/* Contenu centré max-width */}
            <div className="max-w-screen-xl mx-auto px-4">
                <LogoAtLeftCreationHive />
                <ButtonConnexInscForCreationHivePage />
                <PhraseAccrocheAvecButtonCreationHive />
            </div>

            {/* Footer bar (fixe ou scrollable selon taille écran) */}
            <TwoTextExplain />
        </div>
    );
}

export default App;