import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/Shopcontext";
import { assets } from "../assets/frontend_assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import { backendUrl } from "../api/axiosInstance";

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");

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

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id === productId) {
        setProductData(item);
        // Set first image ID from images array
        if (item.images && item.images.length > 0) {
          setImage(getImageUrl(item.images[0]));
        }
        return null;
      }
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-1000 opacity-100 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      {/*---------------- product data details ---------------- */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* ----------------product images ---------------- */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.images && productData.images.map((imageId, index) => (
              <img
                src={getImageUrl(imageId)}
                key={index}
                alt="product"
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink cursor-pointer"
                onClick={() => setImage(getImageUrl(imageId))}
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="product" />
          </div>
        </div>

        {/*---------------- product information details ---------------- */}

        <div className="flex-1 ">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>

          <div className="flex items-center gap-1 mt-3">
            <img src={assets.star_icon} className="w-3 5" alt="" />
            <img src={assets.star_icon} className="w-3 5" alt="" />
            <img src={assets.star_icon} className="w-3 5" alt="" />
            <img src={assets.star_icon} className="w-3 5" alt="" />
            <img src={assets.star_icon} className="w-3 5" alt="" />
          </div>
          <p className="mt-4 text-3xl font-medium">
             {productData.price} {currency}
          </p>

          <div className="flex flex-col gap-4 mt-4">
            <p>Chọn kích cỡ</p>
            <div className="flex gap-2">
              {productData.size && productData.size.map((item, index) => (
                <button
                  onClick={() => setSize(item)}
                  className={`border py-2 px-4 bg-gray-100 ${
                    item === size ? "border-orange-400" : ""
                  }`}
                  key={index}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <p className="my-6 text-gray-500 md:w-4/5">
            {productData.description}
          </p>

          <button
            onClick={() => addToCart(productData._id, 1, size)}
            className="bg-blue-800 text-white px-8 py-3 text-sm active:bg-gray-800 hover:bg-blue-700"
          >
            Thêm vào giỏ hàng
          </button>
          <hr className=" mt-2 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>Sản phẩm 100% chính hãng</p>
            <p>Thanh toán khi nhận hàng</p>
          </div>
        </div>
      </div>

      {/* ------------ display related products -------------- */}
      <RelatedProducts
        category={productData.category}
        subCategory={productData.sub_category}
      />
    </div>
  ) : (
    <div className=" opacity-0"></div>
  );
};

export default Product;
