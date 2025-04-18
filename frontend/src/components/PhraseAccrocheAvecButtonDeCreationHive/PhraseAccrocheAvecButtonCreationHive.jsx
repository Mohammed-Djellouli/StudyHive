import React from "react";
import { useNavigate} from "react-router-dom";
import  { useState } from "react";



function PhraseAccrocheAvecButtonCreationHive() {
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center space-y-4 mt-20">
            <p className="text-2xl text-white text-center">Transforme Le Travail</p>
            <p className="text-2xl text-white text-center">En Equipe En Miel De</p>
            <p className="text-2xl text-white text-center">Connaisance</p>

            {/* Container du bouton + HoneyStane */}
            <div className="relative inline-block">
                    <button className="w-[300px] bg-[#FFCE1C] text-black font-bold text-[20px] px-6 py-2 rounded-[6px] "
                    onClick={() => setShowModal(true)}>
                        Créer une Ruche
                    </button>

                {/* Image tache miel */}
                <img
                    src="/Assets/HoneyStane.png"
                    alt="Honey stain"
                    className="absolute -bottom-20 -right-16 w-[200px]"
                />
                <img src="/Assets/SoloBee2.png" className="absolute -left-72 w-[100px] transfomr rotate-[-290deg]" />
                <img src="/Assets/SoloBee2.png" className="absolute -right-72 -top-48 w-[100px] transform rotate-[-120deg]"/>
            </div>

            {/* Block du Modal */}
            {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" >
                <div className="bg-[#1D1F27] text-white p-8 rounded-xl shadow-xl w-[400px] space-y-6">
                    <h2>
                       Est-ce que vous vouler etre une {" "}
                        <span className="text-[#FFCE1C]"> Queen </span> ou un {" "}
                       <span className="text-[#FFCE1C]"> Worker </span> ?
                    </h2>
                    <div className="flex justify-between gap-4">
                        <button className=" w-1/2 bg-[#FFCE1C] text-black font-bold py-2 rounded-lg hover:opacity-90 transition"
                                onClick={() => {navigate("/app"); /*if we wants later to add the role juste we put /app?role=worker*/
                                setShowModal(false);
                        }}
                        > Worker Bee Mode</button>
                        <button className=" w-1/2 bg-[#FFCE1C] text-black font-bold py-2 rounded-lg hover:opacity-90 transition"
                                onClick={() => {navigate("/app");
                                    setShowModal(false);
                                }}
                        > Queen Bee Mode</button>
                    </div>
                    <div className="flex justify-center">
                        <button
                            className="text-gray-400 text-sm underline hover:text-white"
                            onClick={() => {setShowModal(false);}}
                        > Fermer</button>
                    </div>
                </div>

            </div>
            )}
        </div>
    );
}

export default PhraseAccrocheAvecButtonCreationHive;
