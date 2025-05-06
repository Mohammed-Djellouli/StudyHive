import React from "react";
import { QRCodeCanvas } from "qrcode.react";

function InviteModal({ roomId, onClose }) {
    const invitationLink = `${process.env.REACT_APP_FRONTEND_URL}/join/${roomId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(invitationLink);
            alert("Lien copié !");
        } catch (err) {
            console.error("Échec de la copie : ", err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-[#1D1F27] text-white rounded-2xl p-6 shadow-2xl w-[330px] text-center">
                <h2 className="text-lg font-semibold mb-4"> Inviter quelqu’un</h2>

                <QRCodeCanvas value={invitationLink} size={150} className="mx-auto mb-4 rounded-md" />


                <input
                    type="text"
                    value={invitationLink}
                    readOnly
                    className="w-full border border-gray-500 bg-[#2A2D3A] px-3 py-2 rounded mb-4 text-sm text-white"
                />

                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleCopy}
                        className="bg-amber-400 px-4 py-1 rounded text-black text-sm font-semibold shadow hover:bg-amber-300 transition"
                    >
                        Copier
                    </button>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-sm"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InviteModal;
