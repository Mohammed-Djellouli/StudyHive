import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { jsPDF } from "jspdf";

import "./TiptapDark.css"; // on fera un petit fichier pour le dark style

const TiptapBlocNote = () => {
    const editor = useEditor({
        extensions: [StarterKit],
        content: "<p>Les notes sont &eacute;crites ici...</p>",
    });

    const exporterPDF = () => {
        const doc = new jsPDF();

        // Créer un clone temporaire avec une taille de police fixée
        const temp = document.createElement("div");
        temp.innerHTML = editor.getHTML();
        temp.style.fontSize = "8px"; // 👈 Taille de police réduite
        temp.style.lineHeight = "1.5";
        temp.style.padding = "10px";
        temp.style.width = "100%";

        doc.html(temp, {
            callback: function (doc) {
                doc.save("mes_notes.pdf");
            },
            x: 10,
            y: 10
        });
    };

    const toggleFormat = (command) => {
        editor.chain().focus()[command]().run();
    };

    return (
        <div className="bg-[#1e1f21] text-white p-4 rounded-lg w-96 relative shadow-md">
            {/* Barre outils */}
            <div className="flex gap-2 mb-2 text-white">
                <button
                    onClick={() => toggleFormat("toggleBold")}
                    className="p-2 bg-black text-white rounded hover:bg-yellow-300 hover:text-black transition font-bold w-8 h-8 flex items-center justify-center"
                >
                    B
                </button>

                <button
                    onClick={() => toggleFormat("toggleItalic")}
                    className="p-2 bg-black text-white rounded hover:bg-yellow-300 hover:text-black transition italic w-8 h-8 flex items-center justify-center"
                >
                    I
                </button>

                <button
                    onClick={() => toggleFormat("toggleBulletList")}
                    className="p-2 bg-black text-white rounded hover:bg-yellow-300 hover:text-black transition w-8 h-8 flex items-center justify-center"
                >
                    •
                </button>
            </div>


            <div className="bg-transparent text-white min-h-[200px]">
                <EditorContent editor={editor} />
            </div>


            {/* Export PDF */}
            <button
                onClick={exporterPDF}
                className="absolute bottom-2 right-2 p-2 bg-black text-black rounded hover:bg-yellow-300 transition"
            >
                <img src="/Assets/export.png" alt="Exporter en PDF" className="w-6 h-6" />
            </button>
        </div>
    );
};

export default TiptapBlocNote;
