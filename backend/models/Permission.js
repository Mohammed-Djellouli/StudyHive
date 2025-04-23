const mongoose = require("mongoose");

const PermissionSchema = new mongoose.Schema({
    idRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    idOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    users: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        micControl: {
            type: Boolean,
            default: true
        },
        screenShareControl: {
            type: Boolean,
            default: true
        },
        VideoControl: {
            type: Boolean,
            default: true
        }
    }]
});

module.exports = mongoose.model("Permission", PermissionSchema);
