const User = require('../models/User');
const bcrypt = require('bcryptjs')
const generateToken = require('../utils/generateToken');



const registerUser = async (req, res) => {
    const { email, password, pseudo } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'Utilisateur déjà existant' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email,
            pseudo,
            password: hashedPassword
        });

        res.status(201).json({ message: 'Utilisateur créé' });

    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};


const loginUser = async (req, res) => {
    const { email, password } = req.body;

    console.log("Tentative de connexion avec :", email, password);

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log("Utilisateur introuvable");
            return res.status(400).json({ message: 'Utilisateur introuvable' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log("Mot de passe incorrect");
            return res.status(400).json({ message: 'Mot de passe incorrect' });
        }

        res.status(200).json({
            message: 'Connexion réussie',
            token: generateToken(user._id),
        });

    } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};


module.exports = {registerUser, loginUser};
