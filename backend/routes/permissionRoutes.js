const express = require("express");
const router = express.Router();
const Permission = require("../models/Permission");

router.post("/update", async (req, res) => {
    const {roomId, userId, field, value } = req.body;

    try{
        const updated = await Permission.updateOne(
            {idRoom: roomId, "users.userId": userId},
            {$set:{[`users.$.${field}`]: value}}
        );
        res.json({success: true, updated});
    }
    catch(err){
        console.error(err);
        res.status(500).json({message: 'Error server'});
    }
});
module.exports = router;