const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res) => {
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
            expiresIn: "30d"
        });

        console.log("TOKEN GÉNÉRÉ :", token);
        console.log("PSEUDO :", req.user.pseudo);
        console.log("ID :", req.user._id);

        const redirectUrl = `https://studyhive-frontend.onrender.com/google-auth-success?token=${token}&pseudo=${encodeURIComponent(req.user.pseudo)}&userId=${req.user._id}`;

        res.redirect(redirectUrl);

    }
);



module.exports = router;
