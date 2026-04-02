import React, { useEffect, useRef, useState } from "react";
import { getRecentOrders } from "../api/order";

const timeAgo = (rawDate) => {
  const diff = (Date.now() - new Date(rawDate).getTime()) / 1000;
  if (diff < 60)   return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

const maskName = (name = "") => {
  const parts = name.trim().split(" ");
  if (parts.length <= 1) return name;
  return parts.map((p, i) => (i === parts.length - 1 ? p : p[0] + ".")).join(" ");
};

/**
 * RecentOrdersCarousel — social-proof ticker tren trang chu.
 *
 * Hien thi: "[ten an danh] vua dat hang [san pham] · [thoi gian]"
 *
 * VULNERABILITY: JSON response chua order_id, user_id, shipment_id —
 * bat ky ai co the xem qua DevTools Network tab va thuc hien IDOR chain.
 */
const RecentOrdersCarousel = () => {
  const [items, setItems]   = useState([]);
  const [visible, setVisible] = useState(null);
  const [show, setShow]     = useState(true);
  const timerRef = useRef(null);
  const fadeRef  = useRef(null);

  useEffect(() => {
    getRecentOrders(14)
      .then((res) => { if (res?.data?.length) setItems(res.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!items.length) return;
    let idx = 0;
    const next = () => {
      setShow(false);
      fadeRef.current = setTimeout(() => {
        setVisible(items[idx % items.length]);
        idx += 1;
        setShow(true);
      }, 400);
    };
    next();
    timerRef.current = setInterval(next, 5000);
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(fadeRef.current);
    };
  }, [items]);

  if (!visible) return null;

  const name    = maskName(visible.buyer_name || "Khách hàng");
  const product = visible.product_snip        || "một sản phẩm";
  const when    = timeAgo(visible.created_at);

  return (
    <div
      className="fixed bottom-5 left-5 z-50 transition-all duration-400"
      style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(8px)" }}
    >
      <div className="flex items-center gap-3 bg-white border border-gray-100 shadow-xl rounded-2xl px-4 py-3 max-w-[280px]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm select-none">
          {name.charAt(0).toUpperCase()}
        </div>

        {/* Text */}
        <div className="min-w-0 text-xs text-gray-600 leading-snug">
          <p className="truncate">
            <span className="font-semibold text-gray-900">{name}</span>
            {" vừa đặt hàng "}
            <span className="font-semibold text-amber-800">{product}</span>
          </p>
          <p className="text-gray-400 mt-0.5 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
            {when}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecentOrdersCarousel;