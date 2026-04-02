import axios from "./axiosInstance";

export const getRecentOrders = async (limit = 10) => {
  const { data } = await axios.get(`/api/orders/recent?limit=${limit}`);
  return data;
};

export const getOrderById = async (orderId) => {
  const { data } = await axios.get(`/api/orders/${orderId}`);
  return data;
};

export const getMyOrders = async () => {
  const { data } = await axios.get("/api/orders");
  return data;
};

export const createOrder = async (payload) => {
  const { data } = await axios.post("/api/orders", payload);
  return data;
};

export const cancelOrder = async (orderId) => {
  const { data } = await axios.post(`/api/orders/${orderId}/cancel`);
  return data;
};

// IDOR: fetches any shipment by ID — no server-side ownership check
export const getShipmentById = async (shipmentId) => {
  const { data } = await axios.get(`/api/shipments/${shipmentId}`);
  return data;
};