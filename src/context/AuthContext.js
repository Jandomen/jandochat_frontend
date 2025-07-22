import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser ] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("usuario"));
    if (!stored) return null;

    return {
      ...stored,
      id: stored.id || stored._id, 
    };
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  if (token) {
    //console.log("📥 Token recuperado del localStorage:", token);
  } else {
    //console.log("🚫 No se encontró token en localStorage");
  }
  const login = (token, user) => {
    const normalizedUser = {
      ...user,
      id: user.id || user._id,
    };
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
     setToken(token);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
