import React, { useContext } from "react";
import { assets } from "../assets/admin_assets/assets.js";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated,logout } = useContext(AuthContext);

  const onLogout = async () => {
    await logout();
  };

  return (
    <div className="flex items-center justify-between py-2 px-[4%] bg-gray-50">
      <Link to="/admin" className="w-[max(10%,110px)]">
        <img src={assets.logo} alt="logo" loading="lazy" />
      </Link>

      <p className="font-bold tracking-wider text-lg">ADMIN PANEL</p>
      <button
        onClick={onLogout}
        className="bg-gray-800 text-white px-5 py-2 sm:py-2 rounded-full text-xs sm:text-sm"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;
