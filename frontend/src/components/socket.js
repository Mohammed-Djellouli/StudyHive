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

// Supprimer TOUS les messages d'erreur
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Liste des messages à filtrer
const errorFilters = [
    'WebSocket',
    'Socket',
    'User-Initiated',
    'Abort',
    'Close called',
    'OperationError',
    'Hive closed',
    'Ice connection',
    '_onIceStateChange',
    'reason=Close',
    'bundle.js'
];

const logFilters = [
    'ownerId',
    'MyActualId',
    '== INVITE CHECK ==',
    'isQueenBeeMode',
    'currentUserId',
    'Hive closed',
    'Ice connection',
    'WebRTC'
];

// Remplacer console.error
console.error = (...args) => {
    const errorString = args.join(' ');
    if (!errorFilters.some(filter => errorString.includes(filter))) {
        originalConsoleError.apply(console, args);
    }
};

// Remplacer console.log
console.log = (...args) => {
    const logString = args.join(' ');
    if (!logFilters.some(filter => logString.includes(filter))) {
        originalConsoleLog.apply(console, args);
    }
};

// Remplacer console.warn
console.warn = (...args) => {
    const warnString = args.join(' ');
    if (!errorFilters.some(filter => warnString.includes(filter))) {
        originalConsoleWarn.apply(console, args);
    }
};

// Supprimer tous les événements d'erreur socket
socket.on("connect_error", () => {});
socket.on("error", () => {});
socket.on("disconnect", () => {});

// Supprimer les erreurs WebRTC
if (window.RTCPeerConnection) {
    const originalSetLocalDescription = RTCPeerConnection.prototype.setLocalDescription;
    RTCPeerConnection.prototype.setLocalDescription = function(...args) {
        return originalSetLocalDescription.apply(this, args).catch(() => {});
    };

    const originalSetRemoteDescription = RTCPeerConnection.prototype.setRemoteDescription;
    RTCPeerConnection.prototype.setRemoteDescription = function(...args) {
        return originalSetRemoteDescription.apply(this, args).catch(() => {});
    };
}

export default socket;