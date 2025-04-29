const Hive = require("./models/Hive");
const User = require("./models/User");
const {Socket} = require("socket.io");

function generateHiveId(){
    return Math.floor(100000 +Math.random()*900000);
}


const HandleHiveCreation = async (req, res) => {
    let guestPseudo;
    try {
        const {userId, mode, socketId ,userPseudo  } = req.body;
        if (!mode) {
            return res.status(400).json({message: "Mode is required"});
        }

        //console.log("Utilisateur trouvé :", user);
        const isQueen = mode.toLowerCase() === "queen";

        const controlsDefault = {
            micControl: !isQueen,
            screenShareControl: !isQueen,
            videoControl: !isQueen
        };

        let newHive;


        // if user is connected to his account
        if (userId) {
            user = await User.findById(userId);
            if (!user) return res.status(404).json({message: "User not found."});

            newHive = new Hive({
                idRoom: generateHiveId(),
                createdAt: new Date(),
                timerEndsAt: new Date(Date.now() + 2 * 60 * 60 * 1000), //The limit time for the hive is two hours
                isQueenBeeMode: isQueen,
                idOwner: user._id,
                ownerSocketId: socketId,
                users: [{
                    userId: user._id,
                    userSocketId: socketId,
                    pseudo: user.pseudo,
                    ...controlsDefault
                }],
            });
            //Just for passing all rules true for Queen when we are in QueenBeeMode
            newHive.users = newHive.users.map(u => {
                const isOwner = u.userId.toString() === newHive.idOwner._id.toString();
                return {
                    ...u,
                    micControl: isOwner ? true : u.micControl,
                    screenShareControl: isOwner ? true : u.screenShareControl,
                    videoControl: isOwner ? true : u.videoControl
                };
            });
            await newHive.save();

            res.status(201).json({
                message: "Hive Created Successfully",
                room: {
                    idRoom: newHive.idRoom,
                    idOwner: newHive.idOwner,
                    ownerPseudo: user?.pseudo || "Queen Bee",
                    isQueenBeeMode: newHive.isQueenBeeMode,
                    timerEndsAt: newHive.timerEndsAt,
                    users: newHive.users,
                    createdAt: newHive.createdAt,
                    videos: newHive.videos,
                }
            });


            return


        }
        if (!socketId) {
            return res.status(400).json({message: "Socket is required"});
        }
        //if the user isn't connected to his account

        guestPseudo = `Bee-${Math.floor(1000 + Math.random() * 900)}`;
        guestPseudo = guestPseudo.toString()
         newHive = new Hive({
            idRoom: generateHiveId(),
            createdAt: new Date(),
            timerEndsAt: new Date(Date.now() + 2 * 60 * 60 * 1000), //The limit time for the hive is two hours
            isQueenBeeMode: isQueen,
            ownerSocketId: socketId,
            users: [{
                _id: socketId,
                userId: socketId,
                pseudo: guestPseudo,
                ...controlsDefault
            }],
        });
        newHive.users = newHive.users.map(user => {
            if (user.pseudo === guestPseudo) {
                return {
                    ...user,
                    micControl: true,
                    screenShareControl: true,
                    videoControl: true
                };
            }
            return user;
        });


        await newHive.save();
        console.log(`have created successfully name : ${guestPseudo} , id : ${socketId}`);
        res.status(201).json({
            message: "Hive Created Successfully",
            room: {
                idRoom: newHive.idRoom,
                idOwner: newHive.ownerSocketId,
                ownerPseudo: guestPseudo,
                isQueenBeeMode: newHive.isQueenBeeMode,
                timerEndsAt: newHive.timerEndsAt,
                users: newHive.users,
                createdAt: newHive.createdAt,
                videos: newHive.videos,
            }
        });


    } catch (err) {
        console.error(err);
        res.status(400).json({message: "Error Creating hive"});
    }
};

module.exports = HandleHiveCreation;