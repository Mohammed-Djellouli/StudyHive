import React, { useEffect, useState } from "react";

function HiveTimerBanner({ ownerPseudo, timerEndsAt, roomId }) {
    const [timeLeft, setTimeLeft] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(timerEndsAt).getTime();
            const diff = end - now;

            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft(0);
                setShowModal(true);
                // supprimer la room
                fetch(`http://localhost:5000/api/hive/delete/${roomId}`, { method: "DELETE" });
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timerEndsAt, roomId]);

    const formatTime = (millis) => {
        const totalSec = Math.floor(millis / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${h}h ${m}m ${s}s`;
    };

    let timerColor = "text-white";
    if (timeLeft <= 3600000 && timeLeft > 600000) timerColor = "text-yellow-400";
    if (timeLeft <= 600000) timerColor = "text-red-500 animate-pulse";

    return (
        <div className="fixed top-5 right-10 z-50 text-right space-y-2">
            <h2 className="text-xl font-semibold text-white">Hive of {ownerPseudo}</h2>
            <p className={`text-lg font-bold ${timerColor}`}>
                {timeLeft !== null ? formatTime(timeLeft) : "Loading..."}
            </p>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white text-black p-6 rounded-lg space-y-4">
                        <h3 className="text-xl font-bold">⏳ Temps Écoulé</h3>
                        <p>La ruche est terminée. Créez une nouvelle pour continuer.</p>
                        <button
                            onClick={() => window.location.href = "/"}
                            className="bg-yellow-400 px-4 py-2 rounded hover:bg-yellow-300"
                        >
                            Retour à l'accueil
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HiveTimerBanner;
