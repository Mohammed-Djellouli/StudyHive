const express = require("express");
const cors = require("cors");
const app = express();
const {Server} = require("socket.io")
const http = require("node:http");

app.use(cors());



app.get("/", (req, res) => {
    res.send("StudyHive Backend");
});

const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
});

io.on("connection", (socket) => {
    socket.on("send_message", (message) => {
        io.emit("receive_message", message);
    })

})

server.listen(5000, () => {
    console.log("le server sur : http://localhost:5000");
});
