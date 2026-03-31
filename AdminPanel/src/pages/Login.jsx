import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Zoom } from "react-toastify";
import { AuthContext } from "../context/AuthContext";

const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "";
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setIsAuthenticated, login, getProfile } = useContext(AuthContext);

  useEffect(() => {
    if (adminEmail && adminPassword) {
      setEmail(adminEmail);
      setPassword(adminPassword);
    }
  }, []);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const loginResponse = await login(email, password);
      const profileResponse = await getProfile();
      if (profileResponse?.data?.data?.role !== "admin") {
        setIsAuthenticated(false);
        toast.error("You are not authorized to access this page", {
          position: "top-center",
          autoClose: 1500,
          transition: Zoom,
        });
        return;
      }
      if (loginResponse?.data?.success && profileResponse?.data?.success) {
        setIsAuthenticated(true);
        navigate("/admin");
        setEmail("");
        setPassword("");
        toast.success("Login successful!", {
          position: "top-center",
          autoClose: 1500,
          transition: Zoom,
        });
      }
    } catch (error) {
      setIsAuthenticated(false);
      toast.error("Login failed", {
        position: "top-center",
        autoClose: 1500,
        transition: Zoom,
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={onSubmitHandler}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-semibold">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-700"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
