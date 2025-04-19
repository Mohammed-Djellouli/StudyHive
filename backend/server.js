const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./Config/connexion");
const passport = require("passport");
const cookieSession = require("cookie-session");

require("./Config/passport");

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

// Route test
app.get("/", (req, res) => {
    res.send("StudyHive Backend fonctionne !");
});

// Création
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Serveur lancé sur : http://localhost:${PORT}`);
});