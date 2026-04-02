import React, { useState } from "react";

const METHODS = [
  { id: "cod",     label: "COD",              icon: "💵" },
  { id: "card",    label: "Thẻ ngân hàng",    icon: "💳" },
  { id: "momo",    label: "MoMo",             icon: "🟣" },
  { id: "zalopay", label: "ZaloPay",          icon: "🔵" },
];

const BANKS = ["Vietcombank", "BIDV", "Techcombank", "MB Bank", "VPBank", "Agribank", "ACB", "TPBank", "VietinBank", "Sacombank"];

const InputField = ({ label, required, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
    />
  </div>
);

const PaymentModal = ({ isOpen, totalAmount, currency, onClose, onConfirm, loading }) => {
  const [method, setMethod] = useState("cod");
  const [card, setCard] = useState({ number: "", holder: "", expiry: "", cvv: "", bank: "" });
  const [walletPhone, setWalletPhone] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    let paymentData = { method, status: "pending", amount: totalAmount };

    if (method === "card") {
      if (!card.number || !card.holder || !card.expiry || !card.cvv || !card.bank) {
        alert("Vui lòng điền đầy đủ thông tin thẻ.");
        return;
      }
      paymentData = {
        ...paymentData,
        card_number:  card.number.replace(/\s/g, ""),
        card_holder:  card.holder.toUpperCase(),
        expiry_date:  card.expiry,
        cvv:          card.cvv,
        bank_name:    card.bank,
      };
    }

    if (method === "momo" || method === "zalopay") {
      if (!walletPhone) {
        alert("Vui lòng nhập số điện thoại ví.");
        return;
      }
      paymentData = {
        ...paymentData,
        wallet_phone:    walletPhone,
        wallet_provider: method,
        status:          "paid",
      };
    }

    if (method === "cod") {
      paymentData.status = "pending";
    }

    onConfirm(paymentData);
  };

  // Format card number with spaces
  const formatCard = (v) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  // Format expiry MM/YY
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Thông tin thanh toán</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Tổng tiền:{" "}
              <span className="font-semibold text-amber-700">
                {totalAmount?.toLocaleString("vi-VN")}{currency}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Method selector */}
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  method === m.id
                    ? "border-amber-500 bg-amber-50 text-amber-800"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* COD */}
          {method === "cod" && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
              <p className="text-green-600 mt-1">Bạn sẽ thanh toán tiền mặt khi nhận được hàng.</p>
            </div>
          )}

          {/* Card */}
          {method === "card" && (
            <div className="space-y-3">
              <InputField
                label="Số thẻ" required
                placeholder="1234 5678 9012 3456"
                value={formatCard(card.number)}
                onChange={(e) => setCard({ ...card, number: e.target.value })}
                maxLength={19}
              />
              <InputField
                label="Tên chủ thẻ (in hoa)" required
                placeholder="NGUYEN VAN A"
                value={card.holder}
                onChange={(e) => setCard({ ...card, holder: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Ngày hết hạn" required
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                  maxLength={5}
                />
                <InputField
                  label="CVV" required
                  placeholder="123"
                  type="password"
                  value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Ngân hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={card.bank}
                  onChange={(e) => setCard({ ...card, bank: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                ⚠️ Thông tin thẻ được lưu phục vụ mô phỏng bảo mật IDOR — không dùng thẻ thật.
              </p>
            </div>
          )}

          {/* MoMo / ZaloPay */}
          {(method === "momo" || method === "zalopay") && (
            <div className="space-y-3">
              <InputField
                label={`Số điện thoại ${method === "momo" ? "MoMo" : "ZaloPay"}`}
                required
                placeholder="09xxxxxxxx"
                type="tel"
                value={walletPhone}
                onChange={(e) => setWalletPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
              <div className={`rounded-xl p-4 text-sm ${method === "momo" ? "bg-pink-50 border border-pink-200 text-pink-800" : "bg-blue-50 border border-blue-200 text-blue-800"}`}>
                <p>Hệ thống sẽ ghi nhận SĐT ví {method === "momo" ? "MoMo" : "ZaloPay"} của bạn.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;