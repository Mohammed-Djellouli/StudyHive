import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import Dashboard from "./pages/Dashboard";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/google-auth-success" element={<GoogleAuthSuccess />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/"
                    element={<div style={{ padding: '2rem', textAlign: 'center' }}>
                        <h1>Bienvenue sur StudyHive</h1>
                        <a href="/login" style={{ color: 'blue' }}>Connexion</a>
                    </div>}
                />
            </Routes>
        </Router>
    );




export default App;

