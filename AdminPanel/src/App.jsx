import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ListProducts from "./pages/ListProducts";
import Orders from "./pages/Orders";
import LoginPage from "./pages/Login";
import Home from "./pages/Home";
import UpdateProduct from "./pages/UpdateProduct";
import AddProduct from "./pages/AddProduct";
import Users from "./pages/Users";
import ApiManagement from "./pages/ApiManagement";
import { AuthContext } from "./context/AuthContext";

export const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
export const currency = " VND";

const App = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  return (
    <div className="min-h-screen">
      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {isAuthenticated === null || isAuthenticated === false ? (
        <Routes>
          <Route path="/*" element={<LoginPage />} />
        </Routes>
      ) : (
        <>
          <Navbar />
          <hr />
          <div className="flex w-full">
            <Sidebar />
            <div className="w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base">
              <Routes>
                <Route path="/admin" element={<Home />} />
                <Route path="/admin/add-item" element={<AddProduct />} />
                <Route path="/admin/update-item/:id" element={<UpdateProduct />} />
                <Route path="/admin/list-items" element={<ListProducts />} />
                <Route path="/admin/orders" element={<Orders />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/api-management" element={<ApiManagement />} />
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
