import React  from "react";

import LogoAtLeftCreationHive from "./components/Logo_At_Top_Left_Creation_Hive/LogoAtLeftCreationHive";
import ButtonConnexInscForCreationHivePage from "./components/ButtonConnexInscrForCreationHivePage/ButtonConnexInscForCreationHivePage";
import PhraseAccrocheAvecButtonCreationHive from "./components/PhraseAccrocheAvecButtonDeCreationHive/PhraseAccrocheAvecButtonCreationHive";

import "./App.css";

function CreationHivePage(){
    return (
        <body className="min-h-screen w-full bg-[#1D1F27]  bg-center bg-cover bg-no-repeat"
              style={{ backgroundImage: "url('/Assets/bg.png')",
                  backgroundSize: "252%",
              }}>
            <LogoAtLeftCreationHive />
            <ButtonConnexInscForCreationHivePage />
            <PhraseAccrocheAvecButtonCreationHive />
        </body>
    );
}
export default CreationHivePage;