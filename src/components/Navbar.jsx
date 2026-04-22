import React, { useState } from "react";
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Menu,
} from "lucide-react";
import Cookies from "js-cookie";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { useSocket } from "../context/SocketContext";
import NotificationBadge from "./NotificationBadge";
import NotificationModal from "./NotificationModal";
import { logoutUser } from "../lib/authAPI";

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const {
    users,
    currentUser,
    status: userStatus,
    error: userError,
  } = useSelector((state) => state.users);
  const userName = Cookies.get("name") || "User";
  const userEmail = Cookies.get("email") || "user@example.com";
  const userInitial = userName.charAt(0).toUpperCase();
  const role = Cookies.get("role") || "";
  const handleLogout = async () => {
    // Clear all relevant cookies
    await logoutUser();
    Object.keys(Cookies.get()).forEach((cookieName) => {
      Cookies.remove(cookieName);
    });
    toast.success("Logged out successfully!");
  };
  const roleColors = {
    Owner: "bg-red-100 text-red-700",
    Admin: "bg-blue-100 text-blue-700",
    "Sr. Manager": "bg-purple-100 text-purple-700",
    Manager: "bg-green-100 text-green-700",
    Member: "bg-gray-100 text-gray-700",
  };
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2 shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left Side - Dashboard Title */}
        <div className="flex items-center space-x-4">
          <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Role Badge */}
          {role && (
            <span
              className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full font-semibold shadow-sm ${
                roleColors[role] || "bg-gray-100 text-gray-700"
              }`}
            >
              👤 {role || "No Role"}
            </span>
          )}
        </div>

        {/* Right Side - Welcome Message and Profile */}
        <div className="flex items-center space-x-4">
          {/* Welcome Message and Profile */}
          <div className="flex items-center gap-2">
            {/* Notification Badge */}
            <NotificationBadge onClick={() => setShowNotifications(true)} />

            <div className="hidden sm:block text-right">
              <p className={`text-md font-medium px-4 py-1  `}>
                Welcome, {userName}!
              </p>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userInitial}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-medium text-gray-900 truncate">
                      {userName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {userEmail}
                    </p>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                  </div>

                  <div className="p-2 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {/* <div className="mt-4 md:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div> */}

      {/* Overlay for dropdowns */}
      <NotificationModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {(isProfileOpen || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false);
            setShowNotifications(false);
          }}
        ></div>
      )}
    </div>
  );
};

export default Navbar;
