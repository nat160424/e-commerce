import React, { useContext } from "react";
import { ShopContext } from "../context/Shopcontext";
import { Link } from "react-router-dom";
import { backendUrl } from "../api/axiosInstance";

const ProductItem = ({ id, image, name, price }) => {
  const { currency } = useContext(ShopContext);

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

  const defaultImage = "https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg";
  
  const productImage = (image && Array.isArray(image) && image.length > 0) 
    ? getImageUrl(image[0]) 
    : defaultImage;

  return (
    <Link
      to={`/product/${id}`}
      className="relative overflow-hidden shadow-md transform transition-all hover:scale-105 hover:shadow-xl bg-[#F5F5DC]"
    >
      <div className="overflow-hidden rounded-t-lg">
        <img
          className="transition ease-in-out duration-300 object-cover w-full h-72 sm:h-80 md:h-72 lg:h-64"
          src={productImage}
          alt={name}
          onError={(e) => {
            e.target.src = defaultImage; 
          }}
        />
      </div>
      <div className="p-4">
        <p className="text-lg font-semibold text-[#2C1810] truncate">{name}</p>
        <p className="text-sm font-medium text-[#8B4513]">
           {price} {currency}
        </p>
      </div>
    </Link>
  );
};

export default ProductItem;
