const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/connexion");
const passport = require("passport");
const cookieSession = require("cookie-session");

require("./config/passport");

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const hiveRoutes = require("./routes/hiveRoutes");
// Connexion MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

//roomCreation
app.use("/api/hive", hiveRoutes);

app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: ["studyhive_session_key"]
}));
const Hive = require("./models/Hive");
const User = require("./models/User");

app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoutes = require("./routes/authRoutes");
const authGoogleRoutes = require("./routes/authGoogle");

app.use("/api/auth", authRoutes);
app.use("/auth", authGoogleRoutes);

const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

// Video sync state management
const roomState = {};
const roomUsers = {};
const rooms = {}; // For WebRTC connections

io.on("connection", (socket) => {

    // Quand un utilisateur rejoint une Hive
    socket.on("join_hive_room", async ({ roomId, userId }) => {
        socket.join(roomId);

        try {
            const hive = await Hive.findOne({ idRoom: roomId });

            if (!hive) {
                console.error(`Hive ${roomId} not found`);
                return;
            }

            const user = hive.users.find(u =>
                (u.userId && u.userId.toString() === userId) ||
                (u.socketId && u.socketId === userId)
            );

            if (!user) {
                console.error(`User ${userId} not found in Hive ${roomId}`);
                return;
            }

            io.to(roomId).emit("user_joined", user);
            console.log(`${user.pseudo} (correct user) joined room ${roomId}`);
        } catch (error) {
            console.error("Erreur serveur join_hive_room:", error);
        }
    });



    socket.on("send_message", ({roomId,message}) => {
        if(roomId && message){
            io.to(roomId).emit("receive_message",message);
        }
    })

    socket.on("draw", (data) => {
        socket.broadcast.emit("draw", data);
    });

    socket.on("changeBrushSize", (size) => {
        socket.broadcast.emit("changeBrushSize", size);
    });

    socket.on("clear", () => {
        socket.broadcast.emit("clear");
    });

    socket.on("joinRoom", ({ roomId, userName }) => {
        socket.join(roomId);

        if (!roomUsers[roomId]) roomUsers[roomId] = [];
        roomUsers[roomId].push({
            socketId: socket.id,
            userName: userName || "Anonyme"
        });

        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }
        rooms[roomId].push(socket.id);

        const otherUsers = rooms[roomId].filter(id => id !== socket.id);
        socket.emit("all users", otherUsers);

        otherUsers.forEach(id => {
            socket.to(id).emit("user joined", socket.id);
        });

        if (roomState[roomId]) {
            socket.emit("syncVideo", roomState[roomId]);
        }

        io.to(roomId).emit("updateUserList", roomUsers[roomId]);
        console.log(` ${userName || "Utilisateur"} a rejoint la ruche ${roomId}`);
    });

    // Nouvel événement pour demander l'état actuel de la vidéo
    socket.on("requestVideoState", ({ roomId }) => {
        if (roomState[roomId]) {
            socket.emit("currentVideoState", roomState[roomId]);
        }
    });

    // WebRTC signaling events
    socket.on("offer", (payload) => {
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", (payload) => {
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", (payload) => {
        io.to(payload.target).emit("ice-candidate", {
            caller: socket.id,
            candidate: payload.candidate,
        });
    });

    // Handle video sharing stopped event and trigger page refresh for all users in the room
    socket.on("video_sharing_stopped", ({ roomId }) => {
        console.log(`Video sharing stopped in room ${roomId}, sending refresh signal to all users`);
        io.to(roomId).emit("refresh_page");
    });

    //when user enteres the hive (vocal)
    socket.on("join_voice", (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined ${roomId}`);
        const otherUsers = Array.from(io.sockets.adapter.rooms.get(roomId) || []).filter(id => id !== socket.id);
        socket.emit("all_users", otherUsers);// sending the list of users already connected in the hive
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


    //sending webRTC signal to a specific user
    socket.on("sending_signal", ({targetId,signal}) => {
        io.to(targetId).emit("user_signal", {
            signal,
            callerId: socket.id,
        });
    });

    //asnwer the signal
    socket.on("returning_signal", ({ callerId, signal }) => {
        io.to(callerId).emit("receive_returned_signal", {
            signal,
            id: socket.id,
        });
    });


/*
    socket.on("disconnect", () => {
        console.log(" Client déconnecté:", socket.id);
        for (const room in rooms) {
            rooms[room] = rooms[room].filter(id => id !== socket.id);
            if (rooms[room].length === 0) {
                delete rooms[room];
            }
        }
        for (const roomId in roomUsers) {
            roomUsers[roomId] = roomUsers[roomId].filter(user => user.socketId !== socket.id);
        }
        io.emit("user_disconnected", socket.id);
    })
    */

    socket.on("disconnecting", async () => {
        const joinedRooms = Array.from(socket.rooms).filter(r => r !== socket.id);

        for (const roomId of joinedRooms) {
            io.to(roomId).emit("user_left", socket.id);
            console.log(`A user left room ${roomId}`);

            try {
                const hive = await Hive.findOne({ idRoom: roomId });
                if (hive) {
                    const user = hive.users.find(u => u.socketId === socket.id);

                    if (user) {
                        if (user.userId) {
                            io.to(roomId).emit("disconnect_user", user.userId.toString());
                            console.log(`disconnect_user envoyé pour ${user.userId}`);
                        } else {
                            console.log(`Guest disconnected with socketId ${socket.id}`);
                        }
                    }
                }
            } catch (err) {
                console.error("Erreur dans disconnecting:", err);
            }
        }

        try {
            const guestUser = await User.findOne({ socketId: socket.id, isGuest: true });
            if (guestUser && guestUser.startWith("Bee-")) {
                await guestUser.deleteOne();
                console.log(`Guest user ${guestUser.pseudo} supprimé.`);
            }
        } catch (err) {
            console.error("Erreur suppression guest :", err);
        }
    });
})

// Route test
app.get("/", (req, res) => {
    res.send("StudyHive Backend fonctionne !");
});


// Création
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Serveur lancé sur : http://localhost:${PORT}`);
});
