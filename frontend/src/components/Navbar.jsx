import React, { useContext, useState, useRef, useEffect } from "react";
import { assets } from "../assets/frontend_assets/assets.js";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShopContext } from "../context/Shopcontext.jsx";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { Logout } from "../api/user";

const NAV_LINKS = [
  { path: "/",           label: "Trang chủ" },
  { path: "/collection", label: "Bộ sưu tập" },
  { path: "/about",      label: "Giới thiệu" },
  { path: "/contact",    label: "Liên hệ" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const profileRef = useRef(null);

  const { setShowSearch, getCartCount, navigate, setCartItems } = useContext(ShopContext);
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    navigate("/");
    const res = await Logout();
    if (res.data.success) {
      setIsAuthenticated(false);
      setCartItems({});
      toast.success("Đăng xuất thành công", { position: "top-center", autoClose: 1500 });
    }
    setProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F5F5DC] shadow-md">
      <div className="flex items-center justify-between py-3 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">

        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img src={assets.logo} className="w-32 sm:w-36" alt="logo" />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center gap-1 md:gap-2 lg:gap-6">
          {NAV_LINKS.map(({ path, label }) => {
            const active = location.pathname === path;
            return (
              <NavLink
                key={path} to={path}
                className={`relative px-2 py-1 text-sm font-medium transition-colors hover:text-[#8B4513] ${
                  active ? "text-[#8B4513]" : "text-[#2C1810]"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#8B4513] rounded-full" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <button onClick={() => setShowSearch(true)} className="hover:opacity-70 transition-opacity">
            <img src={assets.search_icon} alt="tìm kiếm" className="w-5" />
          </button>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => isAuthenticated ? setProfileOpen((v) => !v) : navigate("/login")}
              className="hover:opacity-70 transition-opacity"
              title={isAuthenticated ? "Tài khoản" : "Đăng nhập"}
            >
              <img src={assets.profile_icon} alt="tài khoản" className="w-5" />
            </button>

            {isAuthenticated && profileOpen && (
              <div className="absolute right-0 mt-3 w-44 bg-[#F5F5DC] border border-[#c8a882] rounded-xl shadow-lg py-2 z-50">
                <button
                  onClick={() => { navigate("/my-profile"); setProfileOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#2C1810] hover:bg-[#e8dcc8] transition-colors"
                >
                  👤 Hồ sơ của tôi
                </button>
                <button
                  onClick={() => { navigate("/orders"); setProfileOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#2C1810] hover:bg-[#e8dcc8] transition-colors"
                >
                  📦 Đơn hàng của tôi
                </button>
                <hr className="my-1 border-[#c8a882]" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          <Link to="/cart" className="relative hover:opacity-70 transition-opacity">
            <img src={assets.cart_icon} className="w-5" alt="giỏ hàng" />
            {getCartCount() > 0 && (
              <span className="absolute -right-1.5 -bottom-1.5 w-4 h-4 flex items-center justify-center bg-[#8B4513] text-white rounded-full text-[8px] font-bold">
                {getCartCount() > 99 ? "99+" : getCartCount()}
              </span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(true)} className="sm:hidden hover:opacity-70">
            <img src={assets.menu_icon} alt="menu" className="w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="w-72 bg-[#F5F5DC] h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#c8a882]">
              <img src={assets.logo} className="w-28" alt="logo" />
              <button onClick={() => setMenuOpen(false)} className="text-[#2C1810] text-xl">✕</button>
            </div>

            <nav className="flex flex-col px-4 py-4 gap-1">
              {NAV_LINKS.map(({ path, label }) => (
                <NavLink key={path} to={path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-[#8B4513] text-white" : "text-[#2C1810] hover:bg-[#e8dcc8]"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <hr className="mx-4 border-[#c8a882]" />

            <div className="flex flex-col px-4 py-4 gap-1">
              {isAuthenticated ? (
                <>
                  <button onClick={() => { navigate("/my-profile"); setMenuOpen(false); }}
                    className="px-4 py-3 rounded-lg text-sm text-left text-[#2C1810] hover:bg-[#e8dcc8]">
                    👤 Hồ sơ của tôi
                  </button>
                  <button onClick={() => { navigate("/orders"); setMenuOpen(false); }}
                    className="px-4 py-3 rounded-lg text-sm text-left text-[#2C1810] hover:bg-[#e8dcc8]">
                    📦 Đơn hàng của tôi
                  </button>
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="px-4 py-3 rounded-lg text-sm text-left text-red-600 hover:bg-red-50">
                    🚪 Đăng xuất
                  </button>
                </>
              ) : (
                <button onClick={() => { navigate("/login"); setMenuOpen(false); }}
                  className="px-4 py-3 rounded-lg text-sm font-medium bg-[#8B4513] text-white text-center">
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;