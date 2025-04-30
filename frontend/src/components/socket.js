import io from 'socket.io-client';

const ENDPOINT = process.env.REACT_APP_SOCKET_ENDPOINT || 'http://localhost:5001';

const socket = io(ENDPOINT, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
});

socket.on('connect', () => {
    console.log('Socket connected successfully to:', ENDPOINT);
});

socket.on('disconnect', () => {
    console.log('Socket disconnected from:', ENDPOINT);
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    console.log('Failed to connect to:', ENDPOINT);
});

export default socket;