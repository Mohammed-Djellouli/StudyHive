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
        type:String,
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
        type : String,
        required: true
    },
    isQueenBeeMode: {
        type: Boolean,
        default: false,
    }

});

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
