import axios from 'axios';
import Cookies from 'js-cookie';

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

// Normalize base URL: remove trailing slash and ensure /v1 segment exists
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');
if (!/\/v1($|\/)/.test(API_BASE_URL)) {
  API_BASE_URL = API_BASE_URL + '/v1';
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies (e.g., for authentication)
  // Let Axios set Content-Type automatically. It will correctly set it to
  // 'multipart/form-data' when you pass a FormData object.
});

// Optional: Add response interceptors for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // alert('Session timeout detected!'); // For debugging
      window.dispatchEvent(new CustomEvent('session-timeout'));
    }
    return Promise.reject(error);
  }
);

export default api;
