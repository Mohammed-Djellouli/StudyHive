const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/connexion");
const passport = require("passport");
const cookieSession = require("cookie-session");
const http = require("http");
const { Server } = require("socket.io");

require("./config/passport");

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Video sync state management
const roomState = {};
const roomUsers = {};

io.on("connection", (socket) => {
    console.log("✅ Client connecté:", socket.id);

    socket.on("send_message", (message) => {
        io.emit("receive_message", message);
    });

    socket.on("joinRoom", ({ roomId, userName }) => {
        socket.join(roomId);

        if (!roomUsers[roomId]) roomUsers[roomId] = [];
        roomUsers[roomId].push({
            socketId: socket.id,
            userName: userName || "Anonyme"
        });

        if (roomState[roomId]) {
            socket.emit("syncVideo", roomState[roomId]);
        }

        io.to(roomId).emit("updateUserList", roomUsers[roomId]);
        console.log(`🟢 ${userName || "Utilisateur"} a rejoint la ruche ${roomId}`);
    });

    socket.on("join_voice", (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined ${roomId}`);
        const otherUsers = Array.from(io.sockets.adapter.rooms.get(roomId) || []).filter(id => id !== socket.id);
        socket.emit("all_users", otherUsers);
    });

    socket.on("videoChanged", ({ roomId, videoId, time }) => {
        const lastUpdate = Date.now();
        const isPlaying = true;
        roomState[roomId] = { videoId, time, isPlaying, lastUpdate };
        socket.to(roomId).emit("syncVideo", roomState[roomId]);
    });

    socket.on("syncVideo", ({ roomId, videoId, time, isPlaying, lastUpdate }) => {
        roomState[roomId] = { videoId, time, isPlaying, lastUpdate };
        socket.to(roomId).emit("syncVideo", roomState[roomId]);
    });

    socket.on("sending_signal", ({ targetId, signal }) => {
        io.to(targetId).emit("user_signal", {
            signal,
            callerId: socket.id,
        });
    });

    socket.on("returning_signal", ({ callerId, signal }) => {
        io.to(callerId).emit("receive_returned_signal", {
            signal,
            id: socket.id,
        });
    });

    socket.on("disconnect", () => {
        for (const roomId in roomUsers) {
            roomUsers[roomId] = roomUsers[roomId].filter(user => user.socketId !== socket.id);
            io.to(roomId).emit("updateUserList", roomUsers[roomId]);

            if (roomUsers[roomId].length === 0) {
                delete roomUsers[roomId];
                delete roomState[roomId];
                console.log(`🧹 Ruche ${roomId} supprimée (vide)`);
            }
        }
        console.log("❌ Client déconnecté:", socket.id);
        io.emit("user_disconnected", socket.id);
    });
});

// Routes
const authRoutes = require("./routes/authRoutes");
const authGoogleRoutes = require("./routes/authGoogle");
const hiveRoutes = require("./routes/hiveRoutes");
const permissionRoutes = require("./routes/permissionRoutes");

app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: ["studyhive_session_key"]
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/auth", authGoogleRoutes);
app.use("/api/hive", hiveRoutes);
app.use("/api/permission", permissionRoutes);

// Route test
app.get("/", (req, res) => {
    res.send("StudyHive Backend fonctionne !");
});

// MongoDB Connection
connectDB();

// Server start
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur : http://localhost:${PORT}`);
});
