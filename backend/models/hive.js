//this is hive.js
const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
    idRoom: {
        type: Number,
        required: true,
        unique: true
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    timerEndsAt: {
        type: Date,
        default: new Date(Date.now() + 2 * 60 * 60 * 1000)
    },

    idOwner: {
        type: mongoose.Schema.Types.Mixed,
        ref: "User",
        required: false
    },

    ownerSocketId: {
        type:String,
        required: false
    },

    isQueenBeeMode: {
        type: Boolean,
        default: false,
    },

    users: [{
        userId: {
            type:  mongoose.Schema.Types.Mixed,
            ref: "User"
        },
        userSocketId: {
            type: String
        },
        pseudo: {
            type: String,
            required: true
        },
        micControl: {
            type: Boolean,
            default: true
        },
        screenShareControl: {
            type: Boolean,
            default: true
        },
        videoControl: {
            type: Boolean,
            default: true
        }
    }],

});

const Room = mongoose.models.Room || mongoose.model("Room", RoomSchema);
module.exports = Room;
