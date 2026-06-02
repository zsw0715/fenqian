import axios from "axios";
import {
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    clearAuth,
} from "./token";

// const API_BASE = "http://47.95.118.37:8000";
const API_BASE = "http://localhost:8000";

const WHITELIST = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/health",
];

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const url = config.url ?? "";
    const isWhitelisted = WHITELIST.some((path) => url.startsWith(path));
    if (!isWhitelisted) {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = getRefreshToken();
            if (refreshToken) {
                try {
                    const res = await axios.post(`${API_BASE}/api/auth/refresh`, {
                        refresh_token: refreshToken,
                    });
                    setAccessToken(res.data.access_token);
                    originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
                    return api(originalRequest);
                } catch {
                    clearAuth();
                }
            } else {
                clearAuth();
            }
        }
        return Promise.reject(error);
    }
);

export default api;
