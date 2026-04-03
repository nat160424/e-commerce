import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin",                icon: "📊", label: "Dashboard" },
  { to: "/admin/orders",         icon: "📦", label: "Đơn hàng" },
  { to: "/admin/users",          icon: "👤", label: "Người dùng" },
  { to: "/admin/list-items",     icon: "📋", label: "Sản phẩm" },
  { to: "/admin/add-item",       icon: "➕", label: "Thêm sản phẩm" },
  { to: "/admin/api-management", icon: "🔌", label: "Quản lý API" },
];

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  return (
    <aside className="w-[220px] min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* User info */}
      {user && (
        <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <span className="mt-2 inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            Quản trị viên
          </span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">Admin Panel v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
