import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiEye, FiEyeOff } from "react-icons/fi"; // eye open/close
import axios from 'axios';

const RegisterForm = () => {
    const [email, setEmail] = useState('');
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', {
                email,
                pseudo,
                password,
            });

            console.log(res.data);
            alert("Compte créé avec succès !");
        } catch (err) {
            console.error(err.response?.data?.message || err.message);
            alert(err.response?.data?.message || "Erreur lors de l'inscription");
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-[#272525] p-8 rounded-xl shadow-md w-full max-w-md text-white"
        >
            <h2 className="text-2xl font-semibold mb-6">Create an account</h2>

            {/* Email */}
            <div className="mb-4">
                <label className="block mb-1 text-white">Email</label>
                <input
                    type="email"
                    className="w-full p-3 rounded-md bg-transparent border border-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="QueenBee@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            {/* Pseudo */}
            <div className="mb-4">
                <label className="block mb-1 text-white">Pseudo</label>
                <input
                    type="text"
                    className="w-full p-3 rounded-md bg-transparent border border-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Ex: BeeMaster23"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    required
                />
            </div>

            {/* Password */}
            <div className="mb-6 relative">
                <label className="block mb-1 text-white">Password</label>
                <input
                    type={showPwd ? 'text' : 'password'}
                    className="w-full p-3 rounded-md bg-transparent border border-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Enter your password"
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

            {/* Register button */}
            <button
                type="submit"
                className="w-full bg-[#FBBC04] text-black font-semibold py-2 rounded-md mb-4"
            >
                Create account
            </button>

            {/* Google button */}
            <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-[#FBBC04] text-black font-semibold py-2 rounded-md mb-4 hover:bg-yellow-400"
                onClick={() => {
                    window.location.href = "http://localhost:5000/auth/google";
                }}
            >
                <FcGoogle className="text-xl" />
                Continue with Google
            </button>

            {/* Login link */}
            <p className="text-center text-sm text-gray-300">
                Already Have An Account?{' '}
                <a href="/login" className="text-yellow-400 font-medium hover:underline">
                    Log In
                </a>
            </p>
        </form>
    );
};

export default RegisterForm;
