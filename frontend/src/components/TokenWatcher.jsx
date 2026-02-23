import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function TokenWatcher() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, refreshAccessToken, logout } = useAuth();

  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp * 1000; // ms

      const now = Date.now();

      if (now >= exp) {
        refreshAccessToken().catch(() => {
          logout();
          navigate("/login");
        });
      }
    } catch {
      logout();
      navigate("/login");
    }
  }, [location.pathname]); 

  return null;
}
