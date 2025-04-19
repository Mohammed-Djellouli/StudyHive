import React from "react";
import { useNavigate} from "react-router-dom";
import  { useState, useEffect } from "react";



function PhraseAccrocheAvecButtonCreationHive() {
    //const [inviteLink, setInviteLink] = useState("");
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);

    //const userId = "68012ef6e2497c62577d46d8" //un id temp pour tester si çela vas marcher ou pas

    useEffect(() => {
        const id = localStorage.getItem("userId");
        setUserId(id);
    }, []);

    const handleHiveCreation =  async(mode) => {
        if (!userId) {
            alert("Veuillez vous connecter pour créer une ruche.");
            return;
        }
        try{
            const response = await fetch("http://localhost:5000/api/hive/create",{
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId,
                    mode: mode,
                })
            });

            const data = await response.json();
            if(response.ok){

                //const generatedLink = `http://localhost:3000/join/${data.room.idRoom}`;
                //setInviteLink(generatedLink);
                navigate(`/hive/${data.room.idRoom}`, { state: { ownerPseudo: data.ownerPseudo , isQueenBeeMode: data.room.isQueenBeeMode } });
            }
            else{
                alert("Error in front " + data.message);
            }
        }
        catch(error){
            console.error("Erreur creation hive",error);
        }
    };

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

                                onClick={() => {
                                    handleHiveCreation("worker");
                                    setShowModal(false);
                        }}
                        > Worker Bee Mode</button>
                        <button className=" w-1/2 bg-[#FFCE1C] text-black font-bold py-2 rounded-lg hover:opacity-90 transition"
                                onClick={() => {
                                    handleHiveCreation("queen");
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
                {/*the code below this div is not working until we put our website on working then we cant do that */}
                {/*
                {inviteLink && (
                    <div className="text-center text-sm mt-4">
                        <p className="mb-2 text-white">Lien d'invitation à partager :</p>
                        <div className="bg-gray-800 text-yellow-300 px-3 py-2 rounded break-all">
                            {inviteLink}
                        </div>

                        <button
                            onClick={() => navigate(`/hive/${inviteLink.split("/").pop()}`, {
                                state: {
                                    ownerPseudo: localStorage.getItem("userPseudo"),
                                }
                            })}
                            className="mt-4 text-sm text-amber-500 underline hover:text-amber-300"
                        >
                            Aller dans ma ruche →
                        </button>
                    </div>
                )}
                */}
            </div>
            )}
        </div>
    );
}

export default PhraseAccrocheAvecButtonCreationHive;
