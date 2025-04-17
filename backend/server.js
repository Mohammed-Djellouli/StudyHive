const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/connexion");
const passport = require("passport");
const cookieSession = require("cookie-session");

dotenv.config();
require("./config/passport"); // configuration de GoogleStrategy

const app = express();

// Connexion MongoDB
connectDB();

//  Middlewares
app.use(cors());
app.use(express.json());

app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000, // 1 jour
    keys: ["studyhive_session_key"]
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoutes = require("./routes/authRoutes");
const authGoogleRoutes = require("./routes/authGoogle");

app.use("/api/auth", authRoutes);       // Auth classique (register/login)
app.use("/auth", authGoogleRoutes);     // Google OAuth2

// Route de test
app.get("/", (req, res) => {
    res.send(" StudyHive Backend fonctionne !");
});

// Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Serveur lancé sur : http://localhost:${PORT}`);
});
