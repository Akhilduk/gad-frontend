import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

// ✅ Base URL setup
const baseURL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development"
     ? "http://localhost:8000"
    : "https://api.devaas.cdipd.in");

// ✅ Axios instance
export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosInstanceFile = axios.create({
  baseURL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

// ✅ Token helpers
const getAccessToken = () => sessionStorage.getItem("token");
const getRefreshToken = () => sessionStorage.getItem("refresh_token");

// ✅ Extend config
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ✅ Token refresh function
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    // 🔥 removed extra slash
    const response = await axios.post(`${baseURL}auth/refresh`, {
      token: refreshToken,
    });

    if (response.status === 200 && response.data?.data) {
      const { access_token, refresh_token } = response.data.data;
      console.log("refresh:",refresh_token)

      // store new tokens
      sessionStorage.setItem("token", access_token);
      sessionStorage.setItem("refresh_token", refresh_token);

      return access_token;
    }
    return null;
  } catch (err) {
    console.error("Token refresh failed", err);
    return null;
  }
};

// ✅ Logout flag
let isLoggingOut = false;

// ✅ Request Interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } else if (!isLoggingOut) {
        isLoggingOut = true;
        sessionStorage.clear();
        toast.warn("Session expired. Please log in again.");
        console.log("logging out");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;
