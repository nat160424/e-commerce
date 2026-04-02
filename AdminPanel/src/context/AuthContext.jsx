import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate    = useNavigate();
  const [user, setUser]                   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const backendUrl =  "http://localhost:8081";

  // ── Kiểm tra session hiện tại + đảm bảo là admin ────────────────────────
  const checkAuthValidity = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/user/profile`, {
        withCredentials: true,
      });

      if (res.data.success && res.data.data?.role === "admin") {
        setIsAuthenticated(true);
        setUser(res.data.data);
      } else {
        // Đã đăng nhập nhưng không phải admin
        setIsAuthenticated(false);
        setUser(null);
        if (res.data.success) {
          // Có session nhưng không có quyền — logout cookie cho sạch
          await axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true }).catch(() => {});
        }
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // ── Đăng nhập — chỉ cho phép role admin ─────────────────────────────────
  const login = async (email, password) => {
    try {
      const loginRes = await axios.post(
        `${backendUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true },
      );

      if (!loginRes.data.success) {
        return { success: false, message: loginRes.data.message || "Đăng nhập thất bại" };
      }

      // Lấy profile để kiểm tra role
      const profileRes = await axios.get(`${backendUrl}/api/user/profile`, {
        withCredentials: true,
      });

      if (!profileRes.data.success || profileRes.data.data?.role !== "admin") {
        // Không phải admin — hủy session ngay
        await axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true }).catch(() => {});
        setIsAuthenticated(false);
        setUser(null);
        return { success: false, message: "Tài khoản không có quyền truy cập trang quản trị" };
      }

      setIsAuthenticated(true);
      setUser(profileRes.data.data);
      return { success: true };
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, message: err.response?.data?.message || "Đăng nhập thất bại" };
    }
  };

  // ── Đăng xuất ────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true });
    } catch { /* ignore */ }
    setIsAuthenticated(false);
    setUser(null);
    navigate("/");
  };

  // ── Lấy profile ─────────────────────────────────────────────────────────
  const getProfile = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/user/profile`, { withCredentials: true });
      if (res.data.success) setUser(res.data.data);
      return res;
    } catch {
      return { data: { success: false } };
    }
  };

  // ── Lấy danh sách user (admin) ──────────────────────────────────────────
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