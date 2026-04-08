import React, { useContext, useState, useEffect } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import PaymentModal from "../components/PaymentModal";
import { useLocation } from "react-router-dom";
import { ShopContext } from "../context/Shopcontext";
import { backendUrl } from "../api/axiosInstance";
import axios from "axios";
import { toast } from "react-toastify";
import Select from "react-select";

const PlaceOrder = () => {
  const {
    cartItems, setCartItems,
    getCartAmount, delivery_fee,
    products, navigate, loading, setLoading,
    updateQuantity, currency,
  } = useContext(ShopContext);

  const location = useLocation();

  const [provinces, setProvinces]   = useState([]);
  const [districts, setDistricts]   = useState([]);
  const [communes,  setCommunes]    = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "",
    email: "", phone: "",
    province: null, district: null, commune: null,
    address: "",
    note: "",
    nationalId: "",
    dateOfBirth: "",
  });

  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    if (products.length > 0 && Array.isArray(cartItems)) {
      setCartData(cartItems.filter((i) => i.quantity > 0).map((i) => ({
        _id: i.product_id, size: i.size, quantity: i.quantity,
      })));
    }
  }, [cartItems, products]);

  const getImageUrl = (imageKey) => {
    if (!imageKey) return "";
    if (imageKey.startsWith("http://") || imageKey.startsWith("https://") || imageKey.startsWith("data:")) {
      return imageKey;
    }
    const isLocalFilePath = imageKey.startsWith("file:///") || /^[A-Za-z]:\\\\/.test(imageKey) || imageKey.startsWith("\\\\");
    if (isLocalFilePath) {
      return "";
    }
    if (imageKey.includes(".")) {
      return `${backendUrl}/uploads/${imageKey}`;
    }
    return `${backendUrl}/api/product/image/${imageKey}`;
  };

  // ── Địa chỉ hành chính ─────────────────────────────────────────────────────
  useEffect(() => {
    axios.get("https://provinces.open-api.vn/api/p/")
      .then((r) => setProvinces(r.data.map((p) => ({ label: p.name, value: p.code }))))
      .catch(() => toast.error("Không tải được danh sách tỉnh/thành phố"));
  }, []);

  const handleProvinceChange = async (opt) => {
    setFormData((f) => ({ ...f, province: opt, district: null, commune: null }));
    const r = await axios.get(`https://provinces.open-api.vn/api/p/${opt.value}?depth=2`);
    setDistricts(r.data.districts.map((d) => ({ label: d.name, value: d.code })));
    setCommunes([]);
  };

  const handleDistrictChange = async (opt) => {
    setFormData((f) => ({ ...f, district: opt, commune: null }));
    const r = await axios.get(`https://provinces.open-api.vn/api/d/${opt.value}?depth=2`);
    setCommunes(r.data.wards.map((w) => ({ label: w.name, value: w.code })));
  };

  const handleChange = (e) =>
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ── Validate form & mở modal thanh toán ────────────────────────────────────
  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (!cartData.length) { toast.error("Giỏ hàng đang trống!"); navigate("/cart"); return; }
    if (!formData.province || !formData.district || !formData.commune) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh / Quận / Phường"); return;
    }
    setShowPaymentModal(true);
  };

  // ── Gửi đơn hàng sau khi xác nhận thanh toán ───────────────────────────────
  const handlePaymentConfirm = async (paymentData) => {
    setLoading(true);
    try {
      // Chuẩn hoá items đúng format backend
      const orderItems = cartData
        .map((item) => {
          const p = products.find((x) => x._id === item._id);
          if (!p) return null;
          return { product_id: item._id, name: p.name, quantity: item.quantity, price: p.price };
        })
        .filter(Boolean);

      const fullAddress = [
        formData.address,
        formData.commune?.label,
        formData.district?.label,
      ].filter(Boolean).join(", ");

      const payload = {
        items: orderItems,
        shipment: {
          full_name:    `${formData.firstName} ${formData.lastName}`.trim(),
          phone:        formData.phone,
          email:        formData.email,
          address:      fullAddress,
          province:     formData.province?.label || "",
          note:         formData.note,
          national_id:  formData.nationalId,
          date_of_birth: formData.dateOfBirth,
          payment_data: { ...paymentData, amount: getCartAmount() + delivery_fee },
        },
      };

      const res = await axios.post(`${backendUrl}/api/orders`, payload, { withCredentials: true });
      if (res.data.success) {
        setCartItems([]);
        localStorage.removeItem("guestCart");
        setShowPaymentModal(false);
        toast.success("Đặt hàng thành công!");
        navigate("/orders");
      } else {
        toast.error(res.data.message || "Đặt hàng thất bại");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Có lỗi xảy ra khi đặt hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(false); }, [location.pathname]);

  const selectStyles = {
    control: (base) => ({
      ...base, minHeight: "48px",
      borderColor: "#D1D5DB", "&:hover": { borderColor: "#F59E0B" },
    }),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Title text1={"ĐẶT"} text2={"HÀNG"} />
        </div>

        <form onSubmit={onSubmitHandler}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Cột trái: thông tin giao hàng ── */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Thông tin giao hàng</h2>

                {/* Họ tên */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input name="firstName" value={formData.firstName} onChange={handleChange}
                    placeholder="Họ" required
                    className="border border-gray-300 rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <input name="lastName" value={formData.lastName} onChange={handleChange}
                    placeholder="Tên" required
                    className="border border-gray-300 rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>

                {/* Email + SĐT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input name="email" type="email" value={formData.email} onChange={handleChange}
                    placeholder="Email" required
                    className="border border-gray-300 rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <input name="phone" type="tel" value={formData.phone} onChange={handleChange}
                    placeholder="Số điện thoại" required
                    className="border border-gray-300 rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>

                {/* Tỉnh / Quận / Phường */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Select placeholder="Tỉnh/Thành phố" value={formData.province}
                    options={provinces} onChange={handleProvinceChange}
                    isSearchable styles={selectStyles} />
                  <Select placeholder="Quận/Huyện" value={formData.district}
                    options={districts} onChange={handleDistrictChange}
                    isSearchable isDisabled={!formData.province} styles={selectStyles} />
                  <Select placeholder="Phường/Xã" value={formData.commune}
                    options={communes}
                    onChange={(opt) => setFormData((f) => ({ ...f, commune: opt }))}
                    isSearchable isDisabled={!formData.district} styles={selectStyles} />
                </div>

                {/* Địa chỉ chi tiết */}
                <input name="address" value={formData.address} onChange={handleChange}
                  placeholder="Số nhà, tên đường" required
                  className="border border-gray-300 rounded-lg py-3 px-4 text-sm w-full mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400" />

                {/* Ghi chú */}
                <textarea name="note" value={formData.note} onChange={handleChange}
                  placeholder="Ghi chú đơn hàng (không bắt buộc)" rows={2}
                  className="border border-gray-300 rounded-lg py-3 px-4 text-sm w-full resize-none focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>

              {/* ── Thông tin xác minh (tuỳ chọn) ── */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Xác minh danh tính</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Dùng để xác minh khi giao hàng giá trị cao (không bắt buộc)</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Tuỳ chọn</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CCCD / CMND</label>
                    <input name="nationalId" value={formData.nationalId} onChange={handleChange}
                      placeholder="012345678901"
                      className="border border-gray-300 rounded-lg py-3 px-4 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ngày sinh</label>
                    <input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange}
                      className="border border-gray-300 rounded-lg py-3 px-4 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Cột phải: tóm tắt đơn hàng ── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Đơn hàng của bạn</h2>

                {/* Danh sách sản phẩm */}
                <div className="space-y-3 mb-5 max-h-80 overflow-y-auto pr-1">
                  {cartData.length > 0 ? cartData.map((item, idx) => {
                    const p = products.find((x) => x._id === item._id);
                    if (!p) return null;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                        <img
                          className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                          src={getImageUrl(p.images?.[0])}
                          alt={p.name}
                          onError={(e) => { e.target.src = "https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg"; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">Size: {item.size}</p>
                          <p className="text-sm font-semibold text-amber-700">{p.price?.toLocaleString("vi-VN")}{currency}</p>
                        </div>
                        <input
                          type="number" min="1" value={item.quantity}
                          onChange={(e) => updateQuantity(item._id, item.size, parseInt(e.target.value) || 1)}
                          className="w-14 text-center border border-gray-300 rounded-lg px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                    );
                  }) : (
                    <p className="text-center text-gray-400 py-8 text-sm">Giỏ hàng trống</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <CartTotal />
                </div>

                <button
                  type="submit"
                  disabled={loading || !cartData.length}
                  className="w-full mt-5 py-3 rounded-xl font-semibold text-sm text-white transition-colors bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang xử lý..." : "Tiến hành thanh toán →"}
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>

      {/* Popup thanh toán */}
      <PaymentModal
        isOpen={showPaymentModal}
        totalAmount={getCartAmount() + delivery_fee}
        currency={currency}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirm}
        loading={loading}
      />
    </div>
  );
};

export default PlaceOrder;