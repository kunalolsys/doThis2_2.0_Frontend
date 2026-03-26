import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyTasks,
  fetchTaskCounts,
  getFilterTasks,
} from "../../redux/slices/myTask/myTaskSlice";
import api from "../../lib/api";
import { toast } from "sonner";
import {
  Plus,
  CheckCircle,
  Upload,
  FileText,
  Search,
  Clock,
  CheckCircle2,
  ClipboardList,
  RefreshCcw,
  AlertCircle,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
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
import * as XLSX from "xlsx";
import { formatDate } from "../../lib/utilFunctions";
import ViewLink from "./attachmentViewer";
import { useDebounce } from "../../lib/debounce";

// --- Helper: Status Badge ---
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

// --- Helper: Action Buttons ---
const TaskActions = ({
  task,
  onChecklist,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const isCompleted = task.status === "Completed";

  return (
    <div className="flex gap-1">
      {/* Checklist Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-600 hover:bg-gray-50"
            onClick={() => onChecklist(task)}
            disabled={
              (!task.checklist || task.checklist.length === 0) && !isCompleted
            }
          >
            <ClipboardList className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View Checklist</p>
        </TooltipContent>
      </Tooltip>

      {/* Complete/Reopen Button */}
      {!isCompleted && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:bg-green-50"
              onClick={() => onToggleComplete(task)}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mark as Done</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Note: Edit and Delete actions intentionally removed from UI per request */}
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

// --- Helper: Stats Cards ---
const StatsCards = ({ counts, selectedStat, onStatClick }) => {
  const getCardClass = (type, color) => `
    cursor-pointer transition-all duration-200 transform hover:scale-105
    ${selectedStat === type ? `ring-2 ring-${color}-500 shadow-lg` : ""}
  `;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      {/* Total Tasks */}
      <Card
        className={`${getCardClass("total", "blue")} bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200`}
        onClick={() => onStatClick("total")}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Tasks</p>
              <p className="text-2xl font-bold text-blue-700">{counts.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card
        className={`${getCardClass("overdue", "red")} bg-gradient-to-br from-red-50 to-red-100 border-red-200`}
        onClick={() => onStatClick("overdue")}
      >
        <CardContent className="p-2">
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

      {/* Completed */}
      <Card
        className={`${getCardClass("completed", "green")} bg-gradient-to-br from-green-50 to-green-100 border-green-200`}
        onClick={() => onStatClick("completed")}
      >
        <CardContent className="p-2">
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

      {/* Due Today */}
      <Card
        className={`${getCardClass("dueToday", "purple")} bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200`}
        onClick={() => onStatClick("dueToday")}
      >
        <CardContent className="p-2">
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

// --- Helper: Filter Bar ---
const FilterBar = ({
  searchTerm,
  setSearchTerm,
  selectedFilterTaskType,
  setSelectedFilterTaskType,
  selectedFilterStatus,
  setSelectedFilterStatus,
  showExport = false,
  onExport,
  isExporting,
  selectedStatFilter,
}) => (
  <div className="flex flex-col md:flex-row gap-3 mt-6 mb-4 p-4 bg-gray-50 rounded-lg border">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search by Task ID or Title..."
        className="pl-10 bg-white"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    <div className="flex flex-col sm:flex-row gap-2 flex-1">
      <Select
        value={selectedFilterTaskType}
        onValueChange={setSelectedFilterTaskType}
      >
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="DelegationTask">Delegation</SelectItem>
          <SelectItem value="RecurringTask">Recurring</SelectItem>
        </SelectContent>
      </Select>
      {(selectedStatFilter == "total"||!selectedStatFilter) && (
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
            {/* <SelectItem value="Due Today">Due Today</SelectItem> */}
          </SelectContent>
        </Select>
      )}
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

// --- Helper: Main Table ---
const TodayTasksTable = ({
  tasks,
  onChecklist,
  onToggleComplete,
  onViewDescription,
  onEdit,
  onDelete,
  currentPage,
  itemsPerPage,
}) => (
  <div className="overflow-x-auto border rounded-lg bg-white">
    <Table>
      <TableHeader className="bg-gray-50">
        <TableRow>
          <TableHead>Sr. No.</TableHead>
          <TableHead>Task Id</TableHead>
          <TableHead>Task Title</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Assigned By</TableHead>
          <TableHead>Attachment</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Delay</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <React.Fragment key={task._id}>
              <TableRow className={task.isOverdue ? "bg-red-50" : ""}>
                <TableCell>
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </TableCell>
                <TableCell>{task.TaskId || "-"}</TableCell>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{task.assignedTo?.name || "-"}</TableCell>

                <TableCell>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600"
                    onClick={() => onViewDescription(task)}
                    disabled={!task.description}
                  >
                    View
                  </Button>
                </TableCell>
                <TableCell>{task.taskType}</TableCell>
                <TableCell>{task.assignedBy?.name || "Self"}</TableCell>
                <TableCell>
                  {Array.isArray(task?.attachmentFile) &&
                  task.attachmentFile.length > 0 ? (
                    <ViewLink file={task.attachmentFile} />
                  ) : (
                    "NA"
                  )}
                </TableCell>
                <TableCell>
                  {task.startDate ? formatDate(task.startDate) : "-"}
                </TableCell>
                <TableCell>
                  {task.dueDate ? formatDate(task.dueDate) : "-"}
                </TableCell>
                <TableCell>
                  {task.taskType === "RecurringTask" ? task.frequency : "-"}
                </TableCell>
                <TableCell className={task.delay ? "text-red-600" : ""}>
                  {task.delay || "-"}
                </TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>
                  <TaskActions
                    task={task}
                    onChecklist={onChecklist}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={14} className="text-center py-8 text-gray-500">
              No tasks found for this filter
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);

// --- MAIN COMPONENT ---
const MyTask = () => {
  const dispatch = useDispatch();
  const {
    tasks: fetchedTasks,
    taskCounts,
    status,
    error,
    totalTasks,
  } = useSelector((state) => state.myTasks);
  const { currentUser } = useSelector((state) => state.users);

  // UI State
  const [activeTab, setActiveTab] = useState("today");

  // NOTE: selectedStatFilter can be: 'total', 'overdue', 'completed', 'dueToday', or null (no stat filter)
  const [selectedStatFilter, setSelectedStatFilter] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilterTaskType, setSelectedFilterTaskType] = useState("all");
  const [selectedFilterStatus, setSelectedFilterStatus] = useState("all");

  // Pagination States
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(10);

  // Dialog States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [fullDescription, setFullDescription] = useState("");
  const [selectedTaskForChecklist, setSelectedTaskForChecklist] =
    useState(null);
  const [checklistItems, setChecklistItems] = useState([]);

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  // Edit Form States (Minimal placeholder)
  const [editTitle, setEditTitle] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [isFetching, setIsFetching] = useState(false);

  // --- Initial Data Load ---
  useEffect(() => {
    if (currentUser?._id) {
      dispatch(fetchTaskCounts(currentUser._id));
    }
  }, [currentUser, dispatch]);

  // --- CORE LOGIC: Get Fetch Params ---
  const getFetchParams = () => {
    const params = {
      userId: currentUser._id,
      page: localCurrentPage,
      limit: localItemsPerPage,
      type:
        selectedFilterTaskType === "all" ? undefined : selectedFilterTaskType,
    };

    // 1. STAT CARD MODE (Overrides Tabs)
    if (selectedStatFilter) {
      switch (selectedStatFilter) {
        case "total":
          // Fetch ALL tasks regardless of status/date
          params.taskCategory = "all_tasks";
          params.status = undefined;
          // Fetch all for client-side pagination
          params.page = 1;
          params.limit = 1000;
          break;

        case "overdue":
          // Fetch ONLY Pending Overdue tasks
          params.status = "Overdue";
          break;

        case "dueToday":
          // Fetch ONLY Pending tasks Due Today
          params.taskCategory = "today_backlog";
          params.dateFilter = "dueToday";
          params.status = "Due Today";
          break;

        case "completed":
          // Fetch Completed
          params.taskCategory = "completed";
          params.status = "Completed";
          break;

        default:
          break;
      }
    }
    // 2. TAB MODE (Standard Navigation)
    else {
      params.status =
        selectedFilterStatus === "all" ? undefined : selectedFilterStatus;

      switch (activeTab) {
        case "today":
          // Today + Backlog (Pending)
          params.taskCategory = "today_backlog";
          if (selectedFilterStatus === "all") params.status = "Pending";
          // Fetch all for client-side pagination
          params.page = 1;
          params.limit = 1000;
          break;

        case "upcoming":
          // Future Start Date (Pending)
          params.taskCategory = "upcoming";

          break;

        case "completed":
          // Completed Tasks
          params.taskCategory = "completed";
          params.status = "Completed";
          break;

        default:
          params.taskCategory = "today_backlog";
      }
    }
    return params;
  };

  // --- Fetch Trigger ---
  useEffect(() => {
    let mounted = true;
    if (currentUser?._id) {
      setIsFetching(true);
      // dispatch(fetchMyTasks(getFetchParams()))
      //   .catch(() => {})
      //   .finally(() => {
      //     if (mounted) setIsFetching(false);
      //   });
      dispatch(
        getFilterTasks({
          userId: currentUser._id,
          page: localCurrentPage,
          limit: localItemsPerPage,

          search: debouncedSearch || undefined,

          // ✅ MULTI FILTER OBJECT
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

            // 🔁 TYPE
            taskType:
              selectedFilterTaskType === "all" ? null : selectedFilterTaskType,

            // 📊 STATUS
            status:
              selectedFilterStatus === "all" ? null : selectedFilterStatus,
          },
        }),
      )
        .catch(() => {})
        .finally(() => {
          if (mounted) setIsFetching(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [
    currentUser,
    dispatch,
    activeTab,
    selectedStatFilter,
    selectedFilterStatus,
    selectedFilterTaskType,
    localCurrentPage,
    localItemsPerPage,
    debouncedSearch,
  ]);

  // --- Client-side Search Function (Backup) ---
  const handleClientSideSearch = (tasks, searchTerm) => {
    if (!searchTerm.trim()) {
      return tasks;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    return tasks.filter((task) => {
      // Search in Task ID
      const taskId = task.TaskId?.toLowerCase() || "";
      const taskIdMatch = taskId.includes(searchTermLower);

      // Search in Task Title
      const title = task.title?.toLowerCase() || "";
      const titleMatch = title.includes(searchTermLower);

      // Search in description (optional)
      const description = task.description?.toLowerCase() || "";
      const descriptionMatch = description.includes(searchTermLower);

      // Return true if any of the fields match
      return taskIdMatch || titleMatch || descriptionMatch;
    });
  };

  // --- Export Function ---
  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Use client-side filtered tasks for export
      const dataToExport = filteredTasks.map((task, index) => ({
        "Sr. No.": index + 1,
        "Task ID": task.TaskId || "-",
        "Task Title": task.title || "-",
        Description: task.description || "-",
        Type: task.taskType || "-",
        Source: task.assignedBy?.name || "Self",
        Attachment: task.attachmentFile ? "Yes" : "No",
        "Start Date": task.startDate
          ? new Date(task.startDate).toLocaleDateString()
          : "-",
        "Due Date": task.dueDate
          ? new Date(task.dueDate).toLocaleDateString()
          : "-",
        Frequency: task.taskType === "RecurringTask" ? task.frequency : "-",
        Delay: task.delay || "-",
        Status: task.status || "-",
        "Checklist Items": (task.checklist || []).length,
        "Created At": task.createdAt
          ? new Date(task.createdAt).toLocaleString()
          : "-",
        "Updated At": task.updatedAt
          ? new Date(task.updatedAt).toLocaleString()
          : "-",
      }));

      if (dataToExport.length === 0) {
        toast.warning("No data to export");
        return;
      }

      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "MyTasks");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `MyTasks_${timestamp}.xlsx`;

      // Export the file
      XLSX.writeFile(wb, filename);

      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  // --- Handlers ---
  const handleStatClick = (statType) => {
    setSelectedStatFilter(statType);
    setLocalCurrentPage(1);
    setSearchTerm("");

    // reset filters
    setSelectedFilterStatus("all");
    setSelectedFilterTaskType("all");

    // UI sync
    if (statType === "completed") {
      setActiveTab("completed");
    } else {
      setActiveTab("today");
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSelectedStatFilter(null); // Clear stat filter when user manually switches tabs
    setSelectedFilterStatus("all");
    setLocalCurrentPage(1);
    setSearchTerm(""); // Clear search when switching tabs
  };

  // --- Action Handlers ---
  const handleEditClick = (task) => {
    setEditingTask(task);
    setEditTitle(task.title); // Populate other fields as needed
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    // Implement your update logic here (api.put...)
    setIsEditOpen(false);
    toast.success("Task updated");
    // dispatch(fetchMyTasks(getFetchParams()));
    dispatch(
      getFilterTasks({
        userId: currentUser._id,
        page: localCurrentPage,
        limit: localItemsPerPage,

        search: debouncedSearch || undefined,

        // ✅ MULTI FILTER OBJECT
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

          // 🔁 TYPE
          taskType:
            selectedFilterTaskType === "all" ? null : selectedFilterTaskType,

          // 📊 STATUS
          status: selectedFilterStatus === "all" ? null : selectedFilterStatus,
        },
      }),
    );
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === "Completed" ? false : true;
    try {
      await api.patch(`/tasks/${task._id || task.id}/completion`, {
        completeStatus: newStatus,
      });
      toast.success(newStatus ? "Task Completed" : "Task Reopened");
      // dispatch(fetchMyTasks(getFetchParams()));
      dispatch(
        getFilterTasks({
          userId: currentUser._id,
          page: localCurrentPage,
          limit: localItemsPerPage,

          search: debouncedSearch || undefined,

          // ✅ MULTI FILTER OBJECT
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

            // 🔁 TYPE
            taskType:
              selectedFilterTaskType === "all" ? null : selectedFilterTaskType,

            // 📊 STATUS
            status:
              selectedFilterStatus === "all" ? null : selectedFilterStatus,
          },
        }),
      );
      dispatch(fetchTaskCounts(currentUser._id));
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/tasks/${taskToDelete._id}`);
      setIsDeleteOpen(false);
      toast.success("Deleted");
      // dispatch(fetchMyTasks(getFetchParams()));
      dispatch(
        getFilterTasks({
          userId: currentUser._id,
          page: localCurrentPage,
          limit: localItemsPerPage,

          search: debouncedSearch || undefined,

          // ✅ MULTI FILTER OBJECT
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

            // 🔁 TYPE
            taskType:
              selectedFilterTaskType === "all" ? null : selectedFilterTaskType,

            // 📊 STATUS
            status:
              selectedFilterStatus === "all" ? null : selectedFilterStatus,
          },
        }),
      );
      dispatch(fetchTaskCounts(currentUser._id));
    } catch (e) {
      toast.error("Failed");
    }
  };

  const handleChecklistClick = (task) => {
    setSelectedTaskForChecklist(task);
    setChecklistItems(task.checklist || []);
    setIsChecklistDialogOpen(true);
  };
  const handleViewDescription = (desc) => {
    setFullDescription(desc);
    setIsDescriptionDialogOpen(true);
  };

  if (status === "failed")
    return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="mx-auto">
        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="flex justify-between items-center px-6 pt-6">
            <h1 className="text-2xl font-bold">My Task</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dispatch(fetchTaskCounts(currentUser._id));
                // Refresh tasks with current params
                // dispatch(fetchMyTasks(getFetchParams()));
                dispatch(
                  getFilterTasks({
                    userId: currentUser._id,
                    page: localCurrentPage,
                    limit: localItemsPerPage,

                    search: debouncedSearch || undefined,

                    // ✅ MULTI FILTER OBJECT
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

                      // 🔁 TYPE
                      taskType:
                        selectedFilterTaskType === "all"
                          ? null
                          : selectedFilterTaskType,

                      // 📊 STATUS
                      status:
                        selectedFilterStatus === "all"
                          ? null
                          : selectedFilterStatus,
                    },
                  }),
                );
              }}
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh Stats
            </Button>
          </div>

          <CardContent className="px-6 pb-6 pt-4">
            {/* STATS SUMMARY */}
            <StatsCards
              counts={taskCounts}
              selectedStat={selectedStatFilter}
              onStatClick={handleStatClick}
            />

            {/* TABS NAVIGATION */}
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 rounded-lg">
                <TabsTrigger value="today">Today's Task (Pending)</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming Tasks</TabsTrigger>
              </TabsList>

              {/* FILTERS */}
              <FilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedFilterTaskType={selectedFilterTaskType}
                setSelectedFilterTaskType={setSelectedFilterTaskType}
                selectedFilterStatus={selectedFilterStatus}
                setSelectedFilterStatus={setSelectedFilterStatus}
                showExport={true}
                onExport={handleExport}
                isExporting={isExporting}
                selectedStatFilter={selectedStatFilter}
              />

              {/* DATA TABLE */}
              <div className="mt-2 space-y-4">
                {status === "loading" || isFetching ? (
                  <div className="text-center py-10 flex flex-col items-center gap-2">
                    <RefreshCcw className="animate-spin h-6 w-6 text-blue-500" />
                    <p>Loading tasks...</p>
                  </div>
                ) : (
                  <>
                    {/* Visual Indicator of Current Filter Mode */}
                    {selectedStatFilter === "total" && (
                      <div className="text-sm font-bold text-blue-600 mb-2">
                        Showing All Assigned Tasks
                      </div>
                    )}
                    {selectedStatFilter === "overdue" && (
                      <div className="text-sm font-bold text-red-600 mb-2">
                        Showing Overdue Pending Tasks
                      </div>
                    )}
                    {selectedStatFilter === "dueToday" && (
                      <div className="text-sm font-bold text-purple-600 mb-2">
                        Showing Tasks Due Today
                      </div>
                    )}

                    {/* Show search term in UI */}
                    {searchTerm && (
                      <div className="text-sm text-gray-600 mb-2">
                        Searching for: "
                        <span className="font-semibold">{searchTerm}</span>"
                        {totalTasks === 0 && fetchedTasks.length > 0 && (
                          <span className="ml-2 text-red-500">
                            (No matches found in current view)
                          </span>
                        )}
                      </div>
                    )}

                    <TooltipProvider>
                      <TodayTasksTable
                        tasks={fetchedTasks}
                        onEdit={handleEditClick}
                        onChecklist={handleChecklistClick}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteClick}
                        onViewDescription={(task) =>
                          handleViewDescription(task.description)
                        }
                        currentPage={localCurrentPage}
                        itemsPerPage={localItemsPerPage}
                      />
                    </TooltipProvider>

                    <Pagination
                      totalItems={totalTasks}
                      itemsPerPage={localItemsPerPage}
                      setItemsPerPage={setLocalItemsPerPage}
                      currentPage={localCurrentPage}
                      onPageChange={setLocalCurrentPage}
                      isLoading={status === "loading"}
                    />
                  </>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* --- DIALOGS --- */}

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog (Minimal Placeholder) */}
      <Dialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        className="sm:max-w-4xl px-8"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label>Title</Label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Description Dialog */}
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

      {/* Checklist Dialog */}
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
              <p className="text-sm text-gray-500 text-center">No items.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsChecklistDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyTask;
