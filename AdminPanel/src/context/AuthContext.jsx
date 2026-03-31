import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  // Kiểm tra token còn hợp lệ
  const checkAuthValidity = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/user/profile`, {
        withCredentials: true,
      });

      if (response.data.success === false) {
        toast.warning("Session expired. Please log in again.", {
          position: "top-center",
          autoClose: 1500,
        });
        setIsAuthenticated(false);
        setUser(null);
       // navigate("/admin/login");
      } else {
        setIsAuthenticated(true);
        setUser(response.data.data);
      }
    } catch (error) {
      console.error("Auth verification failed:", error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // LOGIN
  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      if (response.data.success === true) {
        // Lấy profile ngay sau khi login
        const profile = await getProfile();
        setIsAuthenticated(true);
        setUser(profile);
        return { success: true, data: profile };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, message: "Login failed" };
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      setIsAuthenticated(false);
      setUser(null);
      navigate("/admin/login");
      if (response.data.success !== true) {
        toast.error("Logout failed");
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      navigate("/admin/login");
      console.error("Logout failed:", error);
    }
  };

  // GET PROFILE
  const getProfile = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/user/profile`, {
        withCredentials: true,
      });
      if (response.data.success === true) {
        setUser(response.data.data);
        return response;
      } else {
        setUser(null);
        return response;
      }
    } catch (error) {
      console.error("Get profile failed:", error);
      setUser(null);
      return { success: false };
    }
  };

  useEffect(() => {
    if (isAuthenticated === null) {
      checkAuthValidity();
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        getProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};