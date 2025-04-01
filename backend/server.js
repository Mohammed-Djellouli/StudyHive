const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Define a sample User schema
const UserSchema = new mongoose.Schema({
    name: String,
});

const User = mongoose.model("User", UserSchema);

// ✅ Test routes
app.get("/", (req, res) => {
    res.send("StudyHive Backend with MongoDB");
});

app.get("/api/users", async (req, res) => {
    const users = await User.find();
    res.json(users);
});

app.post("/api/users", async (req, res) => {
    const user = new User({ name: req.body.name });
    await user.save();
    res.json(user);
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
