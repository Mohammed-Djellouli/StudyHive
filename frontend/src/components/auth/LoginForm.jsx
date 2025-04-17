import React, { useState } from 'react';
import axios  from "axios";
import {FiEye, FiEyeOff} from "react-icons/fi";
const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            // Vérifie bien la structure de la réponse
            if (response && response.data) {
                console.log(response.data); // Tu verras { message: "...", token: "..." }
                alert(response.data.message);

                // Stocker le token
                localStorage.setItem('token', response.data.token);
            }

        } catch (error) {
            console.error("Erreur Login :", error);
            alert(error.response?.data?.message || "Erreur serveur");
        }
    };



    return (
        <form className="bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md text-white">
            <h2 className="text-2xl font-semibold mb-6">Connexion</h2>

            <div className="mb-4">
                <label className="block mb-1">Email</label>
                <input
                    type="email"
                    placeholder="QueenBee@gmail.com"
                    className="w-full p-3 rounded-md bg-transparent border border-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div className="mb-6 relative">
                <div className="flex justify-between mb-1">
                    <label>Mot De Passe</label>
                    <a href="#" className="text-sm text-gray-400 hover:text-yellow-400">
                        Oublié ?
                    </a>
                </div>
                <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="entrer votre mot de passe"
                    className="w-full p-3 rounded-md bg-transparent border border-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <span
                    className="absolute right-3 top-10 text-yellow-400 cursor-pointer"
                    onClick={() => setShowPwd(!showPwd)}
                >
                    {showPwd ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </span>
            </div>

            <button
                type="submit"
                onClick={handleSubmit}
                className="w-full bg-yellow-400 text-black font-semibold py-2 rounded-md mb-4 hover:bg-yellow-300"
            >
                se connecter
            </button>

            <p className="text-center text-sm text-gray-400">
                Vous N'avez Pas Un Compte ?{' '}
                <a href="/register" className="text-yellow-400 hover:underline">
                    Inscription
                </a>
            </p>
        </form>
    );
};

export default LoginForm;
