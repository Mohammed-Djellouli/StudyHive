import react from 'react'
import LoginForm from "../components/auth/LoginForm";


const LoginPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 flex flex-col">
            {/* Header Logo */}
            <header className="p-6">
                <img src="/assets/small-white-logo.png" alt="Logo" className="w-32 " />
            </header>

            {/* Form Content Center */}
            <div className="flex flex-1 justify-center items-center">
                <LoginForm />
            </div>
        </div>
    );
};

export default LoginPage;