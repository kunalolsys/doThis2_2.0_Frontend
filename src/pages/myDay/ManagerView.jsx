import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyTasks,
  fetchTaskCounts,
  getFilterTasks,
  getRoleBasedTasks,
} from "../../redux/slices/myTask/myTaskSlice.js";
import api from "../../lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  History,
  Search,
  Download,
  RefreshCcw,
  AlertCircle,
  Clock,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import * as XLSX from "xlsx";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { Progress } from "../../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Checkbox } from "../../components/ui/checkbox";
import { useDebounce } from "../../lib/debounce.js";
import ViewLink from "./attachmentViewer.jsx";
import { formatDate } from "../../lib/utilFunctions.js";
import { fetchTasksWithStats } from "../../redux/slices/task/taskSlice.js";

// --- Helper Components ---

// Priority Badge
const PriorityBadge = ({ priority }) => {
  const config = {
    high: { label: "High", class: "bg-red-100 text-red-800 border-red-200" },
    medium: {
      label: "Medium",
      class: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    low: {
      label: "Low",
      class: "bg-green-100 text-green-800 border-green-200",
    },
  };

  const { label, class: className } =
    config[priority?.toLowerCase()] || config.medium;

  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
};

// Status Badges with icons
const getStatusBadge = (status) => {
  switch (status) {
    case "Overdue":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {status}
        </Badge>
      );
    case "Due Today":
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 text-yellow-600 border-yellow-300 bg-yellow-50"
        >
          <Clock className="h-3 w-3" />
          {status}
        </Badge>
      );
    case "Completed":
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 text-green-600 border-green-300 bg-green-50"
        >
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Enhanced View Link
// const ViewLink = ({ file }) => {
//   if (!file) {
//     return <span className="text-gray-500 text-xs">NA</span>;
//   }

//   const handleAttachmentDownload = (attachmentFile) => {
//     const apiBaseUrl =
//       import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
//     const serverBaseUrl = apiBaseUrl.replace("/api/v1", "");
//     const attachmentUrl = `${serverBaseUrl}/download/${attachmentFile}`;

//     const link = document.createElement("a");
//     link.href = attachmentUrl;
//     link.setAttribute("download", attachmentFile);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   return (
//     <Button
//       variant="link"
//       className="p-0 h-auto text-blue-600"
//       onClick={() => handleAttachmentDownload(file)}
//     >
//       <Download className="mr-1 h-3 w-3" />
//       Download
//     </Button>
//   );
// };

// Enhanced Today's Task Actions
const TodayTaskActions = ({ task, onChecklist, onFillForm }) => (
  <TooltipProvider>
    <div className="flex gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-600 hover:bg-gray-50"
            onClick={() => onChecklist(task)}
            disabled={!task.checklist || task.checklist.length === 0}
          >
            <ClipboardList className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View Checklist</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
            onClick={() => onFillForm(task)}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Fill Form</p>
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);

// Task Progress Component
const TaskProgress = ({ completed, total }) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <Progress value={percentage} className="w-24" />
      <span className="text-sm text-gray-600">
        {completed}/{total}
      </span>
    </div>
  );
};

