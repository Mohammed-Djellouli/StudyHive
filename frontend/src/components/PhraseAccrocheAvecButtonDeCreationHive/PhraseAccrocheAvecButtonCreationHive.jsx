import React from "react";
import { Link } from "react-router-dom";
function PhraseAccrocheAvecButtonCreationHive() {
    return (
        <div className="flex flex-col items-center space-y-4 mt-20">
            <p className="text-2xl text-white text-center">
                Transforme Le Travail
            </p>
            <p className="text-2xl text-white text-center">
                En Equipe En Miel De
            </p>
            <p className="text-2xl text-white text-center">
                Connaisance
            </p>

            {/* Container du bouton + HoneyStane */}
            <div className="relative inline-block">
                <Link to="/app">
                    <button className="w-[300px] bg-[#FFCE1C] text-black font-bold text-[20px] px-6 py-2 rounded-[6px]">
                        Créer une Ruche
                    </button>
                </Link>
                {/* Image tache miel */}
                <img
                    src="/Assets/HoneyStane.png"
                    alt="Honey stain"
                    className="absolute -bottom-20 -right-16 w-[200px]"
                />
                <img src="/Assets/SoloBee2.png" className="absolute -left-72 w-[100px] transfomr rotate-[-290deg]" />
                <img src="/Assets/SoloBee2.png" className="absolute -right-72 -top-48 w-[100px] transform rotate-[-120deg]"/>
            </div>

        </div>
    );
}

export default PhraseAccrocheAvecButtonCreationHive;
