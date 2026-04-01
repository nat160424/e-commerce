import React, { useContext, useEffect, useState } from "react";
import { assets } from "../assets/frontend_assets/assets.js";
import { Link, NavLink } from "react-router-dom";
import { ShopContext } from "../context/Shopcontext.jsx";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { Logout } from "../api/user";

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const {
    setShowSearch,
    getCartCount,
    navigate,
    setCartItems,
  } = useContext(ShopContext);
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const location = useLocation(); // Get the current location

  const HanleLogout = async () => {
    navigate("/");
    const response = await Logout();
    if (response.data.success) {
      setIsAuthenticated(false);
      setCartItems({});
      toast.success("Logged out successfully", {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
      });
    }
  };

  return (
    <div className="flex justify-between items-center font-medium py-3 shadow-gray-300 shadow-md px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] bg-[#F5F5DC]">
      <Link to="/">
        <img src={assets.logo} className="w-36" alt="logo" />
      </Link>

      <ul className="hidden sm:flex gap-3 md:gap-5 lg:gap-8 text-base">
        {[
          { path: "/", label: "HOME" },
          { path: "/collection", label: "COLLECTION" },
          { path: "/about", label: "ABOUT" },
          { path: "/contact", label: "CONTACT" },
        ].map(({ path, label }) => (
          <div key={path} className="flex flex-col items-center gap-1">
            <NavLink
              to={path}
              className={`font-medium hover:text-[#8B4513] ${
                location.pathname === path ? "text-[#2C1810]" : "text-[#2C1810]"
              }`}
            >
              <p>{label}</p>
            </NavLink>
            <hr
              className={`w-2/4 h-[1.6px] border-none ${
                location.pathname === path ? "bg-[#8B4513]" : "bg-transparent"
              }`}
            />
          </div>
        ))}
      </ul>

      <div className="flex items-center gap-6">
        <img
          onClick={() => setShowSearch(true)}
          src={assets.search_icon}
          alt="searchIcon"
          className="w-5 cursor-pointer hover:opacity-80"
        />
        <div className="relative">
          <img
            onClick={() => { if (!isAuthenticated) navigate("/login"); else setShowProfileMenu(!showProfileMenu); }}
            src={assets.profile_icon}
            alt="profile icon"
            className="w-5 cursor-pointer hover:opacity-80"
          />

          {isAuthenticated && showProfileMenu && (
            <div className="absolute dropdown-menu right-0 pt-4 z-20">
              <div className="flex flex-col gap-2 w-36 py-3 bg-[#F5F5DC] text-[#2C1810] rounded border border-[#8B4513]">
                <p
                  onClick={() => { navigate("/my-profile"); setShowProfileMenu(false); }}
                  className="cursor-pointer hover:text-[#8B4513] px-5"
                >
                  Hồ sơ
                </p>
                <p
                  onClick={() => { navigate("/orders"); setShowProfileMenu(false); }}
                  className="cursor-pointer hover:text-[#8B4513] px-5"
                >
                  Đơn hàng
                </p>
                <p
                  onClick={() => { HanleLogout(); setShowProfileMenu(false); }}
                  className="cursor-pointer hover:text-[#8B4513] px-5"
                >
                  Đăng xuất
                </p>
              </div>
            </div>
          )}
        </div>
        <Link to="/cart" className="relative">
          <img src={assets.cart_icon} className="w-5 min-w-5 hover:opacity-80" alt="cart icon" />
          <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-[#8B4513] text-white rounded-full text-[8px] aspect-square">
            {getCartCount()}
          </p>
        </Link>
        <img
          onClick={() => setVisible(true)}
          src={assets.menu_icon}
          alt="menu icon"
          className="cursor-pointer sm:hidden w-5 hover:opacity-80"
        />
      </div>

      <div
        className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-[#F5F5DC] transition-all ${
          visible ? "w-3/4 duration-500 ease-in-out z-20" : "w-0"
        }`}
      >
        <div className="flex flex-col text-[#2C1810]">
          <div
            onClick={() => setVisible(false)}
            className="flex items-center gap-4 p-3 cursor-pointer hover:text-[#8B4513]"
          >
            <img
              src={assets.dropdown_icon}
              alt="dropdowm icon"
              className="h-4 rotate-180"
            />
            <p>Quay lại</p>
          </div>

          <NavLink
            onClick={() => {
              setVisible(false);
            }}
            to="/"
            className="py-2 pl-6 border-b border-[#8B4513] hover:text-[#8B4513]"
          >
            <p>HOME</p>
          </NavLink>
          <NavLink
            onClick={() => {
              setVisible(false);
            }}
            to="/collection"
            className="py-2 pl-6 border-b border-[#8B4513] hover:text-[#8B4513]"
          >
            <p>COLLECTION</p>
          </NavLink>
          <NavLink
            onClick={() => {
              setVisible(false);
            }}
            to="/about"
            className="py-2 pl-6 border-b border-[#8B4513] hover:text-[#8B4513]"
          >
            <p>ABOUT US</p>
          </NavLink>
          <NavLink
            onClick={() => {
              setVisible(false);
            }}
            to="/contact"
            className="py-2 pl-6 border-b border-[#8B4513] hover:text-[#8B4513]"
          >
            <p>CONTACT</p>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
