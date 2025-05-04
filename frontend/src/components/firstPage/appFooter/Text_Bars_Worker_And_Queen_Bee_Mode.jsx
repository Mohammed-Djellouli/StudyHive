import React, { useState, useEffect } from 'react';

function TwoTextsForExplainModes() {
    const [showFirst, setShowFirst] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowFirst(prev => !prev);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full md:w-auto fixed bottom-0 left-1/2 transform -translate-x-1/2 z-10 pb-4 mt-10 md:mt-0">
            <div className="relative flex flex-col md:flex-row bg-[#ffffff08] text-white px-6 py-4 md:px-10 md:py-6 rounded-t-xl shadow-lg gap-6 md:gap-10 w-full max-w-4xl text-center md:text-left items-center justify-center">

                {/* Mobile: switch d’un bloc à l’autre */}
                <div className="block md:flex md:items-center md:justify-between w-full">

                    {/* Bloc 1 - Worker */}
                    {(showFirst || window.innerWidth >= 768) && (
                        <div className="max-w-[300px] mx-auto md:mx-0 md:text-right transition-opacity duration-500">
                            <h3 className="font-bold text-lg mb-1">Worker Bee Mode</h3>
                            <p className="text-sm">Tous les membres ont les mêmes droits, chacun peut interagir librement.</p>
                        </div>
                    )}

                    {/* Ligne de séparation Desktop */}
                    <div className="hidden md:block w-[1px] bg-white opacity-20 mx-4"></div>

                    {/* Bloc 2 - Queen */}
                    {(!showFirst || window.innerWidth >= 768) && (
                        <div className="max-w-[300px] mx-auto md:mx-0 md:text-left transition-opacity duration-500">
                            <h3 className="font-bold text-lg mb-1">Queen Bee Mode</h3>
                            <p className="text-sm">Seul l’hôte contrôle les actions, les autres ne peuvent qu’échanger via le chat.</p>
                        </div>
                    )}
                </div>

                {/* Indicateurs Mobile uniquement */}
                <div className="absolute top-2 right-4 md:hidden flex gap-2">
                    <div
                        className={`w-2 h-2 rounded-full ${
                            showFirst ? 'bg-white' : 'bg-gray-400'
                        }`}
                    ></div>
                    <div
                        className={`w-2 h-2 rounded-full ${
                            !showFirst ? 'bg-white' : 'bg-gray-400'
                        }`}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default TwoTextsForExplainModes;
