const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/github",
    passport.authenticate("github", { scope: ["user:email"] })
);

router.get("/github/callback",
    passport.authenticate("github", { session: false }),
    (req, res) => {
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
            expiresIn: "30d"
        });

        console.log("TOKEN GÉNÉRÉ (GitHub):", token);
        console.log("PSEUDO :", req.user.pseudo);
        console.log("ID :", req.user._id);

        const redirectUrl = `http://localhost:3000/github-auth-success?token=${token}&pseudo=${encodeURIComponent(req.user.pseudo)}&userId=${req.user._id}`;

        res.redirect(redirectUrl);
    }
);

module.exports = router;
