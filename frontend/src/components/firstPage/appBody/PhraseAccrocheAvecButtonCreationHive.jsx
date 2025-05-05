import React from "react";
import { useNavigate} from "react-router-dom";
import  { useState, useEffect } from "react";
import socket from "../../socket";

function formatCountdown(endsAt) {
    if (!endsAt) return "--:--:--";
    const remainingMs = new Date(endsAt) - new Date();
    if (remainingMs <= 0) return "Expiré";

    const h = String(Math.floor(remainingMs / 3600000)).padStart(2, '0');
    const m = String(Math.floor((remainingMs % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0');
    return `${h}:${m}:${s}`;
}


function PhraseAccrocheAvecButtonCreationHive() {
    //const [inviteLink, setInviteLink] = useState("");
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [lastHive, setLastHive] = useState(null);


    useEffect(() => {
        const id = localStorage.getItem("userId");
        setUserId(id);
    }, []);

    const handleHiveCreation =  async(mode) => {
        try{
            const socketId = socket.id;
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/hive/create`,{
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId, // userId can be null if the user isn't connected
                    socketId: socketId,
                    mode: mode,
                })
            });

            const data = await response.json();
            if(response.ok){
                //const generatedLink = `${process.env.REACT_APP_FRONTEND_URL}/join/${data.room.idRoom}`;
                //setInviteLink(generatedLink);
                navigate(`/hive/${data.room.idRoom}`, {
                    state:
                        { ownerPseudo: data.ownerPseudo ,
                            isQueenBeeMode: data.room.isQueenBeeMode
                        } })
                if (data.room.idOwner) {
                    localStorage.setItem("userId", data.room.idOwner);
                } else {
                    localStorage.setItem("userId", data.socketId);
                }
                localStorage.setItem("userPseudo", data.room.ownerPseudo);
            }
            else{
                alert("Error in front " + data.message);
            }
        }
        catch(error){
            console.error("Erreur creation hive",error);
        }
    };

    useEffect(() => {
        const id = localStorage.getItem("userId");
        setUserId(id);
        //console.log(" userId localStorage récupéré :", id);

        if (id) {
            const url = `${process.env.REACT_APP_BACKEND_URL}/api/hive/last-created/${id}`;
            //console.log(" Envoi de requête vers :", url);

            fetch(url)
                .then(async res => {
                    const data = await res.json();
              //      console.log(" Réponse reçue de /last-created :", data);

                    if (res.ok && data.idRoom) {
                        setLastHive(data);
                    } else {
                        console.warn("⚠ Aucune ancienne ruche trouvée.");
                    }
                })
                .catch(err => {
                    console.error(" Erreur FETCH ancienne ruche :", err);
                });
        }
    }, []);



    return (
        <div className="flex flex-col items-center space-y-4 mt-20">
            <p className="text-xl md:text-2xl text-white">Transforme Le Travail   </p>
            <p className="text-xl md:text-2xl text-white">En Equipe En Miel </p>
                <p className="text-xl md:text-2xl text-white">De Connaisance</p>
            {/* Container du bouton + HoneyStane */}
            <div className="relative flex justify-center items-center w-full mt-6">
                <button
                    className="relative z-20 w-[260px] md:w-[300px] bg-[#FFCE1C] text-black font-bold text-[18px] md:text-[20px] px-6 py-2 rounded-[6px]"
                    onClick={() => setShowModal(true)}
                >
                    Créer une Ruche
                </button>

                {/* HoneyStane positionné en bas à droite du bouton */}
                <img
                    src="/assets/HoneyStane.png"
                    alt="Honey stain"
                    className="absolute z-10 w-[260px] md:w-[280px] bottom-[-95px] right-[calc(50%-212px)] md:bottom-[-110px] md:right-[calc(50%-240px)]"
                />

                {/* Bees visibles seulement sur desktop */}
                {/* Bees proches du bouton, visibles partout */}
                {/* Bees - Responsive position */}
                <img
                    src="/assets/SoloBee2.png"
                    className="absolute w-[60px] md:w-[100px] bottom-[-80px] md:bottom-[-140px] left-[calc(50%-220px)] md:left-[calc(50%-450px)] transform rotate-[-290deg]"
                    alt="Bee left"
                />
                <img
                    src="/assets/SoloBee2.png"
                    className="absolute w-[60px] md:w-[100px] top-[-100px] md:top-[-140px] right-[calc(50%-160px)] md:right-[calc(50%-480px)] transform rotate-[-120deg]"
                    alt="Bee right"
                />


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
                    {userId && lastHive && new Date(lastHive.timerEndsAt) > new Date() && (
                        <>
                            <div className="flex items-center my-4">
                                <div className="flex-grow border-t border-gray-600"></div>
                                <span className="mx-4 text-gray-400">OU</span>
                                <div className="flex-grow border-t border-gray-600"></div>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-lg text-white font-semibold">Rejoindre votre ancienne ruche</p>
                                <p className="text-sm text-gray-400">
                                    Temps restant : <span>{formatCountdown(lastHive.timerEndsAt)}</span>
                                </p>
                                <button
                                    onClick={() => {
                                        navigate(`/hive/${lastHive.idRoom}`, {
                                            state: { ownerPseudo: lastHive.ownerPseudo }
                                        });
                                    }}
                                    className="mt-2 w-full bg-[#FFCE1C] text-black font-bold py-2 rounded-lg hover:opacity-90 transition"
                                >
                                    Rejoindre
                                </button>
                            </div>
                        </>
                    )}


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
