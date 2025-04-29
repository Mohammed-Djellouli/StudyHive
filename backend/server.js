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

// Ajout d'une variable globale pour suivre l'état du partage d'écran par room
const screenShareState = {};

// Store playlists in memory (you might want to move this to a database in production)
const roomPlaylists = new Map();

io.on("connection", (socket) => {

    // Quand un utilisateur rejoint une Hive
    socket.on("join_hive_room", ({ roomId, user }) => {
        socket.join(roomId);
        io.to(roomId).emit("user_joined", user);
        console.log(`${user.pseudo} joined room ${roomId}`);
         // Send existing video state if any
         if (roomState[roomId]) {
            socket.emit("syncVideo", roomState[roomId]);
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

    // Handle adding a video to the playlist
    socket.on('add_to_playlist', ({ roomId, videoId, title, url }) => {
        if (!roomPlaylists.has(roomId)) {
            roomPlaylists.set(roomId, []);
        }
        const playlist = roomPlaylists.get(roomId);
        const newVideo = { videoId, title, url };
        
        // Vérifier si la vidéo n'est pas déjà dans la playlist
        if (!playlist.some(video => video.videoId === videoId)) {
            playlist.push(newVideo);
            // Émettre l'événement de mise à jour à tous les clients dans la room
            io.to(roomId).emit('video_added', newVideo);
            io.to(roomId).emit('playlist_updated', playlist);
        }
    });

    // Handle removing a video from the playlist
    socket.on('remove_from_playlist', ({ roomId, videoId }) => {
        if (roomPlaylists.has(roomId)) {
            const playlist = roomPlaylists.get(roomId);
            const updatedPlaylist = playlist.filter(video => video.videoId !== videoId);
            roomPlaylists.set(roomId, updatedPlaylist);
            
            // Émettre les événements de mise à jour
            io.to(roomId).emit('video_removed', { videoId });
            io.to(roomId).emit('playlist_updated', updatedPlaylist);
        }
    });

    // Handle getting the playlist
    socket.on('get_playlist', ({ roomId }) => {
        const playlist = roomPlaylists.get(roomId) || [];
        socket.emit('playlist_updated', playlist);
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
