import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import HivePage from "./HivePage";
import App from "./App";
import reportWebVitals from './reportWebVitals';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess"; // <<< ajoute ça

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/app" element={<HivePage />} />
                <Route path="/LoginPage" element={<LoginPage />} />
                <Route path="/RegisterPage" element={<RegisterPage />} />
                <Route path="/google-auth-success" element={<GoogleAuthSuccess />} />

            </Routes>
        </Router>
);

reportWebVitals();
