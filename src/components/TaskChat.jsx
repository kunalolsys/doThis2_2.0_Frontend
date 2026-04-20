import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  Badge,
  Avatar,
  Progress,
  Button,
  Spin,
  Empty,
  Collapse,
  Tag,
  Input,
} from "antd";
import {
  Send,
  Clock,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  User,
  Phone,
  Video,
  Paperclip,
  Smile,
  AlertTriangle,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useSocket } from "../context/SocketContext";
import api from "../lib/api";
import { toast } from "sonner";
import dayjs from "dayjs";

const { Panel } = Collapse;
const { TextArea } = Input;

const TaskChat = ({ task, open, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const currentUser = useSelector((state) => state.users.currentUser);
  const { socket, addEvent, isConnected } = useSocket();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);
  useEffect(() => {
    if (open && task?.conversationId) {
      loadTaskChat();
    }
  }, [open, task]);

  const loadTaskChat = async () => {
    setLoading(true);
    try {
      const [queriesRes, messagesRes] = await Promise.all([
        api.get(`/queries/task/${task._id}`),
        api.get(`/thread/${task.conversationId}/messages`),
      ]);
      const queries = queriesRes?.data?.data || [];
      const msgs = messagesRes?.data?.data?.messages || [];

      const combined = [
        // ✅ Queries
        ...queries.map((q) => ({
          id: q._id,
          type: "query",
          text: q.message || "",
          user: q.raisedBy || {},
          timestamp: q.createdAt,
          parentMessage: q.parentMessage,
          status: q.status,
          assignedToMe: String(q.assignedTo?._id) === String(currentUser?._id),
        })),

        // ✅ Messages
        ...msgs.map((m) => ({
          id: m._id,
          type: "message",
          text: m.text || "",
          user: m.sender || {},
          timestamp: m.createdAt,
          parentMessage: m.queryId
            ? m.queryId
              ? {
                  text: m.queryId.message,
                  sender: m.queryId.raisedBy || {},
                }
              : null
            : m.parentMessage,
          seen: (m.seenBy || []).some(
            (s) => String(s.user?._id || s.user) === String(currentUser?._id),
          ),
        })),
      ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setMessages(combined);
    } catch {
      toast.error("Failed to load chat");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!replyText.trim()) return;
    const tempId = `temp_${Date.now()}`;
    const isMe = replyingTo?.user?._id == currentUser?._id;
    const payload = {
      conversationId: task.conversationId,
      text: replyText.trim(),
      queryId: replyingTo.id,
    };

    if (replyingTo) {
      payload.parentMessage = replyingTo.id;
    }

    const optimistic = {
      id: tempId,
      type: "message",
      text: replyText,
      user: { _id: currentUser._id, name: currentUser.name },
      timestamp: new Date(),
      seen: true,
      parentMessage: replyingTo?.id || null,
      // parentPreview: replyingTo,
    };

    // setMessages((prev) => [...prev, optimistic]);
    setReplyText("");
    setSending(true);
    setReplyingTo(null);
    try {
      if (replyingTo && replyingTo.type == "query" && !isMe) {
        await api.post("/queries/reply", payload);
      } else {
        await api.post("/thread/message", payload);
      }
      toast.success(replyingTo ? "Replied!" : "Sent!");
      addEvent("chat-message", task._id);
      await loadTaskChat();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Send failed");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => dayjs(timestamp).format("HH:mm");

  const getStatusColor = (status) => {
    const colors = {
      Pending: "orange",
      Open: "yellow",
      Responded: "blue",
      Resolved: "green",
    };
    return colors[status] || "gray";
  };
  const getStatusStyle = (status, isMe) => {
    const styles = {
      Pending: isMe
        ? "bg-white/20 text-white"
        : "bg-orange-100 text-orange-700",
      Open: isMe ? "bg-white/20 text-white" : "bg-yellow-100 text-yellow-700",
      Responded: isMe ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700",
      Resolved: isMe ? "bg-white/20 text-white" : "bg-green-100 text-green-700",
    };

    return styles[status] || "bg-gray-100 text-gray-600";
  };
  const handleReconnect = () => {
    if (!socket) return;

    socket.disconnect();
    socket.connect();
  };
  if (!task) return;
  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 flex ${open ? "" : "hidden"}`}
      onClick={onClose}
    >
      <div
        className="w-full mt-5 max-w-6xl mx-auto h-[90vh] flex bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT: Task Details */}
        <div className="w-1/3 border-r p-6 bg-gradient-to-b from-slate-50 to-white max-h-full overflow-y-auto">
          <div className="sticky top-0 pb-6">
            <div className="flex items-center gap-3 mb-6">
              <Avatar
                size={48}
                className="bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"
              >
                {task?.assignedBy?.name?.[0]?.toUpperCase()}
              </Avatar>
              <div>
                <h2 className="font-bold text-xl text-gray-900">
                  {task?.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border-indigo-200">
                    Task #{task?.TaskId}
                  </Badge>
                  <Badge color={getStatusColor(task?.status)}>
                    {task?.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Task Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                  Assignee
                </div>
                <div className="flex items-center gap-2">
                  <Avatar size={28}>{task?.assignedTo?.name?.[0]}</Avatar>
                  <span className="font-semibold">
                    {task?.assignedTo?.name}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                  Due Date
                </div>
                <Tag
                  color={
                    dayjs(task?.dueDate).isBefore(dayjs()) ? "red" : "green"
                  }
                >
                  {dayjs(task?.dueDate).format("MMM DD")}
                </Tag>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
                Progress
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Progress
                  percent={task?.checklistProgress || 0}
                  size="small"
                  showInfo={false}
                />
                <span className="text-sm font-medium">
                  {task?.completedChecklist || 0}/{task?.totalChecklist || 0}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mb-8">
              <Button block size="small" className="h-10 shadow-sm">
                <ClipboardList size={16} className="mr-2" />
                Checklist
              </Button>
              <Button
                block
                size="small"
                className="h-10 shadow-sm"
                disabled={!task?.attachmentFile}
              >
                <Paperclip size={16} className="mr-2" />
                Attachments ({task?.attachmentFile?.length || 0})
              </Button>
            </div>

            {/* Collapsible Description */}
            <Collapse ghost bordered={false} defaultActiveKey={["1"]}>
              <Panel header="Description" key="1">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {task?.description || "No description"}
                </p>
              </Panel>
            </Collapse>
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar.Group
                  maxCount={3}
                  maxStyle={{ color: "#f56a00", backgroundColor: "#fde3cf" }}
                >
                  {onlineUsers.map((u) => (
                    <Avatar key={u._id}>{u.name[0]}</Avatar>
                  ))}
                  <Avatar>{task.assignedBy?.name?.[0]}</Avatar>
                </Avatar.Group>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                  Task Conversation
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"
                    }`}
                  />
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-2">
                  {isConnected ? "Online" : "Disconnected"} · {messages.length}{" "}
                  messages
                  {/* 🔁 Reconnect button */}
                  {!isConnected && (
                    <button
                      onClick={handleReconnect}
                      className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-full 
               bg-gradient-to-r from-red-500 to-rose-500 
               text-white text-[11px] font-medium 
               shadow-md hover:shadow-lg 
               hover:scale-[1.02] transition-all duration-200"
                    >
                      {/* animated dot */}
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      Reconnect
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* <div className="flex gap-2">
              <Button size="small" icon={<Phone size={16} />}>
                Call
              </Button>
              <Button size="small" icon={<Video size={16} />}>
                Video
              </Button>
            </div> */}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Spin size="large" />
              </div>
            ) : messages.length === 0 ? (
              <Empty description="No messages yet" />
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.user._id === currentUser._id ? "justify-end" : "justify-start gap-3"}`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setReplyingTo(msg);
                  }}
                >
                  <div
                    className={`max-w-3xl p-4 rounded-2xl shadow-sm relative cursor-pointer hover:shadow-md transition-shadow ${
                      msg.user._id === currentUser._id
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm"
                        : "bg-white border rounded-bl-sm"
                    }`}
                    onMouseDown={(e) => {
                      if (e.detail === 2) {
                        // Double-click or long-press
                        setReplyingTo(msg);
                      }
                    }}
                  >
                    {msg.parentMessage && (
                      <div className="mb-2 p-2 rounded text-xs opacity-80 border-l-4 border-yellow-400">
                        <div className="font-semibold">
                          {msg.parentMessage.sender.name}
                        </div>
                        <div>{msg.parentMessage.text}</div>
                      </div>
                    )}
                    {msg.type === "query" ? (
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                            msg.assignedToMe
                              ? "bg-orange-500 ring-orange-200"
                              : "bg-yellow-500"
                          }`}
                        >
                          Q
                        </div>
                        <div className="flex-1">
                          <div className="font-bold mb-1 text-sm">
                            {msg.assignedToMe ? "YOUR QUERY" : "Query"}
                          </div>
                          <p className="mb-2 leading-relaxed">{msg.text}</p>
                          <div
                            className={`inline-block px-2 py-[2px] text-[10px] rounded-full mt-1 ${getStatusStyle(msg.status, msg.user._id === currentUser._id)}`}
                          >
                            {msg.status}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="leading-relaxed mb-3">{msg.text}</p>
                        <div className="flex items-center gap-2 text-xs opacity-90 justify-end">
                          {formatTime(msg.timestamp)}
                          {msg.seen && <CheckCircle2 size={14} />}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="border-t p-4 bg-white shadow-lg">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                {replyingTo && (
                  <div className="p-3 bg-gray-50 border rounded-lg mb-2 text-sm">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      Replying to{" "}
                      <span className="font-semibold">
                        {replyingTo.user.name}
                      </span>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="font-medium">{replyingTo.text}</p>
                  </div>
                )}
                <TextArea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    replyingTo ? "Reply..." : "Message task conversation..."
                  }
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={sending || !isConnected}
                />
              </div>
              <Button
                type="primary"
                size="large"
                icon={<Send size={20} />}
                onClick={sendMessage}
                loading={sending}
                disabled={!replyText.trim()}
                className="w-14 h-14 flex items-center justify-center shadow-lg"
              />
              <Button
                icon={<Smile size={20} />}
                size="large"
                className="w-14 h-14"
              />
            </div>
            <div className="flex items-center gap-2 text-xs mt-2 opacity-75">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
              />
              {isConnected ? "Connected" : "Reconnecting"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskChat;
