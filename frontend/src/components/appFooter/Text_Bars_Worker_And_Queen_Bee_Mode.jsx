import React from 'react';

function TwoTextsForExplainModes() {
    return (
        <div className="fixed bottom-0 w-full flex justify-center pb-4 z-10">
            <div className="flex bg-[#ffffff08] text-white px-10 py-6 rounded-t-xl shadow-lg gap-10">


                <div className="text-right max-w-[300px]">
                    <h3 className="font-bold text-lg mb-1">Worker Bee Mode</h3>
                    <p className="text-sm">Tous les membres ont les mêmes droits, chacun peut interagir librement.</p>
                </div>

                {/* Ligne de séparation */}
                <div className="w-[1px] bg-white opacity-20"></div>


                <div className="text-left max-w-[300px]">
                    <h3 className="font-bold text-lg mb-1">Queen Bee Mode</h3>
                    <p className="text-sm">Seul l’hôte contrôle les actions, les autres ne peuvent qu’échanger via le chat.</p>
                </div>

            </div>
        </div>
    );
}

export default TwoTextsForExplainModes;
