const Hive = require("./models/hive");
const User = require("./models/User");
const {Socket} = require("socket.io");

function generateHiveId(){
    return Math.floor(100000 +Math.random()*900000);
}


const HandleHiveCreation = async (req, res) => {
    let guestPseudo;
    try {
        const {userId, mode, socketId} = req.body;
        if (!mode) {
            return res.status(400).json({message: "Mode is required"});
        }

        //console.log("Utilisateur trouvé :", user);
        const isQueen = mode.toLowerCase() === "queen";

        // if user is connected to his account
        if (userId) {
            user = await User.findById(userId);
            if (!user) return res.status(404).json({message: "User not found."});

            const newHive = new Hive({
                idRoom: generateHiveId(),
                createdAt: new Date(),
                timerEndsAt: new Date(Date.now() + 2 * 60 * 60 * 1000), //The limit time for the hive is two hours
                isQueenBeeMode: isQueen,
                idOwner: user._id,
                users: [user._id],
            });

            await newHive.save();

            res.status(201).json({
                message: "User Created Successfully",
                room: newHive,
                ownerPseudo: user?.pseudo || "Queen Bee", // fallback si pseudo non défini
            });

            return


        }
        if (!socketId) {
            return res.status(400).json({message: "Socket is required"});
        }
        //if the user isn't connected to his account

        guestPseudo = `Bee-${Math.floor(1000 + Math.random() * 900)}`;
        const newHive = new Hive({
            idRoom: generateHiveId(),
            createdAt: new Date(),
            timerEndsAt: new Date(Date.now() + 2 * 60 * 60 * 1000), //The limit time for the hive is two hours
            isQueenBeeMode: isQueen,
            idOwner: socketId,
            users: [socketId],
        });

        await newHive.save();
        console.log(`have created successfully name : ${guestPseudo} , id : ${socketId}`);
        res.status(201).json({
            message: "User Created Successfully",
            room: newHive,
            ownerPseudo: guestPseudo,
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({message: "Error Creating hive"});
    }
};

module.exports = HandleHiveCreation;