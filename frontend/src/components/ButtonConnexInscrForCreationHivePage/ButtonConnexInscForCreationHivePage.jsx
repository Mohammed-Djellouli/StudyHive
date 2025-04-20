import React from "react";
import {Link} from 'react-router-dom';


function ButtonConnexInscrForCreationHivePage() {
    return (
        <div className=" mt-11 fixed top-12 right-0 w-[700px] h-[50px] bg-[#ffffff08] rounded-l-[60px] rounded-r-none flex items-center justify-center p-[8px] gap-[200px] z-20">

            <Link to="/LoginPage"><button className="text-gray-300 font-bold text-lg hover:text-amber-500">Connexion</button></Link>

            <Link to="/RegisterPage"><button className="text-gray-300 font-bold text-lg hover:text-amber-500">Inscription</button></Link>

        </div>

    );
}
export default ButtonConnexInscrForCreationHivePage;