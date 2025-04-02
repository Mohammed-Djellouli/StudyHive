import  React,{ useEffect, useState } from "react";
import Big_Logo_At_Left from "./components/Big_Logo_At_Left/Big_Logo_At_Left";
import Left_Bar from "./components/Left_bar_Icons_members_In_Room/Left_bar_Icons_members_In_Room";
import "./App.css";
function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/") // Fetch data from backend
        .then((res) => res.text())
        .then((data) => setMessage(data));
  }, []);

  return (
      <body>
        <div>
            <Big_Logo_At_Left />
            <Left_Bar/>
            <h1>{message}</h1>
        </div>
      </body>
  );
}

export default App;
