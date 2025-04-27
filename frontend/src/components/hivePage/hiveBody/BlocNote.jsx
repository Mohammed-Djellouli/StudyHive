import React, { useState } from "react";
import { jsPDF } from "jspdf";

const BlocNote = () => {
    const [note, setNote] = useState("");

    const exporterPDF = () => {
        const doc = new jsPDF();
        doc.text(note, 10, 10);
        doc.save("mes_notes.pdf");
    };

    return (
        <div className="bg-[#1e1f21] text-white p-4 rounded-lg w-96 h-[300px] relative shadow-md">
            <textarea
                className="w-full h-full bg-transparent text-white outline-none resize-none"
                placeholder="Les notes sont écrites ici..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />

            <button
                onClick={exporterPDF}
                className="absolute bottom-2 right-2 p-2 bg-black text-black rounded hover:bg-yellow-300 transition"
            >
                <img src="/Assets/export.png" alt="Exporter en PDF" className="w-6 h-6" />
            </button>
        </div>
    );
};

export default BlocNote;
