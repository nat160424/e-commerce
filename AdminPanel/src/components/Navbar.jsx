import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/admin_assets/assets.js";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { logout, user } = useContext(AuthContext);

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
      <Link to="/admin" className="flex items-center gap-3">
        <img src={assets.logo} alt="logo" className="w-28" loading="lazy" />
        <span className="hidden sm:block text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          ADMIN
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {user.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <span className="text-sm text-gray-700 font-medium">{user.name}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          🚪 Đăng xuất
        </button>
      </div>
    </header>
  );
};

export default Navbar;