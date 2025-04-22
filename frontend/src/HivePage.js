import React, { useEffect, useState } from "react";
import {useParams} from "react-router-dom";
import { useLocation } from "react-router-dom";
import Big_Logo_At_Left from "./components/hiveHeader/Big_Logo_At_Left";
import Left_bar_Icons_members_In_Room from "./components/hiveBody/Left_bar_Icons_members_In_Room";
import SearchBar from "./components/hiveHeader/SeachBar";
import LeftBarTools from "./components/hiveBody/LeftBarTools";
import HiveTimerBanner from "./components/hiveHandle/HiveTimerBanner";
import ChatBox from "./components/Communication/Chat/chatBox";
import VoiceChat from "./components/Communication/MicChat/VoiceChat";

import "./App.css";

function HivePage() {
    const { idRoom } = useParams();
    const location = useLocation();
    const [ownerPseudo, setOwnerPseudo] = useState(location.state?.ownerPseudo || null);
    const [isQueenBeeMode, setIsQueenBeeMode] = useState(false);
    const [timerEndsAt,  setTimerEndsAt]= useState(null);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/hive/${idRoom}`)
            .then(res => res.json())
            .then(data => {
                console.log("ROOM :", data);
                setIsQueenBeeMode(data.isQueenBeeMode);
                setTimerEndsAt(data.timerEndsAt);

                if (!location.state?.ownerPseudo && data.ownerPseudo) {
                    setOwnerPseudo(data.ownerPseudo);
                }
            });
    }, [idRoom,location.state]);


    console.log("State reçu dans HivePage :", ownerPseudo, isQueenBeeMode);
    return (

        <div className=" bg-center bg-cover bg-fixed bg-no-repeat min-h-screen text-white bg-[#1a1a1a] "
             style={{ backgroundImage: "url('/assets/bg.png')",
                 backgroundSize: "270%",
             }}>
            <Big_Logo_At_Left />
            <Left_bar_Icons_members_In_Room ownerPseudo={ownerPseudo} isQueenBeeMode={isQueenBeeMode} />
            <div className="fixed bottom-10 right-4 w-[90vw] max-w-[385px]">
                <ChatBox/>
            </div>
            <div className="w-full flex justify-center fixed top-0 left-0 pt-2 z-20">
                <SearchBar />
            </div>
            <HiveTimerBanner ownerPseudo={ownerPseudo} timerEndsAt={timerEndsAt} roomId={idRoom} />
            <LeftBarTools/>
        </div>
    );
}


export default HivePage;