import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

// Get API base URL (same as REST API, but without /api suffix for Socket.IO)
const getApiBase = () => {
  if (typeof window === "undefined") return "";
  
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000/api";
  
  // Remove /api suffix if present for Socket.IO connection
  return baseUrl.replace(/\/api$/, "");
};

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let currentToken: string | null = null;

/**
 * Initialize Socket.IO connection
 */
export function initializeSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  
  // Get auth token
  const token = useAuthStore.getState().token;
  if (!token) {
    console.warn("No auth token available for Socket.IO connection");
    // Disconnect if we had a socket but no token
    if (socket) {
      socket.disconnect();
      socket = null;
      currentToken = null;
    }
    return null;
  }

  // If socket already exists and is connected with the same token, return it
  if (socket?.connected && currentToken === token) {
    return socket;
  }

  // If token changed, disconnect old socket
  if (socket && currentToken !== token) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }

  const apiBase = getApiBase();
  const socketUrl = apiBase.replace("/api", ""); // Remove /api suffix if present

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  // Create new socket connection
  socket = io(socketUrl, {
    auth: {
      token: token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  });

  socket.on("connect", () => {
    console.log("Socket.IO connected:", socket?.id);
    reconnectAttempts = 0;
    
    // Subscribe to notifications
    socket?.emit("subscribe:notifications");
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket.IO disconnected:", reason);
    
    if (reason === "io server disconnect") {
      // Server disconnected, reconnect manually
      socket?.connect();
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error);
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("Max reconnection attempts reached");
    }
  });

  return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket(): Socket | null {
  if (!socket || !socket.connected) {
    return initializeSocket();
  }
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentToken = null;
}

/**
 * Reconnect socket (useful after token refresh)
 */
export function reconnectSocket() {
  disconnectSocket();
  currentToken = null;
  return initializeSocket();
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

