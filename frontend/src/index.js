import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from "./App";
import CreationHivePage from "./CreationHivePage";
import reportWebVitals from './reportWebVitals';

// Import du Router
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <Router>
            <Routes>
                {/* Page d'accueil */}
                <Route path="/" element={<CreationHivePage />} />

                {/* Page après le bouton "Créer une Ruche" */}
                <Route path="/app" element={<App />} />
            </Routes>
        </Router>
    </React.StrictMode>
);

reportWebVitals();
