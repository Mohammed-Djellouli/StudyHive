const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false  // 🔥 On le rend facultatif pour Google
    },
    googleId: {
        type: String,
        required: false  // 🔥 Pour les utilisateurs via Google
    }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
