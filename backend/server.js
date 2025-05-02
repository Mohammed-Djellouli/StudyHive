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
const Hive = require("./models/hive");
const User = require("./models/User");

app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoutes = require("./routes/authRoutes");
const authGoogleRoutes = require("./routes/authGoogle");
const authGithubRoutes = require("./routes/authGithub");
const Room = require("./models/hive");

app.use("/api/auth", authRoutes);
app.use("/auth", authGoogleRoutes);
app.use("/auth", authGithubRoutes);

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



// Ajout d'une variable globale pour suivre l'état du partage d'écran par room
const screenShareState = {};
const disconnectedUsers = new Map();

// Store playlists in memory (you might want to move this to a database in production)
const roomPlaylists = new Map();




io.on("connection", (socket) => {
    socket.on("join_whiteboard", (roomId) => {
        socket.join(roomId);
    });
    socket.data.hiveRoomId = null;

    socket.on("register_identity", ({ userId }) => {
        if (userId) {
            socket.userId = userId;
            console.log(`register_identity: userId ${userId} enregistré pour socket ${socket.id}`);
        } else {
            console.warn(`register_identity sans userId (socket ${socket.id})`);
        }
    });


    // Quand un utilisateur rejoint une Hive
    socket.on("join_hive_room", async ({ roomId, userId, isRefreshing }) => {
        if (!userId) {
            //console.warn(" join_hive_room appelé sans userId → socket ignoré");
            return;
        }
        //console.log(" join_hive_room reçu avec:", { roomId, userId });
        socket.join(roomId);
        socket.data.hiveRoomId = roomId;

        if (disconnectedUsers.has(userId)) {
            clearTimeout(disconnectedUsers.get(userId));
            disconnectedUsers.delete(userId);
            console.log(` ${userId} est revenu → suppression annulée`);
        }




         // Send existing video state if any
         if (roomState[roomId]) {
            socket.emit("syncVideo", roomState[roomId]);
        }


        socket.userId = userId;
        socket.userSocketId = userId;

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

    socket.on("draw", ({ roomId, ...data }) => {
        socket.to(roomId).emit("draw", data);
    });

    socket.on("changeBrushSize", ({ roomId, size }) => {
        socket.to(roomId).emit("changeBrushSize", size);
    });

    socket.on("clear", (roomId) => {
        socket.to(roomId).emit("clear");
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
        socket.data.hiveRoomId = roomId;
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


    socket.on("update_mic_permission", async ({ targetUserPseudo, allowMic }) => {
        console.log(`Received update_mic_permission from socket ${socket.id} for ${targetUserPseudo}: ${allowMic}`);
        const roomId = socket.data.hiveRoomId;
        console.log("room id saved in socket is : ",socket.data.hiveRoomId);
        console.log("room id saved is : ", roomId);
        if (!roomId) return;

        try {
            const room = await Room.findOne({ idRoom: roomId });
            console.log("room id is : ",room);
            if (!room) return;

            const user = room.users.find(u => u.pseudo === targetUserPseudo);
            if (user) {
                user.micControl = allowMic;
                await room.save();

                //send update to users
                io.to(roomId.toString()).emit("mic_permission_updated", {
                    userId: user.userId,
                    micControl: allowMic
                });
            }
            console.log(`Emitting mic_permission_updated for user ${user.userId} with micControl: ${allowMic}`);

        } catch (err) {
            console.error("Failed to update mic permission:", err);
        }
    });

    // Gestionnaire pour la mise à jour des permissions de partage d'écran
    socket.on("update_screen_share_permission", async ({ targetUserPseudo, allowScreenShare }) => {
        const roomId = socket.data.hiveRoomId;
        if (!roomId) return;

        try {
            const room = await Room.findOne({ idRoom: roomId });
            if (!room) return;

            const user = room.users.find(u => u.pseudo === targetUserPseudo);
            if (user) {
                user.screenShareControl = allowScreenShare;
                await room.save();

                // Envoyer la mise à jour à tous les utilisateurs
                io.to(roomId.toString()).emit("screen_share_permission_updated", {
                    userId: user.userId,
                    screenShareControl: allowScreenShare
                });
            }
            console.log(`Screen share permission updated for user ${user.userId}: ${allowScreenShare}`);

        } catch (err) {
            console.error("Failed to update screen share permission:", err);
        }
    });

    // Gestionnaire pour la mise à jour des permissions de contrôle vidéo
    socket.on("update_video_permission", async ({ targetUserPseudo, allowVideo }) => {
        const roomId = socket.data.hiveRoomId;
        if (!roomId) return;

        try {
            const room = await Room.findOne({ idRoom: roomId });
            if (!room) return;

            const user = room.users.find(u => u.pseudo === targetUserPseudo);
            if (user) {
                user.videoControl = allowVideo;
                await room.save();

                // Envoyer la mise à jour à tous les utilisateurs
                io.to(roomId.toString()).emit("video_permission_updated", {
                    userId: user.userId,
                    videoControl: allowVideo
                });
            }
            console.log(`Video permission updated for user ${user.userId}: ${allowVideo}`);

        } catch (err) {
            console.error("Failed to update video permission:", err);
        }
    });

    // Handle screen share start
    socket.on("screen_share_started", ({ roomId }) => {
        screenShareState[roomId] = socket.id;
        socket.to(roomId).emit("screen_share_update", {
            action: "started",
            userId: socket.id
        });
    });

    // Handle screen share stop
    socket.on("stop_screen_share", ({ roomId }) => {
        delete screenShareState[roomId];
        socket.to(roomId).emit("screen_share_stopped");
    });

    // Synchronisation de l'état du partage d'écran
    socket.on("request_screen_share_status", ({ roomId }) => {
        const sharerId = screenShareState[roomId];
        socket.emit("screen_share_status", {
            isSharing: !!sharerId,
            sharerId: sharerId || null
        });
    });

    // Relayer la demande d'offre de partage d'écran
    socket.on("request_screen_share_offer", ({ target }) => {
        io.to(target).emit("request_screen_share_offer", { requester: socket.id });
    });

    // Relayer l'offre de partage d'écran
    socket.on("screen_share_offer", (payload) => {
        io.to(payload.target).emit("screen_share_offer", payload);
    });


    socket.on('get_playlist', ({ roomId }) => {
        if (!roomId) {
            //console.warn('get_playlist: roomId is undefined');
            return;
        }
    
        const playlist = roomPlaylists.get(roomId) || [];
        socket.emit('playlist_updated', playlist);
    });
    
    socket.on('add_to_playlist', ({ roomId, videoId, title, url }) => {
        if (!roomId || !videoId || !title || !url) {
            console.error('add_to_playlist: Missing data', { roomId, videoId, title, url });
            return;
        }
    
        if (!roomPlaylists.has(roomId)) {
            roomPlaylists.set(roomId, []);
        }
    
        const playlist = roomPlaylists.get(roomId);
        const exists = playlist.some(v => v.videoId === videoId);
        if (!exists) {
            const newVideo = { videoId, title, url };
            playlist.push(newVideo);
            io.to(roomId).emit('video_added', newVideo);
            io.to(roomId).emit('playlist_updated', playlist);
        } else {
            console.log(`[add_to_playlist] Video already exists in room ${roomId}`);
        }
    });
    
    socket.on('remove_from_playlist', ({ roomId, videoId }) => {
        if (!roomPlaylists.has(roomId)) return;
        const updated = roomPlaylists.get(roomId).filter(v => v.videoId !== videoId);
        roomPlaylists.set(roomId, updated);
        io.to(roomId).emit('video_removed', { videoId });
        io.to(roomId).emit('playlist_updated', updated);
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
        //console.log(` ######################################################[DECO] Utilisateur en déconnexion: ${socket.userId} (socket: ${socket.id})`);

        const joinedRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        const userId = socket.userId;


        for (const roomId of joinedRooms) {
            const hive = await Hive.findOne({ idRoom: roomId });
            if (!hive || !userId) return;

            if (roomUsers[roomId]) {
                roomUsers[roomId] = roomUsers[roomId].filter(u => u.userId !== userId);
            }

            const timeoutId = setTimeout(async () => {
                const stillPresent = roomUsers[roomId]?.some(u => u.userId === userId);
                if (stillPresent) {
                    console.log(` ${userId} est revenu à temps.`);
                    return;
                }

                const refreshedHive = await Hive.findOne({ idRoom: roomId });
                if (!refreshedHive) return;

                const index = refreshedHive.users.findIndex(u =>
                    (u.userId && u.userId.toString() === userId?.toString()) ||
                    (u.userSocketId && u.userSocketId === userId)
                );

                if (index !== -1) {
                    refreshedHive.users.splice(index, 1);
                    await refreshedHive.save();
                    io.to(roomId).emit("update_users_list", refreshedHive.users);
                    io.to(roomId).emit("user_left", userId);
                    console.log(` Utilisateur retiré définitivement : ${userId}`);
                }

                if (roomUsers[roomId]) {
                    roomUsers[roomId] = roomUsers[roomId].filter(u => u.userId !== userId);
                }


                disconnectedUsers.delete(userId);
            }, 6000); // 6 secondes


            disconnectedUsers.set(userId, timeoutId);
        }
    });

    socket.on("user_speaking", ({roomId,userId,speaking}) => {
        io.to(roomId).emit("user_speaking_status", {userId,speaking});
    });


})

// Route test
app.get("/", (req, res) => {
    res.send("StudyHive Backend fonctionne !");
});




// Création
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO server ready for connections`);
});
