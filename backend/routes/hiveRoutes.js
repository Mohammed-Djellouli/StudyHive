const express = require("express");
const router = express.Router();
const Hive = require("../models/Hive");
const User = require("../models/User");


const HandleHiveCreation = require("../HandleHiveCreation");
router.post("/create", HandleHiveCreation);


router.get("/:idRoom", async (req, res) => {
    try {
        const hive = await Hive.findOne({ idRoom: req.params.idRoom })
            .populate("idOwner", "pseudo");

        if (!hive) {
            return res.status(404).json({ message: "Hive not found" });
        }

        res.status(200).json({
            ...hive._doc,
            ownerPseudo: hive.idOwner?.pseudo || null,
        });
    } catch (err) {
        console.error("Erreur serveur GET /api/hive/:idRoom", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

router.post("/join/:roomId", async(req, res) => {
    try{
        const {userId} = req.body;
        const room = await Hive.findOne({idRoom: req.params.roomId})

        if (!room) return res.status(404).json({ message: "Hive non trouvée" });

        if (!room.users.includes(userId)) {
            room.users.push(userId);
            await room.save();
        }
        const user = await User.findById(userId);

        res.status(200).json({
            message: "Utilisateur ajoutée à la ruche",
            userPseudo: user.pseudo,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

module.exports = router;
