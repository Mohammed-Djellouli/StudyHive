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
const roomUsers= {};

io.on("connection", (socket) => {

    // Quand un utilisateur rejoint une Hive
    socket.on("join_hive_room", async ({ roomId, userId }) => { 
        socket.join(roomId);
        socket.userId = userId;

        // Ajouter dans roomUsers
        if (!roomUsers[roomId]) roomUsers[roomId] = [];

        const alreadyInRoom = roomUsers[roomId].some(u => u.userId === userId);
        if (!alreadyInRoom) {
            roomUsers[roomId].push({
                socketId: socket.id,
                userId
            });
        }

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
           if (roomState[roomId]) {
            socket.emit("syncVideo", roomState[roomId]);
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

    // Handle screen share start
    socket.on("screen_share_started", ({ roomId }) => {
        socket.to(roomId).emit("screen_share_update", {
            action: "started",
            userId: socket.id
        });
    });

    // Handle screen share stop
    socket.on("stop_screen_share", ({ roomId }) => {
        socket.to(roomId).emit("screen_share_stopped");
    });

    // Relayer la demande d'offre de partage d'écran
    socket.on("request_screen_share_offer", ({ target }) => {
        io.to(target).emit("request_screen_share_offer", { requester: socket.id });
    });

    // Relayer l'offre de partage d'écran
    socket.on("screen_share_offer", (payload) => {
        io.to(payload.target).emit("screen_share_offer", payload);
    });

   

    socket.on("leave_room", async ({ roomId, userId }) => {
        try {
            const hive = await Hive.findOne({ idRoom: roomId });

            if (hive) {
                const userIndex = hive.users.findIndex(u =>
                    u.userId?.toString() === userId?.toString() || u.userSocketId === userId
                );

                if (userIndex !== -1) {
                    const user = hive.users[userIndex];
                    const idToEmit = user.userId?.toString() || user.userSocketId;

                    hive.users.splice(userIndex, 1); // Retirer de la Hive
                    await hive.save();

                    io.to(roomId).emit("update_users_list", hive.users);
                    io.to(roomId).emit("user_left", idToEmit);
                    console.log(` Utilisateur quitté manuellement : ${idToEmit}`);
                } else {
                    console.log(" User pas trouvé dans Hive lors du leave");
                }
            }
        } catch (error) {
            console.error("Erreur leave_room:", error);
        }
    });



    socket.on("disconnecting", async () => {
        const joinedRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        const userId = socket.userId;


        for (const roomId of joinedRooms) {
            const hive = await Hive.findOne({ idRoom: roomId });
            if (!hive || !userId) return;

            setTimeout(async () => {
                const stillPresent = roomUsers[roomId]?.some(u => u.userId === userId);
                if (stillPresent) {
                    console.log(` ${userId} est revenu, pas supprimé.`);
                    return;
                }

                const refreshedHive = await Hive.findOne({ idRoom: roomId });
                if (!refreshedHive) return;

                const index = refreshedHive.users.findIndex(u =>
                    u.userId?.toString() === userId.toString()
                );

                if (index !== -1) {
                    refreshedHive.users.splice(index, 1);
                    await refreshedHive.save();
                    io.to(roomId).emit("update_users_list", refreshedHive.users);
                    io.to(roomId).emit("user_left", userId);
                    console.log(` Utilisateur supprimé après déco réelle : ${userId}`);
                }
            }, 3000);

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
