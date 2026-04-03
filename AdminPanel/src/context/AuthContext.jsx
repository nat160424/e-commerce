import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate    = useNavigate();
  const [user, setUser]                   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  // â”€â”€ Kiá»ƒm tra session hiá»‡n táº¡i + Ä‘áº£m báº£o lÃ  admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const checkAuthValidity = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/user/profile`, {
        withCredentials: true,
      });

      if (res.data.success && res.data.data?.role === "admin") {
        setIsAuthenticated(true);
        setUser(res.data.data);
      } else {
        // ÄÃ£ Ä‘Äƒng nháº­p nhÆ°ng khÃ´ng pháº£i admin
        setIsAuthenticated(false);
        setUser(null);
        if (res.data.success) {
          // CÃ³ session nhÆ°ng khÃ´ng cÃ³ quyá»n â€” logout cookie cho sáº¡ch
          await axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true }).catch(() => {});
        }
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // â”€â”€ ÄÄƒng nháº­p â€” chá»‰ cho phÃ©p role admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const login = async (email, password) => {
    try {
      const loginRes = await axios.post(
        `${backendUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true },
      );

      if (!loginRes.data.success) {
        return { success: false, message: loginRes.data.message || "ÄÄƒng nháº­p tháº¥t báº¡i" };
      }

      // Láº¥y profile Ä‘á»ƒ kiá»ƒm tra role
      const profileRes = await axios.get(`${backendUrl}/api/user/profile`, {
        withCredentials: true,
      });

      if (!profileRes.data.success || profileRes.data.data?.role !== "admin") {
        // KhÃ´ng pháº£i admin â€” há»§y session ngay
        await axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true }).catch(() => {});
        setIsAuthenticated(false);
        setUser(null);
        return { success: false, message: "TÃ i khoáº£n khÃ´ng cÃ³ quyá»n truy cáº­p trang quáº£n trá»‹" };
      }

      setIsAuthenticated(true);
      setUser(profileRes.data.data);
      return { success: true };
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, message: err.response?.data?.message || "ÄÄƒng nháº­p tháº¥t báº¡i" };
    }
  };

  // â”€â”€ ÄÄƒng xuáº¥t â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const logout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true });
    } catch { /* ignore */ }
    setIsAuthenticated(false);
    setUser(null);
    navigate("/");
  };

  // â”€â”€ Láº¥y profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getProfile = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/user/profile`, { withCredentials: true });
      if (res.data.success) setUser(res.data.data);
      return res;
    } catch {
      return { data: { success: false } };
    }
  };

  // â”€â”€ Láº¥y danh sÃ¡ch user (admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/admin/users`, { withCredentials: true });
      return res.data.data || [];
    } catch { return []; }
  };

  useEffect(() => {
    if (isAuthenticated === null) checkAuthValidity();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, setIsAuthenticated, login, logout, getProfile, getUsers }}>
      {children}
    </AuthContext.Provider>
  );
};
