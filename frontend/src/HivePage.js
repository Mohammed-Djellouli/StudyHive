import React, { useEffect, useState } from "react";
import Big_Logo_At_Left from "./components/Big_Logo_At_Left/Big_Logo_At_Left";
import Left_Bar from "./components/Left_bar_Icons_members_In_Room/Left_bar_Icons_members_In_Room";
import SearchBar from "./components/SeachBar/SeachBar";
import "./App.css";

function HivePage() {

    return (

        <div className=" bg-center bg-cover bg-fixed bg-no-repeat min-h-screen text-white bg-[#1a1a1a] "
             style={{ backgroundImage: "url('/Assets/bg.png')",
                 backgroundSize: "270%",
             }}>
            <Big_Logo_At_Left />
            <Left_Bar />
            <div className="w-full flex justify-center fixed top-0 left-0 pt-2 z-20">
                <SearchBar />
            </div>
        </div>
    );
}


export default HivePage;