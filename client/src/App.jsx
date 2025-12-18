import { useState, useEffect } from "react";
import userManager from "./config/authConfig.js";
import api from "./config/axiosConfig.js";

function App() {
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    userManager.getUser().then((user) => {
      if (user) {
        setUser(user);
      }
    });
  }, []);

  const handleLogin = () => {
    userManager.signinRedirect();
  };

  const handleLogout = () => {
    userManager.signoutRedirect();
  };

  const handleFetchApi = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập trước!");
      return;
    }

    const data = await api.get("/api");
    
    setMessage(data.data.message);
  };

  if (window.location.pathname === "/callback") {
    userManager.signinRedirectCallback().then((user) => {
      window.location.href = "/";
    });
    return <p>Đang đăng nhập...</p>;
  }
  
  return (
    <div className="App">
      <header className="App-header">
        {user ? (
          <div>
            <p>Xin chào, {user.profile.preferred_username}</p>
            <button onClick={handleLogout}>Đăng xuất</button>
            <button onClick={handleFetchApi}>Gọi API (Test DPoP)</button>
          </div>
        ) : (
          <button onClick={handleLogin}>Đăng nhập với Keycloak</button>
        )}
        <p>Data từ server: {message || "Đang tải..."}</p>
      </header>
    </div>
  );
}

export default App;
