import React, { useRef, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import socket from "../../../socket";

const WhiteBoard = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(3);

    const getTouchPos = (touchEvent) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const touch = touchEvent.touches[0];
        return {
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        };
    };

    const handleTouchStart = (e) => {
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
        const ctx = canvasRef.current.getContext("2d");
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);

        socket.emit("draw", {
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY,
            color,
            brushSize,
            type: "start"
        });
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current.getContext("2d");
        const { offsetX, offsetY } = e.nativeEvent;
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

    const stopDraw = () => {
        setIsDrawing(false);
        canvasRef.current.getContext("2d").beginPath();
    };

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
        socket.on("changeBrushSize", (newSize) => {
            setBrushSize(newSize);
        });
        socket.on("draw", handleDraw);
        socket.on("clear", handleClear);

        return () => {
            socket.off("draw", handleDraw);
            socket.off("clear", handleClear);
        };
    }, []);

    const clearCanvas = () => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        socket.emit("clear");
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
        <div className="text-white space-y-4">
            <div className="flex items-center gap-4 mb-2">
                <label> Couleur:</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />

                <label> Taille:</label>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => {
                        const newSize = parseInt(e.target.value);
                        setBrushSize(newSize);
                        socket.emit("changeBrushSize", newSize);
                    }}
                />

                <button onClick={clearCanvas} className="bg-red-600 px-4 py-1 rounded hover:bg-red-500"> Clear</button>
                <button onClick={exportToPDF} className="bg-green-600 px-4 py-1 rounded hover:bg-green-500"> Export PDF</button>
            </div>

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
    );
};

export default WhiteBoard;
