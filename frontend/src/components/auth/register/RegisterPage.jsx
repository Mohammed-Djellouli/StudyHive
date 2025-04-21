import React from 'react';
import RegisterForm from './RegisterForm';
/*import logoCenter from '/assets/Big_LOGO_2.png';*/
/*import bee from '../assets/bee_without_back_ground.png';*/

const RegisterPage = () => {
    return (
        <div className="min-h-screen flex relative">

            {/* Partie Gauche */}
            <div className="w-1/2 bg-yellow-400 flex justify-start items-center pl-10">
                <div className="bg-gradient-to-b from-black to-transparent bg-clip-text text-transparent">
                    <h1 className="text-4xl font-bold mb-2">
                        Bienvenue dans
                    </h1>
                    <p className="text-3xl italic">
                        votre ruche
                    </p>
                </div>
            </div>



            {/* Partie Droite */}
            <div className="w-1/2 bg-[#272525] flex justify-center items-center relative">
                <RegisterForm />


            </div>

            {/* Abeille */}
            <img
                src="/assets/bee_without_back_ground.png"
                alt="Bee"
                className="absolute top-[70%] bottom-[1%] left-[30%] w-120 h-64 "
            />


            <img
                src="/assets/Big_LOGO_2.png"
                alt="Big Logo"
                className="absolute top-[10%] left-[45.2%] transform -translate-x-1/2 -translate-y-1/2 w-90 z-10"
            />
        </div>
    );
};

export default RegisterPage;
