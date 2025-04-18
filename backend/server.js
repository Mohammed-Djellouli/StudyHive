
const connectDB = require("./Config/Connexion");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

app.get("/", (req, res) => {
    res.send("StudyHive Backend");
});

app.listen(5000, () => {
    console.log("le server sur : http://localhost:5000");
});
dotenv.config();
connectDB();
