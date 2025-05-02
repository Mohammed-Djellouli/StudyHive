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
        <body className="min-h-screen w-full bg-[#1D1F27]  bg-center bg-cover bg-no-repeat"
              style={{ backgroundImage: "url('/assets/bg.png')",
                  backgroundSize: "270%",
              }}>
        {notification && (
            <NotificationBanner
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(null)}
            />
        )}
        <LogoAtLeftCreationHive />
        <ButtonConnexInscForCreationHivePage />
        <PhraseAccrocheAvecButtonCreationHive />
        <TwoTextExplain/>
        <TwoTextExplain/>
        </body>
    );
}
export default App;