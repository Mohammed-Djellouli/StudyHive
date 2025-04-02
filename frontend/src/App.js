import { useEffect, useState } from "react";
import ChatBox from "./components/Chat/chatBox";

function App() {
    /**
     *   const [message, setMessage] = useState("");
     *
     *   useEffect(() => {
     *     fetch("http://localhost:5000/") // Fetch data from backend
     *         .then((res) => res.text())
     *         .then((data) => setMessage(data));
     *   }, []);
     */


  return (
      <div className="App">
          <ChatBox />
      </div>
  );
}

export default App;

