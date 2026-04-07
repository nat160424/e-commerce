import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const backendUrl =  "https://localhost";

  const getProducts = async () => {
    const response = await axios.get(`${backendUrl}/api/products`, {withCredentials: true});
    if (response.data.success) {
      setProducts(response.data.data);
    }
  }

  const uploadImages = async (images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await axios.post(`${backendUrl}/api/admin/upload-images`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return response.data.data.image_ids;
    }
    throw new Error(response.data.message || "Failed to upload images");
  }

  const createProduct = async (productData) => {
    const response = await axios.post(`${backendUrl}/api/admin/products`, productData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.data.success) {
      setProducts([...products, response.data.data]);
      return response.data;
    }
    throw new Error(response.data.message || "Failed to create product");
  }

  const updateProduct = async (id, productData) => {
    const response = await axios.put(`${backendUrl}/api/admin/products/${id}`, productData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.data.success) {
      setProducts(products.map(p => p._id === id ? response.data.data : p));
      return response.data;
    }
    throw new Error(response.data.message || "Failed to update product");
  }

  const deleteProduct = async (id) => {
    const response = await axios.delete(`${backendUrl}/api/admin/products/${id}`, {withCredentials: true});
    if (response.data.success) {
      setProducts(products.filter(p => p._id !== id));
    }
  }

  const getProduct = async (id) => {
    const response = await axios.get(`${backendUrl}/api/products/${id}`, {withCredentials: true});
    if (response.data.success) {
      return response.data.data;
    }
  }

  useEffect(() => {
    getProducts();
  }, []);

  return <ProductContext.Provider value={{ 
    products, 
    setProducts, 
    uploadImages,
    createProduct, 
    updateProduct, 
    deleteProduct, 
    getProduct, 
    getProducts 
  }}>{children}</ProductContext.Provider>;
};