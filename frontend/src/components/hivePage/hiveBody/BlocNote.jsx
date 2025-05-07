import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { jsPDF } from "jspdf";
import "./TiptapDark.css";

let editor;
const TiptapBlocNote = ({ isChatVisible }) => {
    editor = useEditor({
        extensions: [StarterKit],
        content: "",
    });

    const exporterPDF = () => {
        if (!editor) return;
        const doc = new jsPDF();
        const temp = document.createElement("div")
        temp.innerHTML = editor.getHTML();
        temp.style.fontSize = "8px";
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
        <div className="bg-[#1e1f21] text-white p-4 rounded-lg relative shadow-md flex flex-col transition-all duration-500 h-full max-h-[900px] overflow-y-auto">
        {/* Barre outils */}
            <div className="flex gap-2 mb-2 text-white shrink-0">
                <button onClick={() => toggleFormat("toggleBold")} className="p-2 bg-black text-white rounded hover:bg-yellow-300 hover:text-black transition font-bold w-8 h-8 flex items-center justify-center">B</button>
                <button onClick={() => toggleFormat("toggleItalic")} className="p-2 bg-black text-white rounded hover:bg-yellow-300 hover:text-black transition italic w-8 h-8 flex items-center justify-center">I</button>
                <button onClick={() => toggleFormat("toggleBulletList")} className="p-2 bg-black text-white rounded hover:bg-yellow-300 hover:text-black transition w-8 h-8 flex items-center justify-center">•</button>
            </div>

            {/* Zone scrollable */}
            <div className="bloc-Note flex-1 overflow-y-auto pr-1 min-h-[100px] max-h-[30vh]">
                <EditorContent editor={editor} />
            </div>

            {/* Export PDF */}
            <button
                onClick={exporterPDF}
                className="absolute bottom-2 right-2 p-2 bg-black text-black rounded hover:bg-yellow-300 transition"
            >
                <img src="/assets/export.png" alt="Exporter en PDF" className="w-6 h-6" />
            </button>
        </div>
    );
};

export default TiptapBlocNote;
