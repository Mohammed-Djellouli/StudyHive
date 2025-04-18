import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import HivePage from "./HivePage";
import App from "./App";
import reportWebVitals from './reportWebVitals';
import LoginPage  from "./pages/LoginPage";
import RegisterPage  from "./pages/RegisterPage";



// Import du Router
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <Router>
            <Routes>
                {/* Page d'accueil */}
                <Route path="/" element={<App />} />

                {/* Page après le bouton "Créer une Ruche" */}
                <Route path="/app" element={<HivePage />} />

                <Route path="/LoginPage" element={<LoginPage />} />
                <Route path="/RegisterPage" element={<RegisterPage />} />
            </Routes>
        </Router>
    </React.StrictMode>
);


reportWebVitals();