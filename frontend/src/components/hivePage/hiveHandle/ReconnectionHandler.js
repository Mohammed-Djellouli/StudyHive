import { useState } from 'react';
import socket from '../../../socket';

/**
 * Hook pour gérer la reconnexion socket et WebRTC
 */
const useReconnectionHandler = ({ idRoom, isSharing, startSharing, stopSharing }) => {
  const [reconnecting, setReconnecting] = useState(false);
  
  const handleReconnect = () => {
    if (!idRoom) return;
    
    setReconnecting(true);
    
    // Déconnexion du socket
    socket.disconnect();
    
    setTimeout(() => {
      // Reconnexion
      socket.connect();
      socket.emit("joinRoom", { 
        roomId: idRoom, 
        userName: localStorage.getItem("userPseudo") || "Anonymous" 
      });
      
      setTimeout(() => {
        setReconnecting(false);
        
        // Redémarrer le partage d'écran si nécessaire
        if (isSharing) {
          stopSharing();
          setTimeout(() => {
            startSharing();
          }, 1000);
        }
      }, 2000);
    }, 1000);
  };

  return { reconnecting, handleReconnect };
};

export default useReconnectionHandler; 