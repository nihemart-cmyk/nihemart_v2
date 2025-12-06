import axios, { AxiosInstance } from "axios";
import { useAuthStore } from "@/store/auth.store";

// Base URL for Next.js environment
export const API_BASE =
   (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE : undefined) ||
   (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined) ||
   "http://localhost:4000/api";

const commonHeaders = {
   "Content-Type": "application/json",
};

// Unauthorized instance for public endpoints
export const unauthorizedAPI: AxiosInstance = axios.create({
   baseURL: API_BASE,
   headers: commonHeaders,
});

// Authorized instance that attaches token from auth store
export const authorizedAPI: AxiosInstance = axios.create({
   baseURL: API_BASE,
   headers: commonHeaders,
});

authorizedAPI.interceptors.request.use((config) => {
   try {
      const token = useAuthStore.getState().token;
      if (token) {
         if (!config.headers) config.headers = {} as any;
         (config.headers as any).Authorization = `Bearer ${token}`;
      }
   } catch (e) {
      // ignore
   }
   return config;
});

// Export default small helper for backward compatibility (not used by new files)
export default authorizedAPI;
