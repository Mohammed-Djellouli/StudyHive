import {io} from "socket.io-client";

const socket = io(process.env.REACT_APP_BACKEND_URL, {
    transports: ["websocket"],
    secure: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    logger: {
        debug: false,
        info: false,
        warn: false,
        error: false
    }
});

// Supprimer les messages d'erreur de la console
const originalConsoleError = console.error;
console.error = (...args) => {
    if (
        !args[0]?.includes?.('WebSocket') && 
        !args[0]?.includes?.('Socket') && 
        !args[0]?.includes?.('User-Initiated Abort')
    ) {
        originalConsoleError.apply(console, args);
    }
};

socket.on("connect_error", () => {
    // Silence les erreurs de connexion
});

socket.on("error", () => {
    // Silence les erreurs générales
});

export default socket;