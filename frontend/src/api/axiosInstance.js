import axios from 'axios';

// Empty string means requests use the current page origin (goes through nginx proxy).
// In development, set VITE_BACKEND_URL=http://localhost:8081 in .env.local
export const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

const instance = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
});

export default instance;
