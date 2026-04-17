import { io } from "socket.io-client";
import api from "./api.js"; // Reuse axios config (baseURL, cookies)

// Socket base URL (match backend server)
// Extract base server URL from API_BASE_URL (remove /api/v1)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";
const SOCKET_URL = API_BASE_URL.replace("/api/v1", "");

let socket = null;

/**
 * Initialize socket connection
 */
export const initSocket = () => {
  if (socket) return socket;

  socket = io("http://localhost:4000", {
    withCredentials: true,
  });

  return socket;
};

/**
 * Connect with user/task rooms
 */
// DEPRECATED - Use Context auto-connect only
export const connectSocket = async (userId, taskIds = []) => {
  console.warn("connectSocket called - use auto-connect");
  const sock = initSocket();
  sock.emit("join", userId);
  sock.emit("join-tasks", userId);
  taskIds.forEach((taskId) => sock.emit("join-task", taskId));
  return sock;
};

/**
 * Disconnect
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join specific conversation
 */
export const joinConversation = (convId) => {
  if (socket) {
    socket.emit("join-conversation", convId);
  }
};

// === QUICK ACTIONS (match backend APIs) ===
export const raiseQuery = async (taskId, message, assignedTo) => {
  return api.post("/queries/raise", { taskId, message, assignedTo });
};

export const sendMessage = async (conversationId, text, queryId = null) => {
  return api.post("/thread/message", {
    conversationId,
    text,
    queryId,
  });
};

export const replyToQuery = async (queryId, conversationId, text) => {
  return api.post("/queries/reply", {
    queryId,
    conversationId,
    text,
  });
};

export const markMessageSeen = async (messageId) => {
  return api.post("/thread/seen", { messageId });
};

export const markAllNotificationsRead = async () => {
  return api.post("/thread/notifications/read-all");
};

export const getUnreadCount = async () => {
  const res = await api.get("/thread/notifications/unread-count");
  return res.data.unreadCount;
};

// Socket instance getter
export const getSocket = () => socket;
