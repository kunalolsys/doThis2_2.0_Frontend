import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Cookies from "js-cookie";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Home,
  Shield,
  FolderKanban,
  BarChart3,
  Zap,
  Users2,
  TimerIcon,
  Database,
  ChartColumnDecreasing,
  SettingsIcon,
  Settings2Icon,
  ThermometerSnowflake,
  CalendarArrowDown,
  ClipboardCheck,
  Rocket,
  Eye,
  View,
  ClipboardMinus,
  Radiation,
  NotepadText,
  ListRestart,
  CalendarDays,
  Building2Icon,
  Briefcase,
  Send,
  GitBranch,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser } from "../redux/slices/user/userSlice";
import { logoutUser } from "../lib/authAPI";
import api from "../lib/api";
import { fetchCompany } from "../redux/slices/company/companySlice";
import { FormatPainterOutlined, UserSwitchOutlined } from "@ant-design/icons";

const Sidebar = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.users);
  const { company, loading, saving } = useSelector((state) => state.company);
  const role = Cookies.get("role") || "";
  const isSuper = role === "Super";
  useEffect(() => {
    const userFromCookie = {
      _id: Cookies.get("userId"),
      name: Cookies.get("name") || "",
      email: Cookies.get("email") || "",
      role: { name: Cookies.get("role") || "" }, // Ensure role is an object with a name property
      department: Cookies.get("departmentName"), // Ensure role is an object with a name property
      // Add other user properties from cookies if available
    };

    if (userFromCookie._id) {
      dispatch(setCurrentUser(userFromCookie));
    }
    dispatch(fetchCompany());
  }, [dispatch]);
  // Get user data from cookies
  const user = {
    name: Cookies.get("name") || "",
    role: { name: Cookies.get("role") || "" },
    email: Cookies.get("email") || "",
  };

  // Get permissions from cookies for efficient lookup
  const permissions = JSON.parse(Cookies.get("permissions") || "{}");
  const hasPermission = (permission) => {
    // If no user, deny permission
    if (!user.name) {
      return false;
    }

    // The 'Admin' role has all permissions.
    if (user.role.name === "Owner") {
      return true;
    }

    // Check if the permission key exists in the permissions object from cookies.
    // e.g., checks if permissions['setup_view'] is true
    return !!permissions[permission];
  };

  const toggleDropdown = (menu) => {
    // If sidebar is collapsed, expand it first
    if (isCollapsed) {
      setIsCollapsed(false);

      setOpenDropdowns({
        myDay: false,
        fmsEngine: false,
        reports: false,
        setup: false,
        delegate: false,
        [menu]: true,
      });

      return;
    }

    setOpenDropdowns((prev) => ({
      myDay: false,
      fmsEngine: false,
      reports: false,
      setup: false,
      delegate: false,
      [menu]: !prev[menu],
    }));
  };
  const handleLogout = async () => {
    await logoutUser();
    // Clear all relevant cookies
    Object.keys(Cookies.get()).forEach((cookieName) => {
      Cookies.remove(cookieName);
    });
    toast.success("Logged out successfully!");
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const isDashboardDropdownActive = ["/dashboard"].some((path) =>
    isActiveLink(path),
  );
  const isLogsDropdownActive = ["/logs"].some((path) => isActiveLink(path));
  const isMyBucketActive = ["/bucket/my-bucket"].some((path) =>
    isActiveLink(path),
  );

  const isMyDayDropdownActive = location.pathname.startsWith("/my-day");
  const isFmsEngineDropdownActive = location.pathname.startsWith("/fms-engine");
  const isReportsDropdownActive = location.pathname.startsWith("/reports");
  const isDelegationDropdownActive = location.pathname.startsWith("/delegate");
  const isSetupDropdownActive = location.pathname.startsWith("/setup");

  const sidebarWidth = isCollapsed ? "w-20" : "w-64";

  // Determine the label for Manager View based on user role
  const getManagerViewLabel = (userObj) => {
    if (!userObj || !userObj.role || !userObj.role.name) return ""; // Fallback for loading or no role
    const roleName = userObj.role.name;

    switch (roleName) {
      case "Super": // Admin also shows Owner View
        return "Super Admin";
      case "Manager":
        return "Manager View";
      case "Sr. Manager":
        return "Sr. Manager View";
      case "Owner":
        return "Owner View";
      case "Admin": // Admin also shows Owner View
        return "Admin View";
      default:
        return ""; // For 'Member' or other roles, hide the specific view
    }
  };

  // Filter My Day items based on user roles
  const myDayLinks = [
    { path: "/my-day/mytasks", label: "My Tasks", icon: ClipboardCheck },
    // { path: "/my-day/launchpad", label: "Launchpad", icon: Rocket },
  ];

  const managerViewLabel = getManagerViewLabel(user);
  if (managerViewLabel && !isSuper) {
    myDayLinks.push({
      path: "/my-day/view",
      label: managerViewLabel,
      icon: Eye,
    });
  }
  useEffect(() => {
    if (!company?.favicon) return;

    const link =
      document.querySelector("link[rel~='icon']") ||
      document.createElement("link");

    link.type = "image/png";
    link.rel = "icon";

    link.href = company.favicon.startsWith("http")
      ? company.favicon
      : `${import.meta.env.VITE_API_BASE_URL}${company.favicon}`;

    document.head.appendChild(link);
  }, [company?.favicon]);
  const [modules, setModules] = useState([]);
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await api.get("/setup/modules/list");
        const data = res.data?.data ?? res.data;
        setModules(Array.isArray(data) ? data : (data?.modules ?? []));
      } catch (e) {
        console.log(e?.response?.data?.message || "Failed to load modules");
      }
    };
    fetch_();
  }, []);
  const isModuleEnabled = (moduleKey) => {
    // ✅ Super user can access all modules
    if (isSuper) return true;

    return modules.some((m) => m.moduleKey === moduleKey && m.isEnabled);
  };
  const isBothDisable =
    !isModuleEnabled("DO_THIS2") && !isModuleEnabled("FMS_ENGINE");
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Sidebar */}
      <div
        className={`
                    relative bg-gradient-to-b from-white to-gray-50/80 
                    border-r border-gray-200/60 backdrop-blur-sm
                    transition-all duration-300 ease-in-out flex flex-col
                    shadow-xl shadow-blue-500/5 h-screen max-h-screen 
                    ${sidebarWidth}
                `}
      >
        {/* Header with Gradient */}
        <div
          className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-4 border-b border-gray-200/40 sticky top-0 bg-white z-10`}
        >
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div
                  className={`rounded-lg overflow-hidden flex items-center justify-center ${
                    company?.logo
                      ? "w-14 h-14 bg-white"
                      : "w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600"
                  }`}
                >
                  {company?.logo ? (
                    <img
                      src={
                        company.logo.startsWith("http")
                          ? company.logo
                          : `${import.meta.env.VITE_API_BASE_URL}${company.logo}`
                      }
                      alt={company.softwareName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Zap className="w-4 h-4 text-white" fill="white" />
                  )}
                </div>

                {!company?.logo && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-sm opacity-30 -z-10"></div>
                )}
              </div>
              <div>
                <span className="font-bold text-gray-800 text-lg bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {company?.softwareName || "Dothis2_2.0"}
                </span>

                {/* tagline */}
                {company?.tagline && (
                  <p className="text-xs text-gray-500 font-medium">
                    {company.tagline}
                  </p>
                )}

                <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-1 "></div>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-white/80 hover:bg-white border border-gray-200/60  cursor-pointer
                                 shadow-sm hover:shadow-md transition-all duration-200 
                                 hover:scale-105 backdrop-blur-sm"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Dashboard Section */}
          {/* {hasPermission('dashboard_view') && ( */}
          {!isBothDisable && (
            <div>
              <div className="relative">
                <Link
                  to="/dashboard"
                  className={`
                                    relative flex items-center w-full ${isCollapsed ? "justify-center" : ""} 
                                    rounded-xl px-3 py-2.5 transition-all duration-300 group
                                    backdrop-blur-sm border
                                    ${
                                      isDashboardDropdownActive
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
                                        : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
                                    }
                                `}
                >
                  <div
                    className={`relative ${isDashboardDropdownActive ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {isDashboardDropdownActive && (
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                    )}
                  </div>

                  {!isCollapsed && (
                    <span className="ml-2 font-medium flex-1 text-left text-sm">
                      Dashboard
                    </span>
                  )}
                </Link>
              </div>
            </div>
          )}
          {/* )} */}

          {/* My Day Link */}
          {/* {hasPermission('myday_view') && ( */}
          <div>
            <div className="relative">
              <button
                onClick={() => toggleDropdown("myDay")}
                className={`
                                    relative flex items-center w-full ${isCollapsed ? "justify-center" : ""} 
                                    rounded-xl px-3 py-2.5 transition-all duration-300 group
                                    backdrop-blur-sm border cursor-pointer
                                    ${
                                      isMyDayDropdownActive
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
                                        : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
                                    }
                                `}
              >
                <div
                  className={`relative ${isMyDayDropdownActive ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`}
                >
                  <CalendarArrowDown className="w-4 h-4" />
                </div>

                {!isCollapsed && (
                  <span className="ml-2 font-medium flex-1 text-left text-sm">
                    My Day
                  </span>
                )}

                {!isCollapsed && (
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-300 ${openDropdowns.myDay ? "rotate-180" : ""} ${isMyDayDropdownActive ? "text-white/80" : "text-gray-400"}`}
                  />
                )}
              </button>
              {openDropdowns.myDay && !isCollapsed && (
                <div className="ml-3 mt-1.5 space-y-1 pl-4 border-l-2 border-gray-200/40">
                  {myDayLinks.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                                                            flex items-center rounded-lg px-2 py-2 text-sm transition-all duration-200 group ${
                                                              isActiveLink(
                                                                item.path,
                                                              )
                                                                ? "text-blue-600 bg-blue-50/80 border border-blue-200/60"
                                                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
                                                            }
                                                                            `}
                    >
                      <item.icon
                        className={`w-3 h-3 mr-2 ${isActiveLink(item.path) ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"}`}
                      />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}{" "}
            </div>
          </div>
          {/* )} */}

          {/* Delegation Task Section */}
          {hasPermission("delegation_task_view") &&
            isModuleEnabled("DO_THIS2") && (
              <>
                <Link
                  to="/delegation-tasks"
                  className={`
                                relative flex items-center ${isCollapsed ? "justify-center" : ""} 
                                rounded-xl px-3 py-2.5 transition-all duration-300 group
                                backdrop-blur-sm border
                                ${
                                  isActiveLink("/delegation-tasks")
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
                                    : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
                                }
                                    `}
                >
                  <div
                    className={`relative ${isActiveLink("/delegation-tasks") ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    {isActiveLink("/delegation-tasks") && (
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full border border-white"></div>
                    )}
                  </div>

                  {!isCollapsed && (
                    <span className="ml-2 font-medium text-sm">
                      Delegation Task
                    </span>
                  )}
                </Link>
              </>
            )}
          {hasPermission("task_reassigning_view") &&
            isModuleEnabled("DO_THIS2") && (
              <Link
                to="/reassign"
                className={`
                                relative flex items-center ${isCollapsed ? "justify-center" : ""} 
                                rounded-xl px-3 py-2.5 transition-all duration-300 group
                                backdrop-blur-sm border
                                ${
                                  isActiveLink("/reassign")
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
                                    : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
                                }
                            `}
              >
                <div
                  className={`relative ${isActiveLink("/reassign") ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`}
                >
                  <UserSwitchOutlined className="w-4 h-4" />
                  {isActiveLink("/reassign") && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full border border-white"></div>
                  )}
                </div>

                {!isCollapsed && (
                  <span className="ml-2 font-medium text-sm">
                    Task Reassignment
                  </span>
                )}
              </Link>
            )}

          {/* FMS Engine */}
          {hasPermission("fms_engine_view") &&
            isModuleEnabled("FMS_ENGINE") && (
              <div>
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown("fmsEngine")}
                    className={`
                                    relative flex items-center w-full ${isCollapsed ? "justify-center" : ""} 
                                    rounded-xl px-3 py-2.5 transition-all duration-300 group
                                    backdrop-blur-sm border cursor-pointer
                                    ${
                                      isFmsEngineDropdownActive
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
                                        : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
                                    }
                                `}
                  >
                    <div
                      className={`relative ${isFmsEngineDropdownActive ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`}
                    >
                      <Settings2Icon className="w-4 h-4" />
                    </div>

                    {!isCollapsed && (
                      <span className="ml-2 font-medium flex-1 text-left text-sm">
                        FMS Engine
                      </span>
                    )}

                    {!isCollapsed && (
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-300 ${openDropdowns.fmsEngine ? "rotate-180" : ""} ${isFmsEngineDropdownActive ? "text-white/80" : "text-gray-400"}`}
                      />
                    )}
                  </button>
                  {openDropdowns.fmsEngine && !isCollapsed && (
                    <div className="ml-3 mt-1.5 space-y-1 pl-4 border-l-2 border-gray-200/40">
                      {[
                        {
                          path: "/fms-engine/templates",
                          label: "FMS Templates",
                          icon: Shield,
                        },
                        {
                          path: "/fms-engine/launch",
                          label: "Launch FMS",
                          icon: User,
                        },
                        {
                          path: "/fms-engine/upcoming",
                          label: "Upcoming & Ongoing FMSs",
                          icon: ListRestart,
                        },
                        {
                          path: "/form-builder",
                          label: "Form Builder",
                          icon: FormatPainterOutlined,
                        },
                        {
                          path: "/form-submissions",
                          label: "Responses",
                          icon: ClipboardCheck,
                        },
                      ].map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`
                                                       flex items-center rounded-lg px-2 py-2 text-sm transition-all duration-200 group
                                                                                ${
                                                                                  isActiveLink(
                                                                                    item.path,
                                                                                  )
                                                                                    ? "text-blue-600 bg-blue-50/80 border border-blue-200/60"
                                                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
                                                                                }
                                                                            `}
                        >
                          <item.icon
                            className={`w-3 h-3 mr-2 ${isActiveLink(item.path) ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"}`}
                          />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}{" "}
                </div>
              </div>
            )}

          {/* Reports */}
          {hasPermission("reports_view") && !isBothDisable && (
            <div>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("reports")}
                  className={`
                                    relative flex items-center w-full ${isCollapsed ? "justify-center" : ""} 
                                    rounded-xl px-3 py-2.5 transition-all duration-300 group
                                    backdrop-blur-sm border cursor-pointer
                                    ${
                                      isReportsDropdownActive
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
                                        : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
                                    }
                                `}
                >
                  <div
                    className={`relative ${isReportsDropdownActive ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`}
                  >
                    <ChartColumnDecreasing className="w-4 h-4" />
                  </div>

                  {!isCollapsed && (
                    <span className="ml-2 font-medium flex-1 text-left text-sm">
                      Reports
                    </span>
                  )}

                  {!isCollapsed && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-300 ${openDropdowns.reports ? "rotate-180" : ""} ${isReportsDropdownActive ? "text-white/80" : "text-gray-400"}`}
                    />
                  )}
                </button>
                {/* { path: '/reports/fms', label: 'FMS Reports', icon: NotepadText, permission: 'fms_reports_view' }, */}
                {openDropdowns.reports && !isCollapsed && (
                  <div className="ml-3 mt-1.5 space-y-1 pl-4 border-l-2 border-gray-200/40">
                    {[
                      ...(isModuleEnabled("DO_THIS2")
                        ? [
                            {
                              path: "/reports/mis",
                              label: "MIS Reports",
                              icon: NotepadText,
                            },
                          ]
                        : []),

                      ...(isModuleEnabled("FMS_ENGINE") &&
                      hasPermission("fms_engine_view")
                        ? [
                            {
                              path: "/reports/fms",
                              label: "FMS Reports",
                              icon: NotepadText,
                            },
                          ]
                        : []),
                    ]
                      // .filter(item => hasPermission(item.permission))
                      .map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`
                                                                                flex items-center rounded-lg px-2 py-2 text-sm transition-all duration-200 group
                                                                                ${
                                                                                  isActiveLink(
                                                                                    item.path,
                                                                                  )
                                                                                    ? "text-blue-600 bg-blue-50/80 border border-blue-200/60"
                                                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
                                                                                }
                                                                            `}
                        >
                          <item.icon
                            className={`w-3 h-3 mr-2 ${isActiveLink(item.path) ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"}`}
                          />
                          {item.label}
                        </Link>
                      ))}
                  </div>
                )}{" "}
              </div>
            </div>
          )}
          {/* <div>
            <div className="relative">
              <Link
                to="/logs"
                className={`
                                    relative flex items-center w-full ${isCollapsed ? "justify-center" : ""} 
                                    rounded-xl px-3 py-2.5 transition-all duration-300 group
                                    backdrop-blur-sm border
                                    ${
                                      isLogsDropdownActive
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
                                        : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
                                    }
                                `}
              >
                <div
                  className={`relative ${isLogsDropdownActive ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {isLogsDropdownActive && (
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                  )}
                </div>

                {!isCollapsed && (
                  <span className="ml-2 font-medium flex-1 text-left text-sm">
                    Logs
                  </span>
                )}
              </Link>
            </div>
          </div> */}
          {hasPermission("my_bucket_view") && isModuleEnabled("DO_THIS2") && (
            <div>
              <div className="relative">
                <Link
                  to="/bucket/my-bucket"
                  className={`
                                    relative flex items-center w-full ${isCollapsed ? "justify-center" : ""} 
                                    rounded-xl px-3 py-2.5 transition-all duration-300 group
                                    backdrop-blur-sm border
                                    ${
                                      isMyBucketActive
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
                                        : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
                                    }
                                `}
                >
                  <div
                    className={`relative ${isMyBucketActive ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {isMyBucketActive && (
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                    )}
                  </div>

                  {!isCollapsed && (
                    <span className="ml-2 font-medium flex-1 text-left text-sm">
                      My Bucket
                    </span>
                  )}
                </Link>
              </div>
            </div>
          )}
          {hasPermission("bucket_view") && isModuleEnabled("DO_THIS2") && (
            <div>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("delegate")}
                  className={`
          relative flex items-center w-full ${isCollapsed ? "justify-center" : ""} 
          rounded-xl px-3 py-2.5 transition-all duration-300 group
          backdrop-blur-sm border cursor-pointer
          ${
            isDelegationDropdownActive
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
              : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
          }
        `}
                >
                  <div
                    className={`relative ${
                      isDelegationDropdownActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-blue-500"
                    }`}
                  >
                    <GitBranch className="w-4 h-4" />
                  </div>

                  {!isCollapsed && (
                    <span className="ml-2 font-medium flex-1 text-left text-sm">
                      Delegation Buckets{" "}
                    </span>
                  )}

                  {!isCollapsed && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-300 ${
                        openDropdowns.delegate ? "rotate-180" : ""
                      } ${
                        isDelegationDropdownActive
                          ? "text-white/80"
                          : "text-gray-400"
                      }`}
                    />
                  )}
                </button>

                {openDropdowns.delegate && !isCollapsed && (
                  <div className="ml-3 mt-1.5 space-y-1 pl-4 border-l-2 border-gray-200/40">
                    {[
                      {
                        path: "/delegate/task-buckets",
                        label: "Task Buckets",
                        icon: Briefcase,
                      },
                      {
                        path: "/delegate/bucket-view",
                        label: "Buckets",
                        icon: Send,
                      },
                      {
                        path: "/delegate/audience-master",
                        label: "Manage Assignee",
                        icon: Users,
                      },
                    ].map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                flex items-center rounded-lg px-2 py-2 text-sm transition-all duration-200 group
                ${
                  isActiveLink(item.path)
                    ? "text-blue-600 bg-blue-50/80 border border-blue-200/60"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
                }
              `}
                      >
                        <item.icon
                          className={`w-3 h-3 mr-2 ${
                            isActiveLink(item.path)
                              ? "text-blue-500"
                              : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        />

                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Setup Section */}
          {hasPermission("setup_view") && !isBothDisable && (
            <div>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("setup")}
                  className={`
                                    relative flex items-center w-full ${isCollapsed ? "justify-center" : ""} 
                                    rounded-xl px-3 py-2.5 transition-all duration-300 group
                                    backdrop-blur-sm border cursor-pointer
                                    ${
                                      isSetupDropdownActive
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
                                        : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
                                    }
                                `}
                >
                  <div
                    className={`relative ${isSetupDropdownActive ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`}
                  >
                    <Settings className="w-4 h-4" />
                  </div>

                  {!isCollapsed && (
                    <span className="ml-2 font-medium flex-1 text-left text-sm">
                      Setup
                    </span>
                  )}

                  {!isCollapsed && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-300 ${openDropdowns.setup ? "rotate-180" : ""} ${isSetupDropdownActive ? "text-white/80" : "text-gray-400"}`}
                    />
                  )}
                </button>

                {openDropdowns.setup && !isCollapsed && (
                  <div className="ml-3 mt-1.5 space-y-1 pl-4 border-l-2 border-gray-200/40">
                    {[
                      {
                        path: "/setup/roles-permissions",
                        label: "Roles & Permissions",
                        icon: Shield,
                      },
                      {
                        path: "/setup/departments-calendar",
                        label: "Departments & Calendar",
                        icon: CalendarDays,
                      },
                      {
                        path: "/setup/work-shifts",
                        label: "Work Shifts",
                        icon: TimerIcon,
                      },
                      { path: "/setup/users", label: "Users", icon: Users2 },
                      // ✅ show only if module enabled
                      ...(isModuleEnabled("COMPANY_SETUP") &&
                      hasPermission("company_setup_view")
                        ? [
                            {
                              path: "/company-setup",
                              label: "Company Setup",
                              icon: Building2Icon,
                            },
                          ]
                        : []),
                      // { path: '/setup/data-masters', label: 'Data Masters', icon: Database }
                    ].map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                                                             flex items-center rounded-lg px-2 py-2 text-sm transition-all duration-200 group
                                                                                ${
                                                                                  isActiveLink(
                                                                                    item.path,
                                                                                  )
                                                                                    ? "text-blue-600 bg-blue-50/80 border border-blue-200/60"
                                                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
                                                                                }
                                                                            `}
                      >
                        <item.icon
                          className={`w-3 h-3 mr-2 ${isActiveLink(item.path) ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"}`}
                        />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {isSuper && (
            <Link
              to="/super/modules"
              className={`
                                relative flex items-center ${isCollapsed ? "justify-center" : ""} 
                                rounded-xl px-3 py-2.5 transition-all duration-300 group
                                backdrop-blur-sm border
                                ${
                                  isActiveLink("/super/modules")
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-400"
                                    : "bg-white/80 text-gray-600 hover:bg-white border-gray-200/60 hover:border-gray-300/80 hover:shadow-lg"
                                }
                            `}
            >
              <div
                className={`relative ${isActiveLink("/super/modules") ? "text-white" : "text-gray-400 group-hover:text-blue-500"}`}
              >
                <Settings className="w-4 h-4" />
                {isActiveLink("/super/modules") && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full border border-white"></div>
                )}
              </div>

              {!isCollapsed && (
                <span className="ml-2 font-medium text-sm">Module Setting</span>
              )}
            </Link>
          )}
        </nav>

        {/* Enhanced Bottom Menu */}
        <div className="p-3 border-t border-gray-200/40 space-y-1 bg-white/50 backdrop-blur-sm">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="
                        flex items-center w-full rounded-xl px-3 py-2.5 transition-all duration-300 group
                        bg-white/80 text-gray-600 hover:bg-red-50/80 hover:text-red-700
                        border border-gray-200/60 hover:border-red-200/80 hover:shadow-lg
                        backdrop-blur-sm cursor-pointer
                    "
          >
            <div className="relative">
              <LogOut className="w-3 h-3 text-gray-400 group-hover:text-red-500 transition-colors" />
            </div>
            {!isCollapsed && (
              <span className="ml-2 font-medium text-sm">Logout</span>
            )}
          </button>
        </div>

        {/* Floating Accent */}
        <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100/80">
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
