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

        console.log("✅ TOKEN GÉNÉRÉ :", token);

        res.redirect(`http://localhost:3000/google-auth-success?token=${token}`);
    }
);



module.exports = router;
