import React  from "react";

import LogoAtLeftCreationHive from "./components/firstPage/appHeader/LogoAtLeftCreationHive";
import ButtonConnexInscForCreationHivePage from "./components/firstPage/appHeader/ButtonConnexInscForCreationHivePage";
import PhraseAccrocheAvecButtonCreationHive from "./components/firstPage/appBody/PhraseAccrocheAvecButtonCreationHive";
import TwoTextExplain from "./components/firstPage/appFooter/Text_Bars_Worker_And_Queen_Bee_Mode"


import "./App.css";


function App(){
    return (
        <body className="min-h-screen w-full bg-[#1D1F27]  bg-center bg-cover bg-no-repeat"
              style={{ backgroundImage: "url('/assets/bg.png')",
                  backgroundSize: "270%",
              }}>
        <LogoAtLeftCreationHive />
        <ButtonConnexInscForCreationHivePage />
        <PhraseAccrocheAvecButtonCreationHive />
        <TwoTextExplain/>
        <TwoTextExplain/>
        </body>
    );
}
export default App;