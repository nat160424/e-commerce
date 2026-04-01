import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_orders: 0,
    total_products: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/admin/stats`, {
        withCredentials: true,
      });
      if (response?.data?.success) {
        setStats({
          total_users: response.data.data.total_users,
          total_orders: response.data.data.total_orders,
          total_products: response.data.data.total_products,
        });
      }
    } catch (error) {
      console.error("Error fetching statistics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-5 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
        Dashboard
      </h1>

      {loading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-lg text-gray-600">Đang tải dữ liệu...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <StatCard
            title="Tổng người dùng"
            count={stats.total_users}
            color="blue"
            onClick={() => navigate('/admin/users')}
            showButton={true}
          />
          <StatCard
            title="Tổng đơn hàng"
            count={stats.total_orders}
            color="green"
          />
          <StatCard
            title="Tổng sản phẩm"
            count={stats.total_products}
            color="purple"
          />
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, count, color, onClick, showButton }) => {
  const colorClasses = {
    blue: "text-blue-600 border-blue-400 bg-blue-100",
    green: "text-green-600 border-green-400 bg-green-100",
    purple: "text-purple-600 border-purple-400 bg-purple-100",
  };

  return (
    <div
      className={`p-6 border-l-4 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${colorClasses[color]}`}
      onClick={onClick}
    >
      <h2 className="text-lg font-semibold text-gray-600">{title}</h2>
      <p className={`text-4xl font-bold ${colorClasses[color]}`}>{count}</p>
      {showButton && (
        <button className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium">
          Xem chi tiết
        </button>
      )}
    </div>
  );
};

export default Home;
