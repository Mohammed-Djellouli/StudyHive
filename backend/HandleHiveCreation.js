const Hive = require("./models/Hive");
const User = require("./models/User");

function generateHiveId(){
    return Math.floor(100000 +Math.random()*900000);
}


const HandleHiveCreation = async (req, res) => {
    try{
        const {userId , mode } = req.body;
        if(!userId || !mode){
            return res.status(400).json({message: "User Id and mode are required"});
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        console.log("Utilisateur trouvé :", user);

        const isQueen = mode.toLowerCase() === "queen";

        const newHive = new Hive({
            idRoom : generateHiveId(),
            createdAt: new Date(),
            timerEndsAt: new Date( Date.now() + 2*60*60*1000), //The limit time for the hive is two hours
            isQueenBeeMode: isQueen,
            idOwner:user._id,
            users:[user._id],
        });

        await newHive.save();


        //On initialise ici les permission apres la creation du Hive
        const Permission = require("./models/Permission");
        const newPermission = new Permission({
            idRoom: newHive._id,
            idOwner: user._id,
            users: newHive.users.map(uid =>({
                userId: uid,
                micEnabled: true,
                screenShareEnabled: true,
                canChangeVideo:true,
            }))
        });

        await newPermission.save();






        res.status(201).json({
            message: "User Created Successfully",
            room: newHive,
            ownerPseudo: user?.pseudo || "Queen Bee", // fallback si pseudo non défini
        });

        console.log("User trouvé :", user);

    }
    catch(err){
        console.error(err);
        res.status(400).json({message: "Error Creating hive"});
    }
};

module.exports = HandleHiveCreation;