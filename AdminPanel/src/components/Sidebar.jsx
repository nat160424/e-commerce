import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaPlus,
  FaList,
  FaShoppingCart,
  FaUsers,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return (
    <div className="w-[20%] min-h-screen bg-white shadow-md border-r border-gray-200 p-5">
      {/* Navigation Menu */}
      <nav className="flex flex-col gap-3">
        {isAuthenticated && <NavLink
          to="/"
          key="dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-md transition duration-300 ${
              isActive
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-500"
            }`
          }
        >
          <FaTachometerAlt className="w-5 h-5 shrink-0" />
          <p className="hidden md:block">Dashboard</p>
        </NavLink>}

        <NavLink
          to="/admin/add-item"
          key="add-item"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-md transition duration-300 ${
              isActive
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-500"
            }`
          }
        >
          <FaPlus className="w-5 h-5 shrink-0" />
          <p className="hidden md:block">Add Items</p>
        </NavLink>

        <NavLink
          to="/admin/list-items"
          key="list-items"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-md transition duration-300 ${
              isActive
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-500"
            }`
          }
        >
          <FaList className="w-5 h-5 shrink-0" />
          <p className="hidden md:block">List Items</p>
        </NavLink>

        <NavLink
          to="/admin/orders"
          key="orders"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-md transition duration-300 ${
              isActive
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-500"
            }`
          }
        >
          <FaShoppingCart className="w-5 h-5 shrink-0" />
          <p className="hidden md:block">Orders</p>
        </NavLink>

        <NavLink
          to="/admin/users"
          key="users"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-md transition duration-300 ${
              isActive
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-500"
            }`
          }
        >
          <FaUsers className="w-5 h-5 shrink-0" />
          <p className="hidden md:block">Users</p>
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
