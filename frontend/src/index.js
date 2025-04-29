import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import HivePage from "./HivePage";
import App from "./App";
import reportWebVitals from './reportWebVitals';
import LoginPage from "./components/auth/login/LoginPage";
import RegisterPage from "./components/auth/register/RegisterPage";
import GoogleAuthSuccess from "./components/auth/GoogleAuthSuccess";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import JoinHive from "./components/hivePage/hiveHandle/JoinHive";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/hive/:idRoom" element={<HivePage />} />
                <Route path="/join/:idRoom" element={<JoinHive />} />
                <Route path="/LoginPage" element={<LoginPage />} />
                <Route path="/RegisterPage" element={<RegisterPage />} />
                <Route path="/google-auth-success" element={<GoogleAuthSuccess />} />

            </Routes>
        </Router>
);

reportWebVitals();
