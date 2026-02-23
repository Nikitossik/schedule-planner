import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) {
      setToken(savedToken);
      try {
        const payload = JSON.parse(atob(savedToken.split(".")[1]));
        setUser({ id: payload.sub, role: payload.role });
      } catch {
        logout();
      }
    } else {
      setUser(false);
    }
  }, []);

  const login = async (email, password) => {
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);

    const res = await fetch("http://localhost:8000/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) throw new Error("Login failed");

    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);

    const payload = JSON.parse(atob(data.access_token.split(".")[1]));
    setUser({ id: payload.sub, role: payload.role });

    console.log("initial tokens obtained");
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    window.location.href = "/login";
  };

  const refreshAccessToken = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) throw new Error("No refresh token");

    const res = await fetch("http://localhost:8000/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!res.ok) {
      logout();
      console.log(res);
      throw new Error("Refresh failed");
    }

    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);

    const payload = JSON.parse(atob(data.access_token.split(".")[1]));
    setUser({ id: payload.sub, role: payload.role });

    console.log("new fresh tokens obtained");

    return data.access_token;
  };

  const isAdmin = () => user?.role === "admin";
  const isCoordinator = () => user?.role === "coordinator";

  const canManageUsers = () => isAdmin();

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshAccessToken,
        isAdmin,
        isCoordinator,
        canManageUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
