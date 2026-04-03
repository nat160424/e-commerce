import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

const GROUP_COLORS = {
  "Xác thực": "bg-purple-100 text-purple-700",
  "Sản phẩm": "bg-blue-100 text-blue-700",
  "Danh mục": "bg-cyan-100 text-cyan-700",
  "Người dùng": "bg-indigo-100 text-indigo-700",
  "Giỏ hàng": "bg-orange-100 text-orange-700",
  "Đơn hàng": "bg-green-100 text-green-700",
  "Vận chuyển": "bg-yellow-100 text-yellow-700",
};

const METHOD_COLORS = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
  PATCH: "bg-purple-100 text-purple-700",
};

function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? "bg-green-500" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function ApiManagement() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [editingMessage, setEditingMessage] = useState({});
  const [pendingMessages, setPendingMessages] = useState({});

  const fetchControls = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/admin/api-controls`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setControls(res.data.data || []);
      }
    } catch {
      toast.error("Không thể tải danh sách API controls");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  const handleToggle = async (ctrl, newEnabled) => {
    if (saving[ctrl.route_key]) return;
    setSaving((prev) => ({ ...prev, [ctrl.route_key]: true }));
    try {
      const res = await axios.put(
        `${backendUrl}/api/admin/api-controls/${ctrl.route_key}`,
        { enabled: newEnabled, disabled_message: ctrl.disabled_message || "" },
        { withCredentials: true }
      );
      if (res.data.success) {
        setControls((prev) =>
          prev.map((c) =>
            c.route_key === ctrl.route_key ? { ...c, enabled: newEnabled } : c
          )
        );
        toast.success(`${ctrl.name}: ${newEnabled ? "Đã bật" : "Đã tắt"}`);
      }
    } catch {
      toast.error("Cập nhật thất bại");
    } finally {
      setSaving((prev) => ({ ...prev, [ctrl.route_key]: false }));
    }
  };

  const handleSaveMessage = async (ctrl) => {
    if (saving[ctrl.route_key]) return;
    const msg = pendingMessages[ctrl.route_key] ?? ctrl.disabled_message ?? "";
    setSaving((prev) => ({ ...prev, [ctrl.route_key]: true }));
    try {
      const res = await axios.put(
        `${backendUrl}/api/admin/api-controls/${ctrl.route_key}`,
        { enabled: ctrl.enabled, disabled_message: msg },
        { withCredentials: true }
      );
      if (res.data.success) {
        setControls((prev) =>
          prev.map((c) =>
            c.route_key === ctrl.route_key ? { ...c, disabled_message: msg } : c
          )
        );
        setEditingMessage((prev) => ({ ...prev, [ctrl.route_key]: false }));
        setPendingMessages((prev) => {
          const copy = { ...prev };
          delete copy[ctrl.route_key];
          return copy;
        });
        toast.success("Đã cập nhật thông báo");
      }
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSaving((prev) => ({ ...prev, [ctrl.route_key]: false }));
    }
  };

  // Group controls by group name
  const grouped = controls.reduce((acc, ctrl) => {
    const g = ctrl.group || "Khác";
    if (!acc[g]) acc[g] = [];
    acc[g].push(ctrl);
    return acc;
  }, {});

  const enabledCount = controls.filter((c) => c.enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý API</h1>
          <p className="mt-1 text-sm text-gray-500">
            Bật / tắt API runtime. Admin luôn có thể truy cập dù API bị tắt.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
            <span className="font-semibold text-green-600">{enabledCount}</span>
            {" / "}
            <span className="font-semibold">{controls.length}</span>
            {" đang hoạt động"}
          </div>
          <button
            onClick={fetchControls}
            className="text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-amber-800">
          Khi tắt một API, người dùng thường sẽ nhận được lỗi <strong>503 Service Unavailable</strong>.
          Tài khoản admin vẫn có thể gọi API bình thường.
          Thay đổi có hiệu lực trong vòng <strong>15 giây</strong> (thời gian cache).
        </p>
      </div>

      {/* Groups */}
      {Object.entries(grouped).map(([groupName, groupControls]) => (
        <div key={groupName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Group header */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  GROUP_COLORS[groupName] || "bg-gray-100 text-gray-700"
                }`}
              >
                {groupName}
              </span>
              <span className="text-xs text-gray-400">
                {groupControls.filter((c) => c.enabled).length}/{groupControls.length} hoạt động
              </span>
            </div>
          </div>

          {/* Controls table */}
          <div className="divide-y divide-gray-100">
            {groupControls.map((ctrl) => (
              <div key={ctrl.route_key} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  {/* Toggle */}
                  <div className="pt-0.5">
                    <Toggle
                      enabled={ctrl.enabled}
                      onChange={(val) => handleToggle(ctrl, val)}
                      disabled={!!saving[ctrl.route_key]}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-medium text-gray-900 text-sm">{ctrl.name}</span>
                      <span
                        className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                          METHOD_COLORS[ctrl.method] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ctrl.method}
                      </span>
                      <span className="text-xs text-gray-400 font-mono truncate">{ctrl.path}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          ctrl.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {ctrl.enabled ? "Đang bật" : "Đã tắt"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{ctrl.description}</p>

                    {/* Disabled message editor */}
                    {!ctrl.enabled && (
                      <div className="mt-2">
                        {editingMessage[ctrl.route_key] ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                              placeholder="Thông báo cho người dùng (để trống = mặc định)"
                              value={pendingMessages[ctrl.route_key] ?? ctrl.disabled_message ?? ""}
                              onChange={(e) =>
                                setPendingMessages((prev) => ({
                                  ...prev,
                                  [ctrl.route_key]: e.target.value,
                                }))
                              }
                            />
                            <button
                              onClick={() => handleSaveMessage(ctrl)}
                              disabled={saving[ctrl.route_key]}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessage((prev) => ({ ...prev, [ctrl.route_key]: false }));
                                setPendingMessages((prev) => {
                                  const copy = { ...prev };
                                  delete copy[ctrl.route_key];
                                  return copy;
                                });
                              }}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setEditingMessage((prev) => ({ ...prev, [ctrl.route_key]: true }))
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {ctrl.disabled_message
                              ? `Thông báo: "${ctrl.disabled_message}"`
                              : "Đặt thông báo tắt API..."}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Spinner when saving */}
                  {saving[ctrl.route_key] && (
                    <div className="flex-shrink-0 pt-1">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