// Stats Cards Component
const StatsCards = ({ counts, selectedStat, onStatClick }) => {
  const getCardClass = (type, color) => `
    cursor-pointer transition-all duration-200 transform hover:scale-105
    ${selectedStat === type ? `ring-2 ring-${color}-500 shadow-lg` : ""}
  `;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card
        className={`${getCardClass("total", "blue")} bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200`}
        onClick={() => onStatClick("total")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Assigned
              </p>
              <p className="text-2xl font-bold text-blue-700">{counts.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card
        className={`${getCardClass("overdue", "red")} bg-gradient-to-br from-red-50 to-red-100 border-red-200`}
        onClick={() => onStatClick("overdue")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Overdue</p>
              <p className="text-2xl font-bold text-red-700">
                {counts.overdue}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card
        className={`${getCardClass("completed", "green")} bg-gradient-to-br from-green-50 to-green-100 border-green-200`}
        onClick={() => onStatClick("completed")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-700">
                {counts.completed}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card
        className={`${getCardClass("dueToday", "purple")} bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200`}
        onClick={() => onStatClick("dueToday")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Due Today</p>
              <p className="text-2xl font-bold text-purple-700">
                {counts.dueToday}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FilterBar = ({
  searchTerm,
  setSearchTerm,
  selectedFilterStatus,
  setSelectedFilterStatus,
  showExport = false,
  onExport,
  isExporting,
  doers,
  managers,
  srManagers,
  selectedDoer,
  setSelectedDoer,
  selectedManager,
  setSelectedManager,
  selectedSrManager,
  setSelectedSrManager,
  currentUser,
}) => {
  const handleFilterChange = (setter, value) => {
    setter(value);
    // Logic to reset other filters so only one user filter is active at a time
    if (setter !== setSelectedDoer) setSelectedDoer("all");
    if (setter !== setSelectedManager) setSelectedManager("all");
    if (setter !== setSelectedSrManager) setSelectedSrManager("all");
  };

  const userRole = currentUser?.role?.name;
  const isAdminOrOwner = userRole === "Admin" || userRole === "Owner";
  const isSrManager = userRole === "Sr. Manager";

  return (
    <div className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 rounded-lg border">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by Task ID or Title..."
          className="pl-10 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 flex-[2]">
        {/* All Doers Filter - Always visible */}
        <Select
          value={selectedDoer}
          onValueChange={(val) => handleFilterChange(setSelectedDoer, val)}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="All Doers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-semibold text-blue-700">
              All Doers
            </SelectItem>
            {doers.map((doer) => (
              <SelectItem key={doer._id} value={doer._id}>
                {doer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* All Managers Filter - Visible to Admin, Owner, Sr. Manager */}
        {(isAdminOrOwner || isSrManager) && (
          <Select
            value={selectedManager}
            onValueChange={(val) => handleFilterChange(setSelectedManager, val)}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="All Managers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-semibold text-green-700">
                All Managers
              </SelectItem>
              {managers.map((manager) => (
                <SelectItem key={manager._id} value={manager._id}>
                  {manager.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* All Sr. Managers Filter - Visible to Admin, Owner */}
        {isAdminOrOwner && (
          <Select
            value={selectedSrManager}
            onValueChange={(val) =>
              handleFilterChange(setSelectedSrManager, val)
            }
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="All Sr. Managers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-semibold text-purple-700">
                All Sr. Managers
              </SelectItem>
              {srManagers.map((srManager) => (
                <SelectItem key={srManager._id} value={srManager._id}>
                  {srManager.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={selectedFilterStatus}
          onValueChange={setSelectedFilterStatus}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Due Today">Due Today</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showExport && (
        <Button
          className="bg-gray-800 hover:bg-gray-900 text-white whitespace-nowrap"
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Exporting...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Export CSV
            </>
          )}
        </Button>
      )}
    </div>
  );
};

// --- Helper: Pagination ---
const Pagination = ({
  totalItems,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  onPageChange,
  isLoading,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4 px-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Rows per page:</span>
        <Select
          value={String(itemsPerPage)}
          onValueChange={(val) => {
            setItemsPerPage(Number(val));
            onPageChange(1);
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[70px] h-8 bg-white">
            <SelectValue placeholder={itemsPerPage} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 font-medium mr-2">
          Page <span className="font-bold">{currentPage}</span> of{" "}
          <span className="font-bold">{totalPages || 1}</span>
        </span>
        <Button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoading}
          variant="outline"
          size="sm"
          className="h-8"
        >
          Previous
        </Button>
        <Button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isLoading}
          variant="outline"
          size="sm"
          className="h-8"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

// --- Main Component ---
const ManagerView = () => {
  const dispatch = useDispatch();
  const {
    tasks: fetchedTasks,
    taskCounts,
    status,
    totalTasks,
  } = useSelector((state) => state.myTasks);
  const { currentUser } = useSelector((state) => state.users);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilterStatus, setSelectedFilterStatus] = useState("all");
  const [selectedDoer, setSelectedDoer] = useState("all");
  const [selectedManager, setSelectedManager] = useState("all");
  const [selectedSrManager, setSelectedSrManager] = useState("all");
  const [selectedAssignor, setSelectedAssignor] = useState("all");
  const [activeTab, setActiveTab] = useState("today");
  const [selectedStatFilter, setSelectedStatFilter] = useState(null);
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(10);
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [fullDescription, setFullDescription] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [doers, setDoers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [srManagers, setSrManagers] = useState([]);

  // Dialog states for new actions
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [selectedTaskForChecklist, setSelectedTaskForChecklist] =
    useState(null);
  const [checklistItems, setChecklistItems] = useState([]);

  const [isFillFormDialogOpen, setIsFillFormDialogOpen] = useState(false);
  const [selectedTaskForForm, setSelectedTaskForForm] = useState(null);

  const getViewHeading = () => {
    if (!currentUser || !currentUser.role) return "View";
    const roleName = currentUser.role.name;
    switch (roleName) {
      case "Manager":
        return "Manager View";
      case "Sr. Manager":
        return "Sr. Manager View";
      case "Owner":
      case "Admin":
        return "Admin View";
      default:
        return "View";
    }
  };
  const viewHeading = getViewHeading();

  // --- Initial Data Load (Task Counts) ---
  useEffect(() => {
    if (currentUser?._id) {
      const fetchCountsParams = {
        view: "manager",
        assignorId: currentUser._id,
      };
      dispatch(fetchTaskCounts(fetchCountsParams));
      setSelectedAssignor(currentUser._id); // Set the current user as the default assignor
    }
  }, [currentUser, dispatch]);
  //**Fetch counts for stats */
  const [allTaskForDashboard, setAllTaskForDashboard] = useState(null);

  const fetchTasksForDashboard = async () => {
    try {
      const res = await dispatch(
        fetchTasksWithStats({
          userId: currentUser._id,
          role: currentUser.role?.name,
        }),
      ).unwrap();
      setAllTaskForDashboard(res);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchTasksForDashboard();
  }, [currentUser]);
  
  // --- Fetch Users for Filters ---
  const [allUsers, setAllUsers] = useState([]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/setup/users/allUsers");
        const users = response.data?.data || [];
        setAllUsers(users);
        // ✅ FILTER BY ROLE
        const doers = users.filter((u) => u.role?.name === "Member");

        const managers = users.filter((u) => u.role?.name === "Manager");

        const srManagers = users.filter((u) => u.role?.name === "Sr. Manager");

        // ✅ SET STATE
        setDoers(doers);
        setManagers(managers);
        setSrManagers(srManagers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Could not load users.");
      }
    };

    if (currentUser?._id) {
      fetchUsers();
    }
  }, [currentUser]);

  // --- HANDLER: Stats Card Click ---
  const handleStatClick = (statType) => {
    // Update UI filters
    if (statType === "dueToday" || statType === "overdue") {
      setSelectedStatFilter(statType);
      // Set the status filter to match the stat card clicked
      const statusMap = { dueToday: "Due Today", overdue: "Overdue" };
      setSelectedFilterStatus(statusMap[statType]);
    } else if (statType === "completed") {
      setSelectedStatFilter(statType);
      setSelectedFilterStatus("Completed");
    } else {
      setSelectedStatFilter(statType);
      setSelectedFilterStatus("all");
    }
    setLocalCurrentPage(1);
    setSearchTerm("");

    // Sync visual tab
    if (statType === "completed") setActiveTab("completed");
    else if (statType === "overdue" || statType === "dueToday")
      setActiveTab("today");
  };
  const debouncedSearch = useDebounce(searchTerm);
  // --- CORE LOGIC: Get Fetch Params ---
  const getFetchParams = () => {
    const params = {
      page: localCurrentPage,
      limit: localItemsPerPage,
      search: searchTerm,
      view: "manager",
      creatorOrAssignorId: currentUser._id,
      type: undefined,
    };

    // 1. Handle User Filters (Doer/Manager)
    // Map to API params: userId (assigned to), assignedBy (assigned by manager)
    if (selectedDoer !== "all") params.userId = selectedDoer;
    if (selectedManager !== "all") params.assignedBy = selectedManager;
    if (selectedSrManager !== "all") params.assignedBy = selectedSrManager;

    // 2. Handle Stats Card Filters (High Priority)
    if (selectedStatFilter) {
      switch (selectedStatFilter) {
        case "overdue":
          // Fetch tasks with status 'Overdue'
          params.status = "Overdue";
          break;
        case "dueToday":
          // Fetch tasks with status 'Due Today'
          params.status = "Due Today";
          break;
        case "completed":
          // Fetch all completed tasks
          params.taskCategory = "completed";
          params.status = "Completed";
          params.page = 1;
          params.limit = 1000;
          break;
        case "total":
          // Fetch ALL assigned tasks for manager view (client-side paginate/filter)
          params.status = undefined;
          break;
        default:
          params.taskCategory = "today_backlog";
          break;
      }
    }
    // 3. Handle Standard Tab & Dropdown Filters (Low Priority)
    else {
      // Use the dropdown status if selected
      params.status =
        selectedFilterStatus === "all" ? undefined : selectedFilterStatus;

      // Logic based on active Tab
      switch (activeTab) {
        case "today":
          params.taskCategory = "today_backlog";
          if (selectedFilterStatus === "all") params.status = "Pending";
          break;

        case "upcoming":
          params.taskCategory = "upcoming";
          break;

        case "completed":
          params.taskCategory = "completed";
          params.status = "Completed";
          break;

        case "escalated":
          params.taskCategory = "escalated";
          params.isEscalated = true;
          break;

        default:
          params.taskCategory = "today_backlog";
          params.status = "Pending";
      }
    }
    return params;
  };
  const getDepartmentIds = (department) => {
    try {
      const parsed =
        typeof department === "string" ? JSON.parse(department) : department;

      if (!Array.isArray(parsed)) return [];

      return parsed.map((dep) => (typeof dep === "object" ? dep._id : dep));
    } catch (e) {
      return [];
    }
  };
  const departmentId = getDepartmentIds(currentUser?.department);
  // --- Fetch Trigger ---
  useEffect(() => {
    if (currentUser?._id) {
      // dispatch(fetchMyTasks(getFetchParams()));
      dispatch(
        getRoleBasedTasks({
          userId: currentUser._id,
          role: currentUser.role?.name, // ✅ REQUIRED
          departmentId: departmentId,
          page: localCurrentPage,
          limit: localItemsPerPage,
          selectedDoer,
          selectedManager,
          selectedSrManager,
          search: debouncedSearch,
          filters: {
            // 📊 STAT FILTER
            stat: selectedStatFilter || null,

            // 📌 TAB FILTER
            taskCategory: selectedStatFilter
              ? null
              : activeTab === "today"
                ? "today_backlog"
                : activeTab === "upcoming"
                  ? "upcoming"
                  : activeTab === "completed"
                    ? "completed"
                    : null,

            // 📊 STATUS
            status:
              selectedFilterStatus === "all" ? null : selectedFilterStatus,
          },
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUser,
    dispatch,
    activeTab,
    selectedStatFilter,
    selectedFilterStatus,
    selectedDoer,
    selectedManager,
    selectedSrManager,
    localCurrentPage,
    localItemsPerPage,
    debouncedSearch,
  ]);

  // --- Client-side Search Function (backup) ---
  const handleClientSideSearch = (tasks, term) => {
    if (!term || !term.trim()) return tasks;
    const searchTermLower = term.toLowerCase().trim();
    return tasks.filter((task) => {
      const taskId = (task.TaskId || "").toLowerCase();
      const title = (task.title || "").toLowerCase();
      const description = (task.description || "").toLowerCase();
      return (
        taskId.includes(searchTermLower) ||
        title.includes(searchTermLower) ||
        description.includes(searchTermLower)
      );
    });
  };

  // --- Prepare tasks for display (client-side pagination for today/all) ---
  // const { tasksForDisplay, totalPaginationCount } = useMemo(() => {
  //   // Helpers
  //   const isSameDay = (d1, d2) =>
  //     d1.getFullYear() === d2.getFullYear() &&
  //     d1.getMonth() === d2.getMonth() &&
  //     d1.getDate() === d2.getDate();
  //   const endOfToday = (() => {
  //     const t = new Date();
  //     t.setHours(23, 59, 59, 999);
  //     return t;
  //   })();

  //   // For 'today' tab and when certain stat filters are selected we prefer client-side pagination/filtering
  //   if (
  //     false // Disable complex client-side filtering for now to rely on server
  //   ) {
  //     // This block is now disabled. The logic below will run instead.
  //     // Kept for reference if client-side logic is needed again.
  //   }

  //   // Otherwise rely on server-side pagination
  //   let tasks = fetchedTasks || [];
  //   if (searchTerm && searchTerm.trim())
  //     tasks = handleClientSideSearch(tasks, searchTerm);
  //   return { tasksForDisplay: tasks, totalPaginationCount: totalTasks || 0 };
  // }, [
  //   fetchedTasks,
  //   searchTerm,
  //   activeTab,
  //   selectedStatFilter,
  //   localCurrentPage,
  //   localItemsPerPage,
  //   totalTasks,
  // ]);

  const allowedRoles = ["Admin", "Owner", "Sr. Manager", "Manager"];
  const hasAccess =
    currentUser &&
    currentUser.role &&
    allowedRoles.includes(currentUser.role.name);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <RefreshCcw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="p-8 shadow-lg text-center">
          <CardTitle className="text-red-600 mb-4">Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to view this page.
          </CardDescription>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  // --- Handlers ---
  const handleTabChange = (value) => {
    setActiveTab(value);
    setSelectedStatFilter(null);
    setSelectedFilterStatus("all");
    setLocalCurrentPage(1);
    setSearchTerm("");
    setSelectedDoer("all");
    setSelectedManager("all");
    setSelectedSrManager("all");
  };

  const handleChecklistClick = (task) => {
    setSelectedTaskForChecklist(task);
    setChecklistItems(task.checklist || []);
    setIsChecklistDialogOpen(true);
  };

  const handleFillFormClick = (task) => {
    setSelectedTaskForForm(task);
    setIsFillFormDialogOpen(true);
  };

  const handleViewDescription = (desc) => {
    setFullDescription(desc);
    setIsDescriptionDialogOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const dataToExport = fetchedTasks.map((task, index) => ({
        "Sr. No.": (localCurrentPage - 1) * localItemsPerPage + index + 1,
        "Task ID": task.TaskId || "-",
        "Task Title": task.title || "-",
        "Assigned To": task.assignedTo?.name || "-",
        Description: task.description || "-",
        Type: task.taskType || "-",
        Attachment: task.attachmentFile ? "Yes" : "No",
        "Start Date": task.startDate
          ? new Date(task.startDate).toLocaleDateString()
          : "-",
        "Due Date": task.dueDate
          ? new Date(task.dueDate).toLocaleDateString()
          : "-",
        Status: task.status || "-",
      }));

      if (dataToExport.length === 0) {
        toast.warning("No data to export");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ManagerTasks");
      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `ManagerTasks_${timestamp}.xlsx`);
      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  // --- Common Table Headers for all tabs ---
  const CommonTableHeaders = () => (
    <TableHeader>
      <TableRow>
        <TableHead>Sr. No.</TableHead>
        <TableHead>Task Id</TableHead>
        <TableHead>Task Title</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Assigned By</TableHead>
        <TableHead>Assigned To</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Attachment</TableHead>
        <TableHead>Start Date</TableHead>
        <TableHead>Due Date</TableHead>
        <TableHead>Delay</TableHead>
        <TableHead>Status</TableHead>
        {/* Keeping Actions for functionality, though not in the strict list */}
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );

  // --- Common Row Render Logic ---
  const renderCommonRow = (task, index) => {
    const assignedByUser =
      Array.isArray(allUsers) && allUsers.length > 0
        ? allUsers.find((u) => u._id === task.assignedBy?._id)
        : null;
    const assignedToUser =
      Array.isArray(allUsers) && allUsers.length > 0
        ? allUsers.find((u) => u._id === task.assignedTo?._id)
        : null;
    return (
      <TableRow key={task._id} className={task.isOverdue ? "bg-red-50" : ""}>
        <TableCell>
          {(localCurrentPage - 1) * localItemsPerPage + index + 1}
        </TableCell>
        <TableCell>{task.TaskId || "-"}</TableCell>
        <TableCell className="font-medium">{task.title}</TableCell>
        <TableCell>
          <Button
            variant="link"
            className="p-0 h-auto text-blue-600"
            onClick={() => handleViewDescription(task.description)}
            disabled={!task.description}
          >
            View
          </Button>
        </TableCell>
        <TableCell>
          <div className="flex flex-row gap-1">
            <span className="text-sm font-medium text-gray-900">
              {task.assignedBy?.name || "-"}
            </span>
            {assignedByUser?.name && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full w-fit font-medium
      ${
        assignedByUser.role?.name === "Admin"
          ? "bg-red-100 text-red-700"
          : assignedByUser.role?.name === "Owner"
            ? "bg-purple-100 text-purple-700"
            : assignedByUser.role?.name === "Sr. Manager"
              ? "bg-blue-100 text-blue-700"
              : assignedByUser.role?.name === "Manager"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
      }
    `}
              >
                {assignedByUser.role?.name}
              </span>
            )}
          </div>
        </TableCell>{" "}
        <TableCell>
          <div className="flex flex-row gap-1">
            <span className="text-sm font-medium text-gray-900">
              {task.assignedTo?.name || "-"}
            </span>

            {assignedToUser?.name && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full w-fit font-medium
      ${
        assignedToUser.role?.name === "Admin"
          ? "bg-red-100 text-red-700"
          : assignedToUser.role?.name === "Owner"
            ? "bg-purple-100 text-purple-700"
            : assignedToUser.role?.name === "Sr. Manager"
              ? "bg-blue-100 text-blue-700"
              : assignedToUser.role?.name === "Manager"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
      }
    `}
              >
                {assignedToUser.role?.name}
              </span>
            )}
          </div>
        </TableCell>{" "}
        <TableCell>{task.taskType || "-"}</TableCell>
        <TableCell>
          {Array.isArray(task?.attachmentFile) &&
          task.attachmentFile.length > 0 ? (
            <ViewLink file={task.attachmentFile} />
          ) : (
            "NA"
          )}
          {/* <ViewLink file={task.attachmentFile} /> */}
        </TableCell>
        <TableCell>
          {task.startDate ? formatDate(task.startDate) : "-"}
        </TableCell>
        <TableCell>{task.dueDate ? formatDate(task.dueDate) : "-"}</TableCell>
        <TableCell className={task.delay ? "text-red-600" : ""}>
          {task.delay || "-"}
        </TableCell>
        <TableCell>{getStatusBadge(task.status)}</TableCell>
        <TableCell>
          {activeTab === "today" && (
            <TodayTaskActions
              task={task}
              onChecklist={handleChecklistClick}
              onFillForm={handleFillFormClick}
            />
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 py-4">
      <div className=" mx-auto">
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <CardTitle className="text-2xl font-bold">
                  {viewHeading}
                </CardTitle>
              </div>
              <TaskProgress
                completed={taskCounts.completed}
                total={taskCounts.total}
              />
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <StatsCards
              counts={taskCounts}
              selectedStat={selectedStatFilter}
              onStatClick={handleStatClick}
            />

            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-4 p-1 bg-gray-100 rounded-lg">
                <TabsTrigger value="today">Today's Task</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming Tasks</TabsTrigger>
                <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
                <TabsTrigger value="escalated">Escalated</TabsTrigger>
              </TabsList>

              <FilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedFilterStatus={selectedFilterStatus}
                setSelectedFilterStatus={setSelectedFilterStatus}
                showExport={true}
                onExport={handleExport}
                isExporting={isExporting}
                doers={doers}
                selectedDoer={selectedDoer}
                setSelectedDoer={setSelectedDoer}
                managers={managers}
                selectedManager={selectedManager}
                setSelectedManager={setSelectedManager}
                srManagers={srManagers}
                selectedSrManager={selectedSrManager}
                setSelectedSrManager={setSelectedSrManager}
                selectedAssignor={selectedAssignor}
                setSelectedAssignor={setSelectedAssignor}
                currentUser={currentUser}
              />

              {status === "loading" && (
                <div className="text-center py-10">
                  <RefreshCcw className="animate-spin h-6 w-6 text-blue-500 mx-auto" />
                </div>
              )}
              {status !== "loading" && (
                <>
                  {/* --- Today's Task Tab --- */}
                  <TabsContent value="today" className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <CommonTableHeaders />
                        <TableBody>
                          {fetchedTasks.length > 0 ? (
                            fetchedTasks.map((task, index) =>
                              renderCommonRow(task, index),
                            )
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={12}
                                className="text-center py-8 text-gray-500"
                              >
                                No tasks found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* --- Upcoming Tasks Tab --- */}
                  <TabsContent value="upcoming" className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <CommonTableHeaders />
                        <TableBody>
                          {fetchedTasks.length > 0 ? (
                            fetchedTasks.map((task, index) =>
                              renderCommonRow(task, index),
                            )
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={12}
                                className="text-center py-8 text-gray-500"
                              >
                                No upcoming tasks.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* --- Completed Tasks Tab --- */}
                  <TabsContent value="completed" className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <CommonTableHeaders />
                        <TableBody>
                          {fetchedTasks.length > 0 ? (
                            fetchedTasks.map((task, index) =>
                              renderCommonRow(task, index),
                            )
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={12}
                                className="text-center py-8 text-gray-500"
                              >
                                No completed tasks.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* --- Escalated Tasks Tab --- */}
                  <TabsContent value="escalated" className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <CommonTableHeaders />
                        <TableBody>
                          {fetchedTasks.length > 0 ? (
                            fetchedTasks.map((task, index) =>
                              renderCommonRow(task, index),
                            )
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={12}
                                className="text-center py-8 text-gray-500"
                              >
                                No escalated tasks.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <Pagination
                    totalItems={totalTasks || 0}
                    itemsPerPage={localItemsPerPage}
                    setItemsPerPage={setLocalItemsPerPage}
                    currentPage={localCurrentPage}
                    onPageChange={setLocalCurrentPage}
                    isLoading={status === "loading"}
                  />
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* --- DIALOGS --- */}
      <Dialog
        open={isChecklistDialogOpen}
        onOpenChange={setIsChecklistDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Checklist: {selectedTaskForChecklist?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-60 overflow-y-auto">
            {checklistItems.length > 0 ? (
              <ul className="space-y-2">
                {checklistItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center p-2 bg-gray-50 rounded-md border"
                  >
                    <Checkbox
                      id={`chk-${index}`}
                      checked={item.isCompleted}
                      disabled
                      className="mr-3"
                    />
                    <label
                      className={`text-sm ${item.isCompleted ? "line-through text-gray-500" : ""}`}
                    >
                      {typeof item === "object"
                        ? item.text || item.title
                        : item}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                No checklist items for this task.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsChecklistDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isFillFormDialogOpen}
        onOpenChange={setIsFillFormDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Form for: {selectedTaskForForm?.title}</DialogTitle>
            <DialogDescription>
              Details for the assigned user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              label="Name"
              value={selectedTaskForForm?.assignedTo?.name || "N/A"}
              readOnly
            />
            <Input
              label="Email"
              value={selectedTaskForForm?.assignedTo?.email || "N/A"}
              readOnly
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsFillFormDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDescriptionDialogOpen}
        onOpenChange={setIsDescriptionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Full Description</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700">{fullDescription}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDescriptionDialogOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerView;
