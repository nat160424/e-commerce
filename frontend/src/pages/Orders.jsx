import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/Shopcontext";
import Title from "../components/Title";
import { backendUrl } from "../api/axiosInstance";
import axios from "axios";
import { toast } from "react-toastify";

const STATUS_COLOR = {
  pending:   "bg-yellow-100 text-yellow-700",
  shipping:  "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const STATUS_LABEL = {
  pending:   "Chờ xác nhận",
  shipping:  "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã huỷ",
};
const METHOD_LABEL = {
  cod:     "Thanh toán khi nhận hàng (COD)",
  card:    "Thẻ ngân hàng",
  momo:    "Ví MoMo",
  zalopay: "ZaloPay",
};

const Orders = () => {
  const { navigate, currency } = useContext(ShopContext);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/orders`, { withCredentials: true });
      if (res.data.success) {
        setOrders((res.data.data || []).slice().reverse());
      } else {
        toast.error(res.data.message || "Không tải được đơn hàng");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Vui lòng đăng nhập để xem đơn hàng");
        navigate("/login");
      } else {
        toast.error("Lỗi khi tải đơn hàng");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const formatDate = (raw) => {
    if (!raw) return "—";
    try { return new Date(raw).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return raw; }
  };

  const formatMoney = (n) =>
    typeof n === "number" ? n.toLocaleString("vi-VN") + currency : "—";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <div className="mb-6">
        <Title text1={"ĐƠN HÀNG"} text2={"CỦA TÔI"} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40 text-gray-500">Đang tải đơn hàng...</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
          <div className="text-6xl">🛍️</div>
          <p className="text-gray-500 text-lg">Bạn chưa có đơn hàng nào</p>
          <button
            onClick={() => navigate("/collection")}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl text-sm font-medium"
          >
            Mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono">#{order.id?.slice(-8).toUpperCase()}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-50">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">
                      🛍️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatMoney(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-amber-700 flex-shrink-0">
                      {formatMoney(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  <span className="mr-3">
                    💳 {METHOD_LABEL[order.shipment?.payment_data?.method] || "—"}
                  </span>
                  {order.shipment?.tracking_code && (
                    <span>🚚 {order.shipment.tracking_code}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-900">
                    Tổng: {formatMoney(order.total)}
                  </span>
                  <button
                    onClick={fetchOrders}
                    className="text-xs border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Làm mới
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;