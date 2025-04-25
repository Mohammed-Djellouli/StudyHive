//this is hiveRoutes
const express = require("express");
const router = express.Router();
const Hive = require("../models/Hive");
const User = require("../models/User");

const HandleHiveCreation = require("../HandleHiveCreation");

// Créer une Hive
router.post("/create", HandleHiveCreation);

// Obtenir une Hive
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

// Rejoindre une Hive
router.post("/join", async (req, res) => {
    const { userId, idRoom } = req.body;

    try {
        const room = await Hive.findOne({ idRoom });
        if (!room) return res.status(404).json({ message: "Room not found" });

        const ownerIdString = room.idOwner?.toString?.() || room.ownerSocketId;

        if (ownerIdString === userId) {
            return res.status(400).json({ message: "Owner is already part of the room" });
        }

// Vérifie proprement sans casser
        const alreadyInRoom = room.users.some(u => {
            if (!u.userId) return false;
            return u.userId.toString() === userId;
        });

        if (!alreadyInRoom) {
            let user = null;
            try {
                user = await User.findById(userId);
            } catch (e) {
                user = null; // Ignore si ce n'est pas un vrai ID
            }

            const controlsDefault = {
                micControl: !room.isQueenBeeMode,
                screenShareControl: !room.isQueenBeeMode,
                videoControl: !room.isQueenBeeMode,
            };

            if (user) {
                // Compte utilisateur existant
                room.users.push({
                    userId: user._id,
                    pseudo: user.pseudo,
                    ...controlsDefault
                });
            } else {
                // Guest utilisateur
                room.users.push({
                    userId: userId,
                    pseudo: `Bee-${Math.floor(1000 + Math.random() * 9000)}`,
                    ...controlsDefault
                });
            }

            await room.save();
        }

        res.status(200).json({ message: "User joined successfully" });


    } catch (err) {
        console.error("Erreur ajout utilisateur :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});


// Mettre à jour les permissions
router.post("/update-permission", async (req, res) => {
    const { idRoom, userId, field, value } = req.body;

    try {
        const room = await Hive.findOne({ idRoom });
        if (!room) return res.status(404).json({ message: "Room not found" });

        const userEntry = room.users.find(u => u.userId.toString() === userId);
        if (!userEntry) return res.status(404).json({ message: "Utilisateur non trouvé dans la Hive" });

        if (!["micControl", "screenShareControl", "videoControl"].includes(field)) {
            return res.status(400).json({ message: "Champ de permission invalide" });
        }

        userEntry[field] = value;
        await room.save();

        res.status(200).json({ success: true, message: "Permission mise à jour." });
    } catch (err) {
        console.error("Erreur update permission :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Supprimer une Hive
router.delete("/delete/:idRoom", async (req, res) => {
    try {
        await Hive.deleteOne({ idRoom: req.params.idRoom });
        res.status(200).json({ message: "Hive supprimée." });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la suppression de la Hive." });
    }
});

module.exports = router;
