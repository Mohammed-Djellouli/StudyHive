import React, { useRef, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import socket from "../../socket";
import { FaEraser } from "react-icons/fa";


const WhiteBoard = ({ roomId,isModalOpen, setIsModalOpen , canDraw}) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(3);


    // Join whiteboard room
    useEffect(() => {
        if (roomId) {
            socket.emit("join_whiteboard", roomId);
        }

        return () => {
            socket.emit("leave_whiteboard", roomId);
        };
    }, [roomId]);

    const modalRef = useRef(null);
    const [modalPosition, setModalPosition] = useState({ x: 200, y: 100 });
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const handleDragStart = (e) => {
        isDraggingRef.current = true;
        dragStartRef.current = {
            x: e.clientX - modalPosition.x,
            y: e.clientY - modalPosition.y,
        };
        document.addEventListener("mousemove", handleDragging);
        document.addEventListener("mouseup", handleDragEnd);
    };

    const handleDragging = (e) => {
        if (!isDraggingRef.current) return;
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;

        const maxX = window.innerWidth - 850;
        const maxY = window.innerHeight - 480;

        setModalPosition({
            x: Math.min(Math.max(0, newX), maxX),
            y: Math.min(Math.max(0, newY), maxY),
        });
    };

    const handleDragEnd = () => {
        isDraggingRef.current = false;
        document.removeEventListener("mousemove", handleDragging);
        document.removeEventListener("mouseup", handleDragEnd);
    };


    const getTouchPos = (touchEvent) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = touchEvent.touches[0];
        return {
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        };
    };

    const handleTouchStart = (e) => {
        if (!canDraw) return;

        const { offsetX, offsetY } = getTouchPos(e);
        const ctx = canvasRef.current.getContext("2d");
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);

        socket.emit("draw", {
            x: offsetX,
            y: offsetY,
            color,
            brushSize,
            type: "start"
        });
    };

    const handleTouchMove = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getTouchPos(e);
        const ctx = canvasRef.current.getContext("2d");
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();

        socket.emit("draw", {
            x: offsetX,
            y: offsetY,
            color,
            brushSize,
            type: "draw"
        });
    };

    const handleTouchEnd = () => {
        setIsDrawing(false);
        canvasRef.current.getContext("2d").beginPath();
    };



    const startDraw = (e) => {
        if (!canDraw) return;

        const ctx = canvasRef.current.getContext("2d");
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);

        socket.emit("draw", {
            roomId,
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY,
            color,
            brushSize,
            type: "start"
        });
    };

    const draw = (e) => {
        if (!canDraw) return;

        if (!isDrawing) return;
        const ctx = canvasRef.current.getContext("2d");
        const { offsetX, offsetY } = e.nativeEvent;
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();

        socket.emit("draw", {
            roomId,
            x: offsetX,
            y: offsetY,
            color,
            brushSize,
            type: "draw"
        });
    };

    const stopDraw = () => {
        if (!canDraw) return;

        setIsDrawing(false);
        canvasRef.current.getContext("2d").beginPath();
    };

    //  Listen for remote drawing events
    useEffect(() => {
        const handleDraw = ({ x, y, color, brushSize, type }) => {
            const ctx = canvasRef.current.getContext("2d");
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.lineCap = "round";

            if (type === "start") {
                ctx.beginPath();
                ctx.moveTo(x, y);
            } else if (type === "draw") {
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        };

        const handleClear = () => {
            const ctx = canvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        };

        socket.on("draw", handleDraw);
        socket.on("clear", handleClear);
        socket.on("changeBrushSize", (size) => {
            setBrushSize(size);
        });

        return () => {
            socket.off("draw", handleDraw);
            socket.off("clear", handleClear);
            socket.off("changeBrushSize");
        };
    }, []);

    const clearCanvas = () => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        socket.emit("clear", roomId);
    };

    const exportToPDF = () => {
        const canvas = canvasRef.current;
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save("whiteboard.pdf");
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = 800;
        canvas.height = 500;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    return (
        <div
            ref={modalRef}
            className={`fixed w-[850px] h-[500px] bg-[#1a1a1a] rounded-lg overflow-hidden shadow-2xl z-40 transition-opacity duration-300 ${
                isModalOpen ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
            style={{
                left: `${modalPosition.x}px`,
                top: `${modalPosition.y}px`,
                pointerEvents: isModalOpen ? "auto" : "none",
            }}
        >
            {/* Barre supérieure pour déplacer + bouton cacher */}
            <div
                className="absolute top-0 left-0 right-0 bg-[#2a2a2a] p-2 flex justify-between items-center cursor-move"
                onMouseDown={handleDragStart}
            >
                <span className="text-white text-sm select-none">Tableau Blanc</span>
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 rounded ml-2"
                >
                    Fermer
                </button>
            </div>

            {/* Contenu principal */}
            <div className="mt-10 px-4 py-2">
                {/* outils */}
                <div className="flex items-center gap-4 mb-2 text-white">
                    <label> Couleur:</label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={!canDraw}
                    />

                    <label> Taille:</label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={brushSize}
                        disabled={!canDraw}
                        onChange={(e) => {
                            if (!canDraw) return;
                            const newSize = parseInt(e.target.value);
                            setBrushSize(newSize);
                            socket.emit("changeBrushSize", { roomId, size: newSize });
                        }}
                    />


                    <button
                        disabled={!canDraw}
                        onClick={() => {
                            if (!canDraw) return;
                            clearCanvas();
                        }}
                        className="p-2 bg-black text-white rounded hover:bg-yellow-300 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <FaEraser className="w-5 h-5" />
                    </button>

                    <button
                        onClick={exportToPDF}
                        className="p-2 bg-black text-white rounded hover:bg-yellow-300 transition flex items-center justify-center"
                    >
                        <img src="/Assets/export.png" alt="Exporter en PDF" className="w-6 h-6" />
                    </button>

                </div>

                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="border border-gray-500 rounded bg-white touch-none"
                />
            </div>
        </div>
    );
};

export default WhiteBoard;
