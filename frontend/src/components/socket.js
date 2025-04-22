import {io} from "socket.io-client";

const socket = io("http://localhost:5000");


/*const socket = io(process.env.REACT_APP_BACKEND_URL, {
    transports: ["websocket"],
    secure: true,
});*/
export default socket;