import { useEffect } from 'react';
import socket from '../socket';

/**
 * Composant pour le chargement des données de la ruche
 * Se charge de récupérer les informations de la ruche depuis l'API
 * et rejoindre la room socket
 */
const HiveDataLoader = ({ idRoom, setOwnerPseudo, setIsQueenBeeMode, setTimerEndsAt, setUsers, setOwnerId }) => {
  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/hive/${idRoom}`)
      .then(res => res.json())
      .then(data => {
        console.log("ROOM :", data);
        setOwnerPseudo(data.ownerPseudo);
        setIsQueenBeeMode(data.isQueenBeeMode);
        setTimerEndsAt(data.timerEndsAt);
        setUsers(data.users);
        setOwnerId(data.idOwner);
      })
      .catch(err => console.error("Erreur lors du chargement des données de la ruche:", err));

    // Rejoindre la room socket
    socket.emit("joinRoom", { 
      roomId: idRoom, 
      userName: localStorage.getItem("userPseudo") || "Anonymous" 
    });
  }, [idRoom, setOwnerPseudo, setIsQueenBeeMode, setTimerEndsAt, setUsers, setOwnerId]);

  return null;
};

export default HiveDataLoader; 