import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl, currency } from "../App";

const STATUS_OPTIONS = [
  { value: "pending",   label: "⏳ Chờ xác nhận" },
  { value: "shipping",  label: "🚚 Đang giao" },
  { value: "delivered", label: "✅ Đã giao" },
  { value: "cancelled", label: "❌ Đã huỷ" },
];

const STATUS_BADGE = {
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  shipping:  "bg-blue-100 text-blue-700 border-blue-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const METHOD_LABEL = {
  cod:     "COD",
  card:    "Thẻ NH",
  momo:    "MoMo",
  zalopay: "ZaloPay",
};

const Orders = () => {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [updating, setUpdating] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await axios.get(`${backendUrl}/api/admin/orders`, {
        withCredentials: true, params,
      });
      if (res.data.success) {
        const list = res.data.data || [];
        setOrders(list.slice().reverse());
      } else {
        toast.error(res.data.message || "Không tải được đơn hàng");
      }
    } catch (err) {
      toast.error("Lỗi tải đơn hàng: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [filterStatus]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await axios.put(
        `${backendUrl}/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        { withCredentials: true },
      );
      if (res.data.success) {
        toast.success("Cập nhật trạng thái thành công");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        toast.error(res.data.message || "Cập nhật thất bại");
      }
    } catch (err) {
      toast.error("Lỗi cập nhật: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (raw) => {
    if (!raw) return "—";
    try { return new Date(raw).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }); }
    catch { return raw; }
  };

  const formatMoney = (n) =>
    typeof n === "number" ? n.toLocaleString("vi-VN") + currency : "—";

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.id?.toLowerCase().includes(q) ||
      o.user_id?.toLowerCase().includes(q) ||
      (o.items || []).some((i) => i.name?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📦 Quản lý đơn hàng</h1>
        <div className="flex gap-3">
          <input
            type="text" placeholder="Tìm kiếm đơn hàng..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-52"
          />
          <select
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Tải lại
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {STATUS_OPTIONS.map((s) => (
          <div key={s.value} className={`p-3 rounded-xl border text-center ${STATUS_BADGE[s.value]}`}>
            <p className="text-2xl font-bold">{orders.filter((o) => o.status === s.value).length}</p>
            <p className="text-xs mt-0.5">{s.label.replace(/^[^ ]+ /, "")}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-48 text-gray-500">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Không có đơn hàng nào</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Mã ĐH", "Sản phẩm", "Khách hàng", "Thanh toán", "Tổng tiền", "Ngày đặt", "Trạng thái"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    {/* Mã ĐH */}
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                        #{order.id?.slice(-8).toUpperCase()}
                      </span>
                    </td>

                    {/* Sản phẩm */}
                    <td className="px-4 py-4 max-w-[180px]">
                      {(order.items || []).slice(0, 2).map((item, i) => (
                        <p key={i} className="text-gray-700 truncate">
                          {item.name} <span className="text-gray-400">×{item.quantity}</span>
                        </p>
                      ))}
                      {(order.items || []).length > 2 && (
                        <p className="text-gray-400 text-xs">+{order.items.length - 2} sản phẩm khác</p>
                      )}
                    </td>

                    {/* Khách hàng */}
                    <td className="px-4 py-4">
                      <p className="text-gray-700 font-mono text-xs">{order.user_id?.slice(-8)}</p>
                    </td>

                    {/* Thanh toán */}
                    <td className="px-4 py-4">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {METHOD_LABEL[order.items?.[0]?.payment_method] || "—"}
                      </span>
                    </td>

                    {/* Tổng tiền */}
                    <td className="px-4 py-4 font-semibold text-gray-800">
                      {formatMoney(order.total)}
                    </td>

                    {/* Ngày đặt */}
                    <td className="px-4 py-4 text-gray-500 text-xs">{formatDate(order.created_at)}</td>

                    {/* Trạng thái */}
                    <td className="px-4 py-4">
                      <select
                        value={order.status || "pending"}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className={`text-xs font-medium px-2 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 ${STATUS_BADGE[order.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Hiển thị {filtered.length} / {orders.length} đơn hàng
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;