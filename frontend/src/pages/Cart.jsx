import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/Shopcontext";
import Title from "../components/Title";
import { assets } from "../assets/frontend_assets/assets";
import CartTotal from "../components/CartTotal";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { backendUrl } from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    updateQuantity,
    loading,
    setLoading,
    deleteItemFromCart,
  } = useContext(ShopContext);
  const { isAuthenticated } = useContext(AuthContext);
  const [cartData, setCartData] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (products.length > 0 && Array.isArray(cartItems)) {
      // cartItems is now an array of objects: [{product_id, quantity, size}, ...]
      const tempData = cartItems
        .filter((item) => item.quantity > 0) // Filter out items with 0 quantity
        .map((item) => ({
          _id: item.product_id, // Map product_id to _id for consistency
          size: item.size,
          quantity: item.quantity
        }));
      
      setCartData(tempData);
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

  const getFirstProductImage = (productId) => {
    const product = products.find((product) => product._id === productId);
    
    if (product && product.images && product.images.length > 0) {
      return getImageUrl(product.images[0]);
    }
    
    return "https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg";
  };

  const handleNavigation = (path) => {
    setLoading(true);
    navigate(path);
    setTimeout(() => setLoading(false), 500);
  };

  const handleCheckout = async () => {
    setLoading(true);
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt hàng", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setLoading(false);
      setTimeout(() => {
        navigate("/login", { state: { from: location.pathname } });
      }, 1200);
    } else {
      try {
        // Cart merging is now handled automatically in ShopContext during login
        // Just proceed to checkout
        navigate("/place-order");
      } catch (error) {
        console.error("Checkout error:", error);
        toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xử lý giỏ hàng", {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="border-t pt-14 relative px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <div className="relative flex justify-between items-start mb-3">
        <div className="text-2xl">
          <Title text1={"Giỏ"} text2={"Hàng"} />
        </div>

        {cartData.length > 0 && (
          <button
            onClick={() => navigate("/collection")}
            className="flex items-center text-white bg-[#8B4513] hover:bg-[#2C1810] transition px-3 py-2 rounded font-medium"
          >
            <span>Tiếp tục mua hàng</span>
            <IoIosArrowForward className="size-4 ml-1" />
          </button>
        )}
      </div>

      {cartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center">
          <img
            src={assets.cartempty} 
            alt="Empty Cart"
            className="w-40 sm:w-60 mb-4"
            loading="lazy"
          />
          <p className="text-2xl text-gray-900 font-medium">
            Giỏ hàng của bạn trống!
          </p>
          <p className="text-gray-500 mb-6 text-sm">
            Có vẻ như bạn chưa thêm gì vào giỏ hàng của mình.
          </p>
          <button
            onClick={() => handleNavigation("/collection")}
            className="bg-black text-white px-6 py-2 text-sm rounded-md"
          >
            Mua hàng ngay
          </button>
        </div>
      ) : (
        <>
          <div>
            {cartData.map((item, index) => {
              const productData = products.find(
                (product) => product._id === item._id
              );
              return (
                <div
                  key={index}
                  className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
                >
                  <div className="flex items-start gap-6">
                    <img
                      className="w-16 sm:w-20 rounded object-cover"
                      src={getFirstProductImage(productData._id)}
                      alt="product images"
                    />
                    <div>
                      <p className="text-xs sm:text-lg font-medium">
                        {productData.name}
                      </p>
                      <div className="flex items-center gap-5 mt-2">
                        <p>
                          {productData.price} {currency}
                        </p>
                        <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50">
                          {item.size}
                        </p>
                      </div>
                    </div>
                  </div>

                  <input
                    className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1 focus:outline-none focus:border-gray-300"
                    type="number"
                    min={1}
                    defaultValue={item.quantity}
                    onChange={(e) => {
                      let value = Number(e.target.value);
                      if (isNaN(value) || value <= 0) value = 1;
                      updateQuantity(item._id, item.size, value);
                    }}
                  />
                  <img
                    onClick={() => deleteItemFromCart(item._id, item.size)}
                    src={assets.bin_icon}
                    alt="bin icon"
                    className="w-4 sm:w-5 mr-4 cursor-pointer"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end my-20">
            <div className="w-full sm:w-[450px]">
              <CartTotal />
              <div className="w-full text-end">
                <button
                  onClick={handleCheckout}
                  className={` text-white w-52 h-11 text-sm my-8 bg-green-700 hover:bg-green-800
                      ${loading ? "cursor-not-allowed opacity-50" : ""}`}
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "TIẾP TỤC THANH TOÁN"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
