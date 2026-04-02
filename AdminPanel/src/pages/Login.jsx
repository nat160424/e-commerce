import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email,    setEmail]    = useState(import.meta.env.VITE_ADMIN_EMAIL    || "");
  const [password, setPassword] = useState(import.meta.env.VITE_ADMIN_PASSWORD || "");
  const [loading,  setLoading]  = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success("Đăng nhập thành công!", { position: "top-center", autoClose: 1200 });
        navigate("/admin");
      } else {
        toast.error(result.message || "Đăng nhập thất bại", { position: "top-center", autoClose: 2500 });
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại", { position: "top-center", autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Chỉ dành cho quản trị viên</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Tài khoản không có quyền admin sẽ bị từ chối
        </p>
      </div>
    </div>
  );
};

export default LoginPage;