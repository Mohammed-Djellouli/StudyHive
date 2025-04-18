import React  from "react";

import LogoAtLeftCreationHive from "./components/Logo_At_Top_Left_Creation_Hive/LogoAtLeftCreationHive";
import ButtonConnexInscForCreationHivePage from "./components/ButtonConnexInscrForCreationHivePage/ButtonConnexInscForCreationHivePage";
import PhraseAccrocheAvecButtonCreationHive from "./components/PhraseAccrocheAvecButtonDeCreationHive/PhraseAccrocheAvecButtonCreationHive";
import TwoTextExplain from "./components/Text_Bars_Explain_Modes/Text_Bars_Worker_And_Queen_Bee_Mode"

import "./App.css";


function CreationHivePage(){
    return (
        <body className="min-h-screen w-full bg-[#1D1F27]  bg-center bg-cover bg-no-repeat"
              style={{ backgroundImage: "url('/Assets/bg.png')",
                  backgroundSize: "270%",
              }}>
            <LogoAtLeftCreationHive />
            <ButtonConnexInscForCreationHivePage />
            <PhraseAccrocheAvecButtonCreationHive />
            <TwoTextExplain/>
        </body>
    );
}
export default CreationHivePage;