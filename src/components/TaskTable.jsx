import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  Calendar as CalendarIcon,
  Zap,
  Search,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  ListTodo,
  ClipboardList,
  Users,
  Download,
  UploadCloud,
  FileText,
  AlertCircle,
  FilePenLine,
  X,
  Folder,
  FileSpreadsheet,
  CheckSquare,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { useDispatch, useSelector } from "react-redux";
import api from "../lib/api";
import { Button as AntButton } from "antd";
import { cn, frequencyMap } from "./utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
  Textarea,
  Checkbox,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  RadioGroup,
  RadioGroupItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/index.jsx";
import { Tabs as AntdTabs } from "antd";
import { formatDate } from "../lib/utilFunctions.js";
import dayjs from "dayjs";
import { DatePicker, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDebounce } from "../lib/debounce.js";
const AttachmentTab = ({ editFileList, setEditFileList, handleRemove }) => {
  const isImage = (file) => {
    return (
      file.type?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif)$/i.test(file.name)
    );
  };

  const getFileIcon = (name) => {
    if (name.endsWith(".pdf")) return "📕";
    if (name.endsWith(".csv")) return "📄";
    if (name.endsWith(".xlsx")) return "📊";
    return "📁";
  };

  return (
    <div className="space-y-6">
      {/* ================= UPLOAD AREA ================= */}
      <div className="border-2 border-dashed rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition">
        <Upload
          multiple
          fileList={editFileList}
          onChange={({ fileList }) => setEditFileList(fileList)}
          onRemove={handleRemove}
          beforeUpload={() => false}
          showUploadList={false}
        >
          <div className="cursor-pointer flex flex-col items-center gap-2">
            <div className="text-4xl">📤</div>
            <p className="text-sm font-medium text-gray-700">
              Drag & drop files or click to upload
            </p>
            <p className="text-xs text-gray-400">
              Images, PDF, CSV, Excel supported
            </p>
          </div>
        </Upload>
      </div>

      {/* ================= FILE GRID ================= */}
      {editFileList.length > 0 && (
        <div className="max-h-[320px] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {editFileList.map((file) => (
              <div
                key={file.uid}
                className="group border rounded-xl bg-white shadow-sm hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* PREVIEW AREA */}
                <div className="h-28 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {isImage(file) ? (
                    <img
                      src={file.url || URL.createObjectURL(file.originFileObj)}
                      alt={file.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-3xl">{getFileIcon(file.name)}</div>
                  )}
                </div>

                {/* FILE NAME */}
                <div className="p-1 text-xs text-gray-700 leading-tight line-clamp-2 break-words">
                  {/* {file.name} */}
                </div>

                {/* ACTIONS */}
                <div className="flex justify-between px-2 pb-2 opacity-0 group-hover:opacity-100 transition">
                  {file.url && (
                    <button
                      onClick={() => window.open(file.url)}
                      className="text-blue-500 text-xs hover:underline cursor-pointer"
                    >
                      Download
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleRemove(file); // your existing logic (removedFiles tracking)

                      // ✅ THIS IS MISSING
                      setEditFileList((prev) =>
                        prev.filter((f) => f.uid !== file.uid),
                      );
                    }}
                    className="text-red-500 text-xs hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {editFileList.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-6">
          No attachments uploaded yet
        </div>
      )}
    </div>
  );
};
// const AttachmentTab = ({
//   editFileList,
//   setEditFileList,
//   handleRemove,
//   // loadAttachments,
// }) => {
//   return (
//     <div className="space-y-4">
//       {/* Upload */}
//       <Upload
//         listType="picture-card"
//         multiple
//         fileList={editFileList}
//         onChange={({ fileList }) => setEditFileList(fileList)}
//         onRemove={handleRemove}
//         beforeUpload={() => false}
//       >
//         <div>+ Upload</div>
//       </Upload>
//     </div>
//   );
// };
const TaskTable = ({
  allTasks,
  tasksLoading,
  users,
  departments,
  currentUser,
  holidays,
  onRefreshTasks,
  onViewDescription,
  searchTerm: propSearchTerm,
  setSearchTerm: propSetSearchTerm,
}) => {
  const dispatch = useDispatch();

  // Filter and Search States
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const searchTerm =
    typeof propSearchTerm !== "undefined" ? propSearchTerm : localSearchTerm;
  const setSearchTerm =
    typeof propSetSearchTerm !== "undefined"
      ? propSetSearchTerm
      : setLocalSearchTerm;
  const [selectedFilterUser, setSelectedFilterUser] = useState("all");
  const [selectedFilterStatus, setSelectedFilterStatus] = useState("all");

  const [activeTabForExport, setActiveTabForExport] = useState("one-time");
  // Pagination States
  const [oneTimeCurrentPage, setOneTimeCurrentPage] = useState(1);
  const [oneTimeItemsPerPage, setOneTimeItemsPerPage] = useState(10);
  const [recurringCurrentPage, setRecurringCurrentPage] = useState(1);
  const [recurringItemsPerPage, setRecurringItemsPerPage] = useState(10);

  // --- EDIT & DELETE STATES ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [selectedTaskForChecklist, setSelectedTaskForChecklist] =
    useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  // --- REASSIGN STATES ---
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignTask, setReassignTask] = useState(null);
  const [reassignSelectedUser, setReassignSelectedUser] = useState("");
  const [reassignDeptFilter, setReassignDeptFilter] = useState(null);
  // Delete parent task states
  const [deleteRemark, setDeleteRemark] = useState("");
  const [childTasksCount, setChildTasksCount] = useState(0);
  const [isParentWithChildren, setIsParentWithChildren] = useState(false);

  // Edit Form specific states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editStartDate, setEditStartDate] = useState(null);
  const [editDueDate, setEditDueDate] = useState(null);
  const [editChecklist, setEditChecklist] = useState([]);
  const [editChecklistItem, setEditChecklistItem] = useState("");
  const [editRecurrenceFrequency, setEditRecurrenceFrequency] =
    useState("daily");
  const [editRecurrenceEndDate, setEditRecurrenceEndDate] = useState();
  const [editWeeklyRecurrenceDays, setEditWeeklyRecurrenceDays] = useState([]);

  // Import Dialog States
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importTaskType, setImportTaskType] = useState(null); // 'delegation', 'recurring', 'dependent'
  const [uploadFile, setUploadFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [errorFileUrl, setErrorFileUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Attachment states (for import process)
  const [attachmentFiles, setAttachmentFiles] = useState([]); // Currently unused, check original for usage
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadedAttachmentNames, setUploadedAttachmentNames] = useState([]);
  const [uploadedAttachmentBackendNames, setUploadedAttachmentBackendNames] =
    useState([]);
  const attachmentFileInputRef = useRef(null);
  const attachmentFolderInputRef = useRef(null);

  //**All Task Attachments */
  const [activeTab, setActiveTab] = useState("basic");
  const [editFileList, setEditFileList] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const loadAttachments = async () => {
    try {
      if (
        (Array.isArray(editingTask?.attachmentFile) &&
          editingTask.attachmentFile.length > 0) ||
        editingTask?.attachmentFile !== null
      ) {
        const files = editingTask.attachmentFile.map((file, index) => ({
          uid: index.toString(),
          name: file.split("/").pop(),
          status: "done",
          url: `${import.meta.env.VITE_API_BASE_URL}/tasks/download?filePath=${encodeURIComponent(file)}`,
          filePath: file, // 🔥 IMPORTANT (keep original path)
        }));

        setEditFileList(files);
      } else {
        setEditFileList([]);
      }
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (activeTab === "attachments") {
      loadAttachments();
    }
  }, [activeTab]);

  // useEffect(() => {
  //   if (editingTask?.attachmentFile) {
  //     const files = editingTask.attachmentFile.map((file, index) => ({
  //       uid: index.toString(),
  //       name: file.split("/").pop(),
  //       status: "done",
  //       url: `${import.meta.env.VITE_API_BASE_URL}/tasks/download?filePath=${encodeURIComponent(file)}`,
  //       filePath: file, // 🔥 IMPORTANT (keep original path)
  //     }));

  //     setEditFileList(files);
  //   }
  // }, [editingTask]);

  const handleRemove = (file) => {
    // store removed file paths
    if (file.filePath) {
      setRemovedFiles((prev) => [...prev, file.filePath]);
    }

    return true; // allow removal from UI
  };
  // Memoized filtered tasks
  const filteredTasks = useMemo(() => {
    const term = (searchTerm || "").toLowerCase().trim();
    return allTasks.filter((task) => {
      // Search by TaskId, title or description
      const taskId = (task.TaskId || "").toString().toLowerCase();
      const title = (task.title || "").toLowerCase();
      const description = (task.description || "").toLowerCase();

      const matchesSearch =
        !term ||
        taskId.includes(term) ||
        title.includes(term) ||
        description.includes(term);

      const matchesUser =
        selectedFilterUser === "all" ||
        (task.assignedTo &&
          (task.assignedTo._id === selectedFilterUser ||
            task.assignedTo === selectedFilterUser));

      const matchesStatus =
        selectedFilterStatus === "all" ||
        (task.status &&
          task.status.toLowerCase() === selectedFilterStatus.toLowerCase());

      return matchesSearch && matchesUser && matchesStatus;
    });
  }, [allTasks, searchTerm, selectedFilterUser, selectedFilterStatus]);

  // Derived States
  const oneTimeTasksList = filteredTasks.filter(
    (t) =>
      t.taskType === "DelegationTask" ||
      (!t.recurrenceFrequency && t.taskType !== "RecurringTask"),
  );
  const recurringTasksList = filteredTasks.filter(
    (t) => t.taskType === "RecurringTask" || t.recurrenceFrequency,
  );

  // --- Edit Checklist Handlers ---
  const addEditChecklistItem = () => {
    if (!editChecklistItem.trim()) return;
    setEditChecklist([
      ...editChecklist,
      { text: editChecklistItem, isCompleted: false },
    ]);
    setEditChecklistItem("");
  };

  const removeEditChecklistItem = (index) => {
    const newList = [...editChecklist];
    newList.splice(index, 1);
    setEditChecklist(newList);
  };

  const dateChangeHandler = (e, setter) => {
    const dateString = e.target.value;
    if (!dateString) {
      setter(undefined);
      return;
    }
    const [year, month, day] = dateString.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);

    if (newDate.getDay() === 0) {
      // Sunday
      toast.error("Sundays are not allowed. Please select another date.");
      e.target.value = "";
      setter(undefined);
      return;
    }

    const holiday = holidays.find((h) => h.date.startsWith(dateString));
    if (holiday) {
      toast.error(
        `Selected date is a holiday: ${holiday.name}. Please select another date.`,
      );
      e.target.value = "";
      setter(undefined);
      return;
    }
    setter(newDate);
  };

  // Helper for status badges
  const getStatusBadge = (status) => {
    const s = status ? status.toLowerCase() : "pending";
    switch (s) {
      case "completed":
        return (
          <Badge
            variant="outline"
            className="text-green-600 border-green-200 bg-green-50 text-sm"
          >
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-200 bg-yellow-50 text-sm"
          >
            Pending
          </Badge>
        );
      case "delayed":
        return (
          <Badge
            variant="outline"
            className="text-red-600 border-red-200 bg-red-50 text-sm"
          >
            Delayed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-sm capitalize">
            {s}
          </Badge>
        );
    }
  };

  const handleEditClick = async (task) => {
    const res = await api.get(`/tasks/${task._id || task.id}`);
    const data = res.data.data;
    setEditingTask(data);
    setEditTitle(data.title);
    setEditDescription(data.description || "");
    // For single task edit, we assume assignedTo is an object with _id, or just an ID
    setEditAssignedTo(data.assignedTo?._id || data.assignedTo || "");
    setEditStartDate(data.startDate ? new Date(data.startDate) : null);
    setEditDueDate(data.dueDate ? new Date(data.dueDate) : null);
    setEditChecklist(data.checklist || []);

    if (data.taskType === "RecurringTask" || data.frequency) {
      setEditRecurrenceFrequency(data.frequency?.toLowerCase() || "daily");
      setEditRecurrenceEndDate(data.endDate ? new Date(data.endDate) : null);
      if (data.frequency?.toLowerCase() === "weekly") {
        let weekDaysAsStrings = []; // The final array of strings
        if (data.weekDays) {
          let parsedDays = [];
          if (typeof data.weekDays === "string") {
            try {
              parsedDays = JSON.parse(data.weekDays);
            } catch (e) {
              parsedDays = data.weekDays.split(",").map((d) => d.trim());
            }
          } else if (Array.isArray(data.weekDays)) {
            parsedDays = data.weekDays;
          }

          if (Array.isArray(parsedDays)) {
            if (
              parsedDays.length > 0 &&
              typeof parsedDays[0] === "object" &&
              parsedDays[0] !== null
            ) {
              // Handle array of objects
              weekDaysAsStrings = parsedDays
                .map((d) => (d.day || d.label || d.value || "").toLowerCase())
                .filter(Boolean);
            } else {
              // Handle array of strings
              weekDaysAsStrings = parsedDays.map((d) =>
                String(d).toLowerCase(),
              );
            }
          }
        }
        setEditWeeklyRecurrenceDays(weekDaysAsStrings);
      } else {
        setEditWeeklyRecurrenceDays([]);
      }
    } else {
      setEditRecurrenceFrequency("daily");
      setEditRecurrenceEndDate(null);
      setEditWeeklyRecurrenceDays([]);
    }

    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return toast.error("Title is required");
    if (!editDescription.trim()) return toast.error("Description is required");
    // Temporary loading state for this specific action
    const localSetLoading = (val) => console.log("Edit loading state:", val); // Placeholder
    localSetLoading(true);
    try {
      // If there's an attachment, use FormData (Multer will parse it).
      // Otherwise send a JSON body to avoid multipart parsing edge-cases.
      const hasNewFiles = editFileList.some((file) => file.originFileObj);
      let res;
      if (hasNewFiles || editFileList.length > 0) {
        const formData = new FormData();
        formData.append("title", editTitle);
        formData.append("description", editDescription);
        if (editAssignedTo) formData.append("assignedTo", editAssignedTo);
        if (editStartDate)
          formData.append("startDate", format(editStartDate, "yyyy-MM-dd"));

        if (editingTask.taskType === "RecurringTask" || editingTask.frequency) {
          formData.append("isRecurrent", "true");
          formData.append(
            "frequency",
            frequencyMap[editRecurrenceFrequency] || editRecurrenceFrequency,
          );
          if (editRecurrenceEndDate) {
            formData.append(
              "endDate",
              format(editRecurrenceEndDate, "yyyy-MM-dd"),
            );
          }
          if (editRecurrenceFrequency === "weekly") {
            formData.append(
              "weekDays",
              JSON.stringify(editWeeklyRecurrenceDays),
            );
          }
        } else {
          formData.append("isRecurrent", "false");
          if (editDueDate)
            formData.append("dueDate", format(editDueDate, "yyyy-MM-dd"));
        }
        // ================= ATTACHMENT FIX =================

        // ✅ Existing files (kept)
        const existingFiles = editFileList
          .filter((file) => !file.originFileObj)
          .map((file) => file.filePath);

        formData.append("existingFiles", JSON.stringify(existingFiles));

        // ✅ Removed files
        formData.append("removedFiles", JSON.stringify(removedFiles));

        // ✅ New files
        editFileList.forEach((file) => {
          if (file.originFileObj) {
            formData.append("attachmentFile", file.originFileObj);
          }
        });

        // =================================================
        if (editChecklist.length > 0)
          formData.append("checklist", JSON.stringify(editChecklist));
        // formData.append("attachmentFile", editAttachment);

        res = await api.put(
          `/tasks/${editingTask._id || editingTask.id}`,
          formData,
        );
      } else {
        // JSON payload path (no file) — axios will set Content-Type: application/json
        const payload = {
          title: editTitle,
          description: editDescription,
        };
        if (editAssignedTo) payload.assignedTo = editAssignedTo;
        if (editStartDate)
          payload.startDate = format(editStartDate, "yyyy-MM-dd");

        if (editingTask.taskType === "RecurringTask" || editingTask.frequency) {
          payload.isRecurrent = true;
          payload.frequency =
            frequencyMap[editRecurrenceFrequency] || editRecurrenceFrequency;
          if (editRecurrenceEndDate)
            payload.endDate = format(editRecurrenceEndDate, "yyyy-MM-dd");
          // Always include weekDays when weekly (may be empty array)
          if (
            editRecurrenceFrequency === "weekly" ||
            (payload.frequency && payload.frequency.toLowerCase() === "weekly")
          ) {
            payload.weekDays = editWeeklyRecurrenceDays;
          }
        } else {
          payload.isRecurrent = false;
          if (editDueDate) payload.dueDate = format(editDueDate, "yyyy-MM-dd");
        }

        if (editChecklist.length > 0) payload.checklist = editChecklist;

        res = await api.put(
          `/tasks/${editingTask._id || editingTask.id}`,
          payload,
        );
      }

      if (res.data?.success) {
        toast.success("Task updated successfully");
        setIsEditOpen(false);
        setActiveTab("basic"); // Reset to basic tab after edit
        setEditFileList([]);
        onRefreshTasks(); // Refresh tasks in parent
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task");
    } finally {
      localSetLoading(false);
    }
  };

  const handleDeleteClick = (task) => {
    // Check if this task is a parent with dependent children
    const parentTaskId = task._id || task.id;
    const dependentChildren = allTasks.filter((t) => {
      if (!t.parentTask) return false;
      const parentId =
        typeof t.parentTask === "object" && t.parentTask !== null
          ? t.parentTask._id
          : t.parentTask;
      return parentId === parentTaskId;
    });

    setTaskToDelete(task);
    setDeleteRemark("");
    setChildTasksCount(dependentChildren.length);
    setIsParentWithChildren(dependentChildren.length > 0);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      if (isParentWithChildren) {
        // Use /force endpoint for parent task with children
        // Remark is optional, so we send it only if provided
        const res = await api.delete(
          `/tasks/${taskToDelete._id || taskToDelete.id}/force`,
          {
            data: { remark: deleteRemark || "" },
          },
        );

        if (res.data?.success) {
          toast.success(
            res.data.message ||
              `Task and ${res.data.deletedCount - 1} dependent task(s) deleted successfully`,
          );
          if (res.data.deletedCount) {
            toast(`Deleted ${res.data.deletedCount} task(s).`, {
              type: "info",
            });
          }
          setIsDeleteOpen(false);
          onRefreshTasks();
        }
      } else {
        // Regular delete for non-parent tasks
        const res = await api.delete(
          `/tasks/${taskToDelete._id || taskToDelete.id}`,
        );
        if (res.data?.success) {
          toast.success("Task deleted successfully");
          setIsDeleteOpen(false);
          onRefreshTasks();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === "Completed" ? false : true;
    try {
      const res = await api.patch(`/tasks/${task._id || task.id}/completion`, {
        completeStatus: newStatus,
      });
      if (res.data?.success) {
        const msg = newStatus
          ? "Task marked as Completed"
          : "Task marked as Incomplete";
        toast.success(msg);
        onRefreshTasks();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleChecklistClick = (task) => {
    setSelectedTaskForChecklist(task);
    setChecklistItems(
      task.checklist ? JSON.parse(JSON.stringify(task.checklist)) : [],
    );
    setIsChecklistDialogOpen(true);
  };

  // --- REASSIGN HANDLERS ---
  const openReassignDialog = (task) => {
    setReassignTask(task);
    setReassignSelectedUser(task.assignedTo?._id || task.assignedTo || "");
    setReassignDeptFilter(task.departmentOfAssignToUser?._id || null);
    setIsReassignOpen(true);
  };

  const handleReassignSubmit = async () => {
    if (!reassignTask) return;
    if (!reassignSelectedUser)
      return toast.error("Please select a user to reassign to");

    // Temporary loading state for this specific action
    const localSetLoading = (val) =>
      console.log("Reassign loading state:", val); // Placeholder
    localSetLoading(true);
    try {
      const payload = { assignedTo: reassignSelectedUser };
      if (reassignDeptFilter)
        payload.departmentOfAssignToUser = reassignDeptFilter;

      const res = await api.put(
        `/tasks/${reassignTask._id || reassignTask.id}`,
        payload,
      );
      if (res.data?.success) {
        toast.success(res.data.message || "Task reassigned successfully");
        setIsReassignOpen(false);
        setReassignTask(null);
        onRefreshTasks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reassign task");
    } finally {
      localSetLoading(false);
    }
  };

  const handleChecklistChange = (index) => {
    const newChecklistItems = [...checklistItems];
    newChecklistItems[index].isCompleted =
      !newChecklistItems[index].isCompleted;
    setChecklistItems(newChecklistItems);
  };

  const handleCompleteTaskFromChecklist = async () => {
    if (!selectedTaskForChecklist) return;

    try {
      const res = await api.put(`/tasks/${selectedTaskForChecklist._id}`, {
        checklist: checklistItems,
      });
      if (!res.data.success) {
        toast.error("Failed to save checklist progress.");
        return;
      }
    } catch (err) {
      toast.error("Error saving checklist progress.");
      return;
    }

    await handleToggleComplete(selectedTaskForChecklist);
    setIsChecklistDialogOpen(false);
  };
  const debouncedSearch = useDebounce(searchTerm);
  const handleExport = async () => {
    try {
      const response = await api.post("/tasks/export", {
        tabType: activeTabForExport,
        assignedTo: selectedFilterUser,
        status: selectedFilterStatus,
        search: debouncedSearch,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "tasks.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Tasks exported successfully.");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export tasks.");
    }
  };

  const openImportDialog = (type) => {
    setImportTaskType(type);
    setUploadFile(null);
    setImportError(null);
    setErrorFileUrl(null);
    setUploadedAttachmentBackendNames([]);
    setUploadedAttachmentNames([]);
    setIsImportDialogOpen(true);
  };

  const templates = {
    delegation: {
      name: "Delegation Task",
      subtitle: "Independent",
      columns: [
        { name: "Task Title", type: "Text", required: true },
        { name: "Task Description", type: "Text", required: true },
        { name: "Assign To(Email)", type: "Text", required: true },
        { name: "Assign To(Name)", type: "Text", required: false },
        { name: "Assign To UserDepartment", type: "Text", required: true },
        { name: "Check List", type: "Optional", required: false },
        { name: "Start Date", type: "DD-MM-YYYY", required: true },
        { name: "Task End Days", type: "Number", required: true },
        { name: "Attachment File", type: "File", required: false },
      ],
      demoData: [
        "Sample Delegation Task",
        "Description...",
        "user@example.com",
        "John",
        "Engineering",
        '"item1,item2"',
        "01-08-2024",
        1,
        "file.pdf",
      ],
    },
    recurring: {
      name: "Recurring Task",
      subtitle: "Scheduled",
      columns: [
        { name: "Task Title", type: "Text", required: true },
        { name: "Task Description", type: "Text", required: true },
        { name: "Assign To(Email)", type: "Text", required: true },
        { name: "Assign To(Name)", type: "Text", required: false },
        { name: "Assign To UserDepartment", type: "Text", required: true },
        { name: "Check List", type: "Optional", required: false },
        { name: "Start Date", type: "DD-MM-YYYY", required: true },
        {
          name: "Frequency",
          type: "Text (Daily, Weekly, etc.)",
          required: true,
          options: ["Daily", "Weekly", "etc"],
        },
        {
          name: "Week Days",
          type: "Text (Sunday, Monday, etc.)",
          required: true,
          options: ["Sunday", "Monday", "etc"],
        },
        { name: "End Date", type: "DD-MM-YYYY", required: true },
        { name: "Attachment File", type: "File", required: false },
      ],
      demoData: [
        "Recurring Task",
        "Desc...",
        "user@example.com",
        "John",
        "Eng",
        '"itemA,itemB"',
        "01-08-2024",
        "Weekly",
        '"Monday,Wednesday,Friday"',
        "31-12-2024",
        "file.docx",
      ],
    },
    dependent: {
      name: "Dependent Task",
      subtitle: "Linked",
      columns: [
        { name: "Task ID", type: "Parent Task", required: true },
        { name: "Task Title", type: "Text", required: true },
        { name: "Task Description", type: "Text", required: true },
        { name: "Assign To(Email)", type: "Text", required: true },
        { name: "Assign To(Name)", type: "Text", required: false },
        { name: "Assign To UserDepartment", type: "Text", required: true },
        { name: "Check List", type: "Optional", required: false },
        { name: "Task End Days", type: "Number", required: false },
        {
          name: "Start Time Setting",
          type: "Planned to Planned / Actual to Planned",
          required: true,
        },
        {
          name: "Frequency",
          type: "T+X days / T+X hours",
          required: true,
          value: "T+X days",
        },
        { name: "X Value", type: "Number", required: true },
        { name: "Attachment File", type: "File", required: false },
      ],
      demoData: [
        "25120001",
        "Dependent Task",
        "Desc...",
        "user@example.com",
        "John",
        "Eng",
        '"item1,item2"',
        1,
        "Planned to Planned",
        "T+X days",
        "2",
        "",
      ],
    },
  };

  const downloadTemplate = () => {
    const template = templates[importTaskType];
    const headers = template.columns.map((col) => col.name);
    const demoRow = template.demoData;
    const csvContent = [headers.join(","), demoRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, "_")}_Template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast.error("File size cannot exceed 2MB.");
        return;
      }
      setUploadFile(selectedFile);
      setImportError(null);
      setErrorFileUrl(null);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = null;
    fileInputRef.current.click();
  };

  const handleAttachmentFileChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      const filesArray = Array.from(selectedFiles);
      for (const file of filesArray) {
        if (file.size > 2 * 1024 * 1024) {
          toast.error(
            `File "${file.name}" is too large. Each file cannot exceed 2MB.`,
          );
          return;
        }
      }
      setAttachmentFiles(filesArray);
      handleAttachmentUpload(Array.from(selectedFiles));
    }
  };

  const handleAttachmentFilesClick = () => {
    if (attachmentFileInputRef.current)
      attachmentFileInputRef.current.value = null;
    attachmentFileInputRef.current.click();
  };

  const handleAttachmentFolderClick = () => {
    if (attachmentFolderInputRef.current)
      attachmentFolderInputRef.current.value = null;
    attachmentFolderInputRef.current.click();
  };

  const handleAttachmentUpload = async (filesToUpload) => {
    if (filesToUpload.length === 0) {
      toast.error("Please select attachment files first!");
      return;
    }
    setIsUploadingAttachment(true);
    setUploadedAttachmentNames(filesToUpload.map((f) => f.name));
    const formData = new FormData();
    filesToUpload.forEach((file) => {
      formData.append("attachments", file);
    });
    try {
      const response = await api.post("/tasks/upload-attachment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        setUploadedAttachmentBackendNames(response.data.data.filenames);
        toast.success(
          `${response.data.data.filenames.length} attachments uploaded successfully.`,
        );
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Attachment upload error:", error);
      toast.error(
        `Error uploading attachments: ${error.response?.data?.message || error.message}`,
      );
      setUploadedAttachmentNames([]);
      setUploadedAttachmentBackendNames([]);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const proceedWithUpload = async () => {
    if (!uploadFile) {
      toast.error("Please upload a file first!");
      return;
    }
    setIsImporting(true);
    setImportError(null);
    setErrorFileUrl(null);
    const formData = new FormData();
    formData.append("file", uploadFile);
    if (uploadedAttachmentBackendNames.length > 0) {
      formData.append(
        "attachmentFilenames",
        JSON.stringify(uploadedAttachmentBackendNames),
      );
    }

    try {
      const response = await api.post("/tasks/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 201) {
        toast.success(response.data.message);
        setIsImportDialogOpen(false);
        onRefreshTasks(); // Refresh tasks in parent
      }
    } catch (error) {
      console.error("Import error:", error);
      if (error.response) {
        if (error.response.status === 422) {
          setImportError(
            error.response.data.message ||
              "The uploaded file has validation errors.",
          );
          const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
          const fullUrl = `${apiBaseUrl}/tasks/download?filePath=${encodeURIComponent(error.response.data.errorFile)}`;
          setErrorFileUrl(fullUrl);
        } else {
          setImportError(
            error.response.data?.message ||
              `An error occurred: ${error.response.statusText}`,
          );
        }
      } else {
        setImportError("Network error or cannot connect to the server.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (!uploadFile) {
      toast.error("Please upload a file first!");
      return;
    }

    Papa.parse(uploadFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          proceedWithUpload();
          return;
        }

        const errors = [];
        const firstRow = rows[0] || {};
        const getHeader = (name) =>
          Object.keys(firstRow).find(
            (k) => k.toLowerCase().trim() === name.toLowerCase().trim(),
          );

        const parseDate = (dateStr) => {
          if (!dateStr || typeof dateStr !== "string") return null;
          const parts = dateStr.split("-");
          if (parts.length !== 3) return null;
          const [day, month, year] = parts.map((p) => parseInt(p, 10));
          if (
            isNaN(day) ||
            isNaN(month) ||
            isNaN(year) ||
            day < 1 ||
            day > 31 ||
            month < 1 ||
            month > 12 ||
            year < 1900
          )
            return null;
          return new Date(year, month - 1, day);
        };

        const validateRowDates = (
          row,
          index,
          startDateHeader,
          endDateHeader,
          dateTypeName,
        ) => {
          const startDate = parseDate(row[startDateHeader]);
          const endDate = parseDate(row[endDateHeader]);
          if (startDate && endDate && endDate < startDate) {
            errors.push(
              `Row ${index + 2}: ${dateTypeName} (${row[endDateHeader]}) cannot be before Start Date (${row[startDateHeader]}).`,
            );
          }
        };

        if (importTaskType === "recurring") {
          const frequencyHeader = getHeader("frequency");
          const weekDaysHeader = getHeader("week days");
          const startDateHeader = getHeader("start date");
          const endDateHeader = getHeader("end date");

          if (
            !frequencyHeader ||
            !weekDaysHeader ||
            !startDateHeader ||
            !endDateHeader
          ) {
            errors.push(
              "Recurring tasks CSV must contain 'Frequency', 'Week Days', 'Start Date', and 'End Date' columns.",
            );
          } else {
            rows.forEach((row, index) => {
              if (
                row[frequencyHeader] &&
                row[frequencyHeader].toLowerCase().trim() === "weekly" &&
                !row[weekDaysHeader]
              ) {
                errors.push(
                  `Row ${index + 2}: 'Week Days' is required when Frequency is 'Weekly'.`,
                );
              }
              validateRowDates(
                row,
                index,
                startDateHeader,
                endDateHeader,
                "End Date",
              );
            });
          }
        } else if (importTaskType === "delegation") {
          const startDateHeader = getHeader("start date");

          if (!startDateHeader) {
            errors.push(
              "Delegation tasks CSV must contain a 'Start Date' column.",
            );
          } else {
            rows.forEach((row, index) => {
              validateRowDates(row, index, startDateHeader, null, "Start Date");
            });
          }
        }

        if (errors.length > 0) {
          setImportError("Validation failed:\n" + errors.join("\n"));
          setErrorFileUrl(null);
          toast.error("The imported file has validation errors.", {
            description: "Please check the details in the dialog.",
            duration: 5000,
          });
        } else {
          proceedWithUpload();
        }
      },
      error: (err) => {
        toast.error(`CSV parsing failed: ${err.message}`);
        setImportError(`CSV parsing failed: ${err.message}`);
      },
    });
  };

  const handleDownloadAttachment = (attachmentFile) => {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
    const serverBaseUrl = apiBaseUrl.replace("/api/v1", "");
    const attachmentUrl = `${serverBaseUrl}/download/${attachmentFile}`;
    const link = document.createElement("a");
    link.href = attachmentUrl;
    link.setAttribute("download", attachmentFile);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination Logic
  const indexOfLastOneTimeTask = oneTimeCurrentPage * oneTimeItemsPerPage;
  const indexOfFirstOneTimeTask = indexOfLastOneTimeTask - oneTimeItemsPerPage;
  const currentOneTimeTasks = oneTimeTasksList.slice(
    indexOfFirstOneTimeTask,
    indexOfLastOneTimeTask,
  );
  const indexOfLastRecurringTask = recurringCurrentPage * recurringItemsPerPage;
  const indexOfFirstRecurringTask =
    indexOfLastRecurringTask - recurringItemsPerPage;
  const currentRecurringTasks = recurringTasksList.slice(
    indexOfFirstRecurringTask,
    indexOfLastRecurringTask,
  );
  //**Fetch users */
  const [allUsers, setAllUsers] = useState([]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/setup/users/allUsers");
        const users = response.data?.data || [];
        setAllUsers(users);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Could not load users.");
      }
    };

    if (currentUser?._id) {
      fetchUsers();
    }
  }, [currentUser]);

  return (
    <Card className="m-4 shadow-xl bg-white/80 border-0 group">
      <CardHeader className="border-b border-gray-200/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-purple-600" />
          </div>
          <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Task Dashboard
          </CardTitle>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshTasks}
              className="text-gray-500"
            >
              Refresh List
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs
          defaultValue="one-time"
          onValueChange={(val) => setActiveTabForExport(val)}
        >
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <TabsList className="bg-gray-100/50">
              <TabsTrigger value="one-time">One-time Tasks</TabsTrigger>
              <TabsTrigger value="recurrence">Recurring Tasks</TabsTrigger>
            </TabsList>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export Tasks
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <UploadCloud className="mr-2 h-4 w-4" /> Import Tasks
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => openImportDialog("delegation")}
                  >
                    Delegation Task
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openImportDialog("recurring")}
                  >
                    Recurring Task
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openImportDialog("dependent")}
                  >
                    Dependent Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by title or description..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* User Filter */}
            <Select
              value={selectedFilterUser}
              onValueChange={setSelectedFilterUser}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by User" items={users} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <Users className="w-4 h-4 mr-2 opacity-50" />
                  All Users
                </SelectItem>
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Status Filter */}
            <Select
              value={selectedFilterStatus}
              onValueChange={setSelectedFilterStatus}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <ListTodo className="w-4 h-4 mr-2 opacity-50" />
                  All Status
                </SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* --- ONE TIME TASKS TAB --- */}
          <TabsContent value="one-time">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Sr.</TableHead>
                    <TableHead className="whitespace-nowrap">Task ID</TableHead>
                    <TableHead className="whitespace-nowrap">Title</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Description
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Assigned By
                    </TableHead>{" "}
                    <TableHead className="whitespace-nowrap">
                      Assigned To
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Assign To Department
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Start Date
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Due Date
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Delay</TableHead>
                    {/* <TableHead className="whitespace-nowrap text-center">
                      Attachment
                    </TableHead> */}
                    <TableHead className="whitespace-nowrap text-center">
                      Status
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="text-center py-2 text-gray-500"
                      >
                        Loading tasks...
                      </TableCell>
                    </TableRow>
                  ) : currentOneTimeTasks.length > 0 ? (
                    currentOneTimeTasks.map((task, i) => {
                      const assignedByUser = allUsers.find(
                        (u) => String(u._id) === String(task.assignedBy?._id),
                      );

                      const assignedToUser = allUsers.find(
                        (u) => String(u._id) === String(task.assignedTo?._id),
                      );
                      return (
                        <TableRow
                          key={task._id || i}
                          className="hover:bg-slate-50"
                        >
                          <TableCell>
                            {indexOfFirstOneTimeTask + i + 1}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {task.TaskId || "-"}
                          </TableCell>
                          <TableCell
                            className="font-medium whitespace-nowrap truncate max-w-[150px]"
                            title={task.title}
                          >
                            {task.title}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() =>
                                onViewDescription(task.description)
                              }
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
                          </TableCell>
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
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap">
                            {task.assignedTo?.name ||
                              task.assignedTo?.email ||
                              "Unassigned"}
                          </TableCell> */}
                          <TableCell className="whitespace-nowrap">
                            {task.departmentOfAssignToUser?.name || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {task.startDate ? formatDate(task.startDate) : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {task.dueDate ? formatDate(task.dueDate) : "-"}
                          </TableCell>
                          <TableCell>-</TableCell>
                          {/* <TableCell className="text-center">
                          {Array.isArray(task.attachmentFile) &&
                          task.attachmentFile.length > 0 ? (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() =>
                                handleDownloadAttachment(task.attachmentFile)
                              }
                            >
                              Download
                            </Button>
                          ) : (
                            "No"
                          )}
                        </TableCell> */}
                          <TableCell className="text-center">
                            {getStatusBadge(task.status)}
                          </TableCell>
                          <TableCell className="flex items-center justify-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleEditClick(task)}
                                    disabled={task.status == "Completed"}
                                  >
                                    <FilePenLine className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Task</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-600 hover:bg-gray-50"
                                    onClick={() => handleChecklistClick(task)}
                                    disabled={
                                      !task.checklist ||
                                      task.checklist.length === 0
                                    }
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
                                    className="h-8 w-8 text-green-600 hover:bg-green-50"
                                    onClick={() => handleToggleComplete(task)}
                                    disabled={
                                      task.status == "Completed" ||
                                      (task.checklist &&
                                        task.checklist.length > 0)
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Mark as Complete</p>
                                </TooltipContent>
                              </Tooltip>

                              {currentUser &&
                                (currentUser.role?.name === "Admin" ||
                                  currentUser.role === "Admin" ||
                                  currentUser._id ===
                                    (task.createdBy?._id ||
                                      task.createdBy)) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                                        onClick={() => openReassignDialog(task)}
                                      >
                                        <Users className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Re-assign User</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteClick(task)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Task</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="text-center py-8 text-gray-500"
                      >
                        No tasks found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Pagination
              totalItems={oneTimeTasksList.length}
              itemsPerPage={oneTimeItemsPerPage}
              setItemsPerPage={setOneTimeItemsPerPage}
              currentPage={oneTimeCurrentPage}
              onPageChange={setOneTimeCurrentPage}
              isLoading={tasksLoading}
            />
          </TabsContent>

          <TabsContent value="recurrence">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">#</TableHead>
                    <TableHead className="whitespace-nowrap">Task ID</TableHead>
                    <TableHead className="whitespace-nowrap">Title</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Description
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Frequency
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Week Days
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Start Date
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      End Date
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Assigned By
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Assigned To
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Assign To Department
                    </TableHead>
                    {/* <TableHead className="whitespace-nowrap text-center">
                      Attachment
                    </TableHead> */}
                    <TableHead className="whitespace-nowrap text-center">
                      Status
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center py-2 text-gray-500"
                      >
                        Loading tasks...
                      </TableCell>
                    </TableRow>
                  ) : currentRecurringTasks.length > 0 ? (
                    currentRecurringTasks.map((task, i) => {
                      const assignedByUser = allUsers.find(
                        (u) => String(u._id) === String(task.assignedBy?._id),
                      );

                      const assignedToUser = allUsers.find(
                        (u) => String(u._id) === String(task.assignedTo?._id),
                      );
                      return (
                        <TableRow
                          key={task._id || i}
                          className="hover:bg-slate-50"
                        >
                          <TableCell>
                            {indexOfFirstRecurringTask + i + 1}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {task.TaskId || "-"}
                          </TableCell>
                          <TableCell
                            className="font-medium whitespace-nowrap truncate max-w-[150px]"
                            title={task.title}
                          >
                            {task.title}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() =>
                                onViewDescription(task.description)
                              }
                            >
                              View
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700"
                            >
                              {task.frequency || "Custom"}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-100">
                            {(() => {
                              const frequency = task.frequency?.toLowerCase();
                              if (frequency !== "weekly" || !task.weekDays)
                                return "-";
                              let days = task.weekDays;
                              if (typeof days === "string") {
                                try {
                                  days = JSON.parse(days);
                                } catch (e) {
                                  return days;
                                }
                              }
                              if (Array.isArray(days) && days.length > 0) {
                                if (
                                  typeof days[0] === "object" &&
                                  days[0] !== null
                                ) {
                                  return days
                                    .map((d) => d.label || d.value || d.day)
                                    .join(", ");
                                }
                                return days.join(", ");
                              }
                              return "-";
                            })()}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {task.startDate ? formatDate(task.startDate) : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {task.endDate ? formatDate(task.endDate) : "-"}
                          </TableCell>
                          <TableCell className="w-100">
                            <div className="flex flex-row gap-1 ">
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
                          </TableCell>

                          <TableCell className="w-100">
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
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap">
                            {task.assignedTo?.name || "Unassigned"}
                          </TableCell> */}
                          <TableCell className="whitespace-nowrap">
                            {task.departmentOfAssignToUser?.name || "-"}
                          </TableCell>
                          {/* <TableCell className="text-center">
                          {task.attachmentFile ? (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() =>
                                handleDownloadAttachment(task.attachmentFile)
                              }
                            >
                              Download
                            </Button>
                          ) : (
                            "No"
                          )}
                        </TableCell> */}
                          <TableCell className="text-center">
                            {getStatusBadge(task.status)}
                          </TableCell>
                          <TableCell className="flex items-center justify-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleEditClick(task)}
                                  >
                                    <FilePenLine className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Task</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-600 hover:bg-gray-50"
                                    onClick={() => handleChecklistClick(task)}
                                    disabled={
                                      !task.checklist ||
                                      task.checklist.length === 0
                                    }
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
                                    className="h-8 w-8 text-green-600 hover:bg-green-50"
                                    onClick={() => handleToggleComplete(task)}
                                    disabled={
                                      task.checklist &&
                                      task.checklist.length > 0
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Mark as Complete</p>
                                </TooltipContent>
                              </Tooltip>

                              {currentUser &&
                                (currentUser.role?.name === "Admin" ||
                                  currentUser.role === "Admin" ||
                                  currentUser._id ===
                                    (task.createdBy?._id ||
                                      task.createdBy)) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                                        onClick={() => openReassignDialog(task)}
                                      >
                                        <Users className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Re-assign User</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteClick(task)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Task</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center py-8 text-gray-500"
                      >
                        No recurring tasks found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Pagination
              totalItems={recurringTasksList.length}
              itemsPerPage={recurringItemsPerPage}
              setItemsPerPage={setRecurringItemsPerPage}
              currentPage={recurringCurrentPage}
              onPageChange={setRecurringCurrentPage}
              isLoading={tasksLoading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      {/* --- EDIT DIALOG --- */}

      <Dialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        className="sm:max-w-4xl px-8"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details below.
            </DialogDescription>
          </DialogHeader>
          <AntdTabs activeKey={activeTab} onChange={setActiveTab}>
            <AntdTabs.TabPane tab="Task Info" key="basic">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Task Title</Label>
                    <Input
                      id="edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select
                      value={editAssignedTo}
                      onValueChange={setEditAssignedTo}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select User" items={users} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2 px-2">
                  <Label htmlFor="edit-desc">Description</Label>
                  <Textarea
                    id="edit-desc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                {editingTask?.taskType === "RecurringTask" ||
                editingTask?.recurrenceFrequency ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <DatePicker
                        format="DD MMM YYYY"
                        value={editStartDate ? dayjs(editStartDate) : null}
                        onChange={(date) =>
                          setEditStartDate(date ? date.toDate() : null)
                        }
                        style={{ width: "100%", height: "40px" }}
                      />
                      {/* <Input
                    type="date"
                    value={
                      editStartDate ? format(editStartDate, "yyyy-MM-dd") : ""
                    }
                    onChange={(e) => dateChangeHandler(e, setEditStartDate)}
                  /> */}
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={editRecurrenceFrequency}
                        onValueChange={(value) => {
                          setEditRecurrenceFrequency(value);
                          if (value !== "weekly") {
                            setEditWeeklyRecurrenceDays([]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="half-yearly">
                            Half Yearly
                          </SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <DatePicker
                        format="DD MMM YYYY"
                        value={
                          editRecurrenceEndDate
                            ? dayjs(editRecurrenceEndDate)
                            : null
                        }
                        onChange={(date) =>
                          setEditRecurrenceEndDate(date ? date.toDate() : null)
                        }
                        style={{ width: "100%", height: "40px" }}
                      />
                      {/* <Input
                    type="date"
                    value={
                      editRecurrenceEndDate
                        ? format(editRecurrenceEndDate, "yyyy-MM-dd")
                        : ""
                    }
                    onChange={(e) =>
                      dateChangeHandler(e, setEditRecurrenceEndDate)
                    }
                  /> */}
                    </div>
                    {editRecurrenceFrequency === "weekly" && (
                      <div className="md:col-span-3 space-y-2">
                        <Label>Select Days of the Week</Label>
                        <div className="flex flex-wrap gap-4 pt-2">
                          {[
                            "Sunday",
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                          ].map((day) => (
                            <div key={day} className="flex items-center gap-2">
                              <Checkbox
                                id={`edit-day-${day}`}
                                checked={editWeeklyRecurrenceDays.includes(
                                  day.toLowerCase(),
                                )}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const dayLowerCase = day.toLowerCase();
                                  setEditWeeklyRecurrenceDays((prev) =>
                                    checked
                                      ? [...prev, dayLowerCase]
                                      : prev.filter((d) => d !== dayLowerCase),
                                  );
                                }}
                              />
                              <Label
                                htmlFor={`edit-day-${day}`}
                                className="font-normal cursor-pointer"
                              >
                                {day}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <DatePicker
                        format="DD MMM YYYY"
                        value={editStartDate ? dayjs(editStartDate) : null}
                        onChange={(date) =>
                          setEditStartDate(date ? date.toDate() : null)
                        }
                        style={{ width: "100%", height: "40px" }}
                      />
                      {/* <Input
                    type="date"
                    value={
                      editStartDate ? format(editStartDate, "yyyy-MM-dd") : ""
                    }
                    onChange={(e) => dateChangeHandler(e, setEditStartDate)}
                  /> */}
                    </div>
                    <div className="space-y-2">
                      <Label>How many days Task Ended</Label>
                      <Input
                        type="number"
                        // Removed taskEndDateOffset from here - check original
                        // value={taskEndDateOffset}
                        // onChange={(e) => setTaskEndDateOffset(e.target.value)}
                        placeholder="E.g., 1 for same day, 2 for next day"
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      {/* <Label>Attachment</Label>
                      <Upload
                        listType="picture"
                        multiple
                        fileList={editFileList}
                        onChange={({ fileList }) => setEditFileList(fileList)}
                        onPreview={(file) => window.open(file.url)}
                        onRemove={(file) => handleRemove(file)}
                        beforeUpload={() => false} // manual upload
                      >
                        <AntButton icon={<UploadOutlined />}>
                          Upload Files
                        </AntButton>
                      </Upload> */}
                      {/* <Input
                    type="file"
                    onChange={(e) => setEditAttachment(e.target.files?.[0])}
                  /> */}
                    </div>
                  </div>
                )}
                {/* Edit Checklist */}
                <div className="border rounded p-3 mx-2 bg-slate-50">
                  <Label className="mb-2 block">Checklist</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={editChecklistItem}
                      onChange={(e) => setEditChecklistItem(e.target.value)}
                      placeholder="New item..."
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addEditChecklistItem())
                      }
                    />
                    <Button
                      type="button"
                      onClick={addEditChecklistItem}
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {editChecklist.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-white p-2 rounded border"
                      >
                        <span className="text-sm">{item.text}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => removeEditChecklistItem(idx)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AntdTabs.TabPane>
            <AntdTabs.TabPane tab="Attachments" key="attachments">
              <AttachmentTab
                editFileList={editFileList}
                setEditFileList={setEditFileList}
                handleRemove={handleRemove}
                loadAttachments={loadAttachments}
              />
            </AntdTabs.TabPane>
          </AntdTabs>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setActiveTab("basic");
                setEditFileList([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} /* disabled={loading} */>
              {/* {loading ? 'Saving...' : 'Save Changes'} */ "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- REASSIGN DIALOG --- */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
            <DialogDescription>
              Choose a user to reassign this task to. Optionally filter by
              department.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departments</Label>
              <div className="space-y-1 max-h-56 overflow-y-auto p-2 border rounded bg-white">
                <div
                  className={cn(
                    "flex items-center gap-2 p-1 rounded cursor-pointer",
                    reassignDeptFilter === null ? "bg-slate-100" : "",
                  )}
                  onClick={() => setReassignDeptFilter(null)}
                >
                  <div className="text-sm text-slate-600">All Departments</div>
                </div>
                {departments.map((d) => (
                  <div
                    key={d._id}
                    className={cn(
                      "flex items-center gap-2 p-1 rounded cursor-pointer",
                      reassignDeptFilter === d._id ? "bg-slate-100" : "",
                    )}
                    onClick={() =>
                      setReassignDeptFilter(
                        reassignDeptFilter === d._id ? null : d._id,
                      )
                    }
                  >
                    <div className="text-sm">{d.name}</div>
                    <div className="ml-auto text-xs text-gray-400">
                      {
                        users.filter(
                          (u) =>
                            u.department?._id === d._id ||
                            (Array.isArray(u.department) &&
                              u.department.some((x) => x && x._id === d._id)),
                        ).length
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign To (User)</Label>
              <div className="space-y-1 max-h-56 overflow-y-auto p-2 border rounded bg-white">
                {users
                  .filter(
                    (u) =>
                      !reassignDeptFilter ||
                      u.department?._id === reassignDeptFilter ||
                      (Array.isArray(u.department) &&
                        u.department.some(
                          (d) => d?._id === reassignDeptFilter,
                        )),
                  )
                  .map((u) => (
                    <div
                      key={u._id}
                      className={cn(
                        "flex items-center gap-2 p-1 rounded cursor-pointer",
                        reassignSelectedUser === u._id ? "bg-indigo-50" : "",
                      )}
                      onClick={() => setReassignSelectedUser(u._id)}
                    >
                      <input
                        type="radio"
                        name="reassign-user"
                        checked={reassignSelectedUser === u._id}
                        readOnly
                        className="accent-indigo-600"
                      />
                      <div className="text-sm">{u.name || u.email}</div>
                    </div>
                  ))}

                {users.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No users available.
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassignSubmit} /* disabled={loading} */>
              {/* {loading ? 'Reassigning...' : 'Reassign'} */ "Reassign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isParentWithChildren ? "Delete Parent Task" : "Confirm Deletion"}
            </DialogTitle>
            <DialogDescription>
              {isParentWithChildren ? (
                <div className="space-y-2 mt-2">
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-900 text-sm">
                    <p className="font-semibold mb-1">
                      ⚠️ This task is Parent task of ({childTasksCount}) task(s)
                    </p>
                    <p>
                      Deleting this parent task will also delete all{" "}
                      {childTasksCount} dependent task(s). This action cannot be
                      undone.
                    </p>
                  </div>
                </div>
              ) : (
                "Are you sure you want to delete this task? This action cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>

          {isParentWithChildren && (
            <div className="space-y-2 py-2">
              <Label htmlFor="delete-remark">Remark (Optional)</Label>
              <Textarea
                id="delete-remark"
                placeholder="Enter a remark or reason for deleting this task and its dependents..."
                value={deleteRemark}
                onChange={(e) => setDeleteRemark(e.target.value)}
                className="min-h-24 resize-none"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className={
                isParentWithChildren ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              {isParentWithChildren ? "Delete Parent & Dependents" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- CHECKLIST VIEW DIALOG --- */}
      <Dialog
        open={isChecklistDialogOpen}
        onOpenChange={setIsChecklistDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Task Checklist</DialogTitle>
            <DialogDescription>
              Complete all items to finish the task.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {(checklistItems || []).map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50"
              >
                <Checkbox
                  id={`checklist-${index}`}
                  checked={item.isCompleted}
                  onChange={() => handleChecklistChange(index)}
                />
                <label
                  htmlFor={`checklist-${index}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {item.text}
                </label>
              </div>
            ))}
            {(!checklistItems || checklistItems.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                This task has no checklist items.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChecklistDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteTaskFromChecklist}
              disabled={
                !checklistItems ||
                checklistItems.length === 0 ||
                !checklistItems.every((item) => item.isCompleted)
              }
            >
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- IMPORT DIALOG --- */}
      <Dialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        className="sm:max-w-6xl"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Import {importTaskType ? templates[importTaskType].name : ""}s
            </DialogTitle>
            <DialogDescription>
              Follow the steps below to bulk import tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left Column: Instructions */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-gray-500" />
                Required Columns Structure
              </h4>
              <div className="grid grid-cols-2 gap-4 p-3 bg-white border border-gray-200 rounded-lg">
                <div>
                  <h5 className="font-semibold mb-2 text-sm text-gray-800">
                    Required Fields
                  </h5>
                  {importTaskType &&
                    templates[importTaskType].columns
                      .filter((c) => c.required)
                      .map((col, index) => (
                        <div
                          key={index}
                          className="flex items-center mb-1 gap-0 px-3 py-1.5 rounded-md text-xs font-semibold border bg-red-50 text-red-700 border-red-200"
                        >
                          <span>{col.name}</span>({col.type})
                        </div>
                      ))}
                </div>
                <div>
                  <h5 className="font-semibold mb-2 text-sm text-gray-800">
                    Optional Fields
                  </h5>
                  {importTaskType &&
                    templates[importTaskType].columns
                      .filter((c) => !c.required)
                      .map((col, index) => (
                        <div
                          key={index}
                          className="flex items-center mb-1 gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border bg-gray-100 text-gray-600 border-gray-200"
                        >
                          <span>{col.name}</span>({col.type})
                        </div>
                      ))}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full mt-2"
              >
                <Download className="mr-2 h-3 w-3" />
                Download {importTaskType
                  ? templates[importTaskType].name
                  : ""}{" "}
                CSV Template
              </Button>
            </div>

            {/* Right Column: Upload */}
            <div className="space-y-4">
              {/* Attachment Upload */}
              <div className="space-y-2">
                <Label className="font-semibold">
                  Upload Attachments (Optional)
                </Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    ref={attachmentFileInputRef}
                    onChange={handleAttachmentFileChange}
                    className="hidden"
                    multiple
                  />
                  <input
                    type="file"
                    ref={attachmentFolderInputRef}
                    onChange={handleAttachmentFileChange}
                    className="hidden"
                    webkitdirectory="true"
                  />
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      onClick={handleAttachmentFilesClick}
                      disabled={isUploadingAttachment}
                      variant="outline"
                    >
                      <FileText className="mr-2 h-4 w-4" /> Select Files
                    </Button>
                    <Button
                      onClick={handleAttachmentFolderClick}
                      disabled={isUploadingAttachment}
                      variant="outline"
                    >
                      <Folder className="mr-2 h-4 w-4" /> Select Folder
                    </Button>
                  </div>
                  {isUploadingAttachment && (
                    <p className="text-sm text-gray-500 mt-2">
                      Uploading attachments...
                    </p>
                  )}
                  {uploadedAttachmentBackendNames.length > 0 &&
                    !isUploadingAttachment && (
                      <p className="text-sm text-green-600 mt-2">
                        {uploadedAttachmentBackendNames.length} files attached
                        successfully.
                      </p>
                    )}
                </div>
              </div>
              {/* Main File Upload */}
              <div className="space-y-2">
                <Label className="font-semibold">Upload Data File</Label>
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                  >
                    <UploadCloud className="w-14 h-14 text-gray-400 mb-2" />
                    <span className="text-sm font-semibold text-blue-600">
                      Click to upload
                    </span>
                    <span className="text-xs text-gray-500">
                      or drag and drop
                    </span>
                  </label>
                  {uploadFile && (
                    <div className="mt-4 text-center text-sm text-green-600 font-medium">
                      <p>Selected: {uploadFile.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Error Display */}
            {importError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-900 text-sm">
                <p className="font-semibold mb-1">⚠️ {importError}</p>
                {errorFileUrl && (
                  <a
                    href={errorFileUrl}
                    download
                    className="text-red-700 underline font-bold"
                  >
                    Download Error Report
                  </a>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!uploadFile || isImporting}
              >
                {isImporting ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TaskTable;
