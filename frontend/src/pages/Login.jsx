import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/Shopcontext";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Login, Register } from "../api/user";

const HandleLogin = () => {
  const {isAuthenticated, setIsAuthenticated} = useContext(AuthContext);
  const [currentState, setCurrentState] = useState("Login");
  const {navigate, backendUrl } = useContext(ShopContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const location = useLocation();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsButtonDisabled(true);
    try {
      const payload =
        currentState === "Sign Up"
          ? { name, email, password }
          : { email, password };

      const response = currentState === "Sign Up" 
        ? await Register(payload)
        : await Login(payload);

      if (response.data.success) {
        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: false,
        });
        setIsAuthenticated(true);
      } else {
        //console.log(response);
        toast.error(response.data.message || "Login failed!", {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    } catch (error) {
      toast.error(error.response.data.message, {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setIsButtonDisabled(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from || "/";
      setTimeout(() => {
        navigate(redirectTo);
      }, 1200);
    }
  }, [navigate, location.state, isAuthenticated]);

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white rounded-xl p-10 mt-10 w-full max-w-lg">
        <h2 className="text-3xl montserrat-regular text-center text-[#8B4513] mb-10">
          {currentState === "Login" ? "Chào mừng trở lại!" : "Tạo tài khoản"}
        </h2>
        <form onSubmit={onSubmitHandler} className="space-y-5">
          {currentState === "Sign Up" && (
            <div className="relative">
              <FaUser className="absolute top-4 left-3 text-gray-500" />
              <input
                type="text"
                placeholder="Họ và tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-md"
                required
                autoComplete="true"
              />
            </div>
          )}
          <div className="relative">
            <FaEnvelope className="absolute top-4 left-3 text-gray-500" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-md"
              required
              autoComplete="true"
            />
          </div>
          <div className="relative">
            <FaLock className="absolute top-4 left-3 text-gray-500" />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-md"
              required
              autoComplete="true"
            />
          </div>

          {/* Forgot Password Link */}
          {currentState === "Login" && (
            <div className="text-left">
              <Link
                to="/forgot-password"
                className="text-[#8B4513] hover:text-[#2C1810] font-semibold cursor-pointer hover:underline"
              >
                Quên mật khẩu? <p className="text-xs text-gray-500">(Đang phát triển)</p>
              </Link>
            </div>
          )}

          <button
            type="submit"
            className={`w-full bg-[#8B4513] hover:bg-[#2C1810] text-white py-3 rounded-lg font-semibold text-lg transition duration-300 ${
              isButtonDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#2C1810]"
            }`}
            disabled={isButtonDisabled}
          >
            {currentState === "Login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>
        <div className="text-center mt-6">
          <p className="text-gray-700">
            {currentState === "Login"
              ? "Chưa có tài khoản? "
              : "Đã có tài khoản? "}
            <span
              className="text-[#8B4513] hover:text-[#2C1810] font-semibold cursor-pointer hover:underline"
              onClick={() =>
                setCurrentState(currentState === "Login" ? "Sign Up" : "Login")
              }
            >
              {currentState === "Login" ? "Tạo tài khoản" : "Đăng nhập"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HandleLogin;
