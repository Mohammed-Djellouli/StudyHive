import React, { useEffect, useState } from "react";
import {useParams} from "react-router-dom";
import { useLocation } from "react-router-dom";
import Big_Logo_At_Left from "./components/Big_Logo_At_Left/Big_Logo_At_Left";
import Left_bar_Icons_members_In_Room from "./components/Left_bar_Icons_members_In_Room/Left_bar_Icons_members_In_Room";
import SearchBar from "./components/SeachBar/SeachBar";
import LeftBarTools from "./components/Left_Bar_Tools/LeftBarTools";
import "./App.css";

function HivePage() {
    const { idRoom } = useParams();
    const [ownerPseudo, setOwnerPseudo] = useState(null);
    const [isQueenBeeMode, setIsQueenBeeMode] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:5000/api/hive/${idRoom}`)
            .then(res => res.json())
            .then(data => {
                console.log("ROOM :", data);
                setOwnerPseudo(data.ownerPseudo);
                setIsQueenBeeMode(data.isQueenBeeMode);
            });
    }, [idRoom]);

    const location = useLocation();


    console.log("State reçu dans HivePage :", ownerPseudo, isQueenBeeMode);
    return (

        <div className=" bg-center bg-cover bg-fixed bg-no-repeat min-h-screen text-white bg-[#1a1a1a] "
             style={{ backgroundImage: "url('/Assets/bg.png')",
                 backgroundSize: "270%",
             }}>
            <Big_Logo_At_Left />
            <Left_bar_Icons_members_In_Room ownerPseudo={ownerPseudo} isQueenBeeMode={isQueenBeeMode} />
            <div className="w-full flex justify-center fixed top-0 left-0 pt-2 z-20">
                <SearchBar />
            </div>
            <LeftBarTools/>

        </div>
    );
}


export default HivePage;