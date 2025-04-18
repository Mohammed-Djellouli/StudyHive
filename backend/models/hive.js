const mongoose = require("mongoose");


const RoomSchema = new mongoose.Schema({
    idRoom:{
        type: Number,
        required: true,
        unique: true
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],

    videos: [{
        videoId: String,
        title: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    }],
    timerEndsAt:{
        type: Date,
        default: new Date(Date.now()+2*60*60*1000)
    },
    idOwner :{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    iSQueenBeeMode :{
      type : Boolean,
      default: false,
    }
});

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
