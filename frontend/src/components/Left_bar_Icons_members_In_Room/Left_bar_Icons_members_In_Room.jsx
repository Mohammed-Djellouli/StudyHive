import React from 'react';

function LeftBar() {
    return (
        <div className="fixed bottom-[11px]
         left-0 w-[50px] h-[55%] p-[2px] flex
          flex-col justify-end bg-[#ffffff08] rounded-[10px] z-10 ">
            <ul className="flex flex-col items-center justify-between h-full m-0 p-0 list-none">
            <li className="bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center"><img src="/Assets/queen-bee.png" alt="Queen Bee"/></li>
                <li className="bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center"><img src="/Assets/SoloBee2.png" alt="Bee" /></li>
                <li className="bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center"><img src="/Assets/SoloBee2.png" alt="Bee" /></li>
                <li className="bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center"><img src="/Assets/SoloBee2.png" alt="Bee" /></li>
                <li className="bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center"><img src="/Assets/SoloBee2.png" alt="Bee" /></li>
                <li className="bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center"><img src="/Assets/SoloBee2.png" alt="Bee" /></li>
                <li className="bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center"><img src="/Assets/SoloBee2.png" alt="Bee" /></li>
                <li><img className="bg-black/60 rounded-full w-[40px] h-[40px] flex items-center justify-center" src="/Assets/Trois_Point_icon.png" alt="Trois_Point" /></li>
            </ul>
        </div>
    );
}

export default LeftBar;