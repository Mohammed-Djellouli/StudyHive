import React, { useState } from 'react';
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
                email,
                password
            });

            if (response && response.data) {
                console.log(response.data);
                alert(response.data.message);

                localStorage.setItem('token', response.data.token);
                localStorage.setItem("userId", response.data.user._id);
                localStorage.setItem("userPseudo", response.data.user.pseudo);

                navigate("/"); // Redirection vers la page d'accueil après connexion
            }

        } catch (error) {
            console.error("Erreur Login :", error);
            alert(error.response?.data?.message || "Erreur serveur");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md text-white">
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
                    <button
                        type="button"
                        className="text-sm text-gray-400 hover:text-yellow-400"
                        onClick={() => alert("Fonctionnalité à venir")}
                    >
                        Oublié ?
                    </button>
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
                className="w-full bg-yellow-400 text-black font-semibold py-2 rounded-md mb-4 hover:bg-yellow-300"
            >
                se connecter
            </button>

            <p className="text-center text-sm text-gray-400">
                Vous N'avez Pas Un Compte ?{' '}
                <Link to="/RegisterPage" className="text-yellow-400 hover:underline">
                    Inscription
                </Link>
            </p>
        </form>
    );
};

export default LoginForm;
