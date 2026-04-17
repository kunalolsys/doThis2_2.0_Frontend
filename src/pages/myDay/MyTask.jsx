import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../../context/SocketContext";
import QuickTaskActions from "../../components/QuickTaskActions";
import {
  completeFMSTask,
  fetchMyTasks,
  fetchTaskCounts,
  getFilterTasks,
  getMyTaskStats,
  updateFMSTaskChecklistItems,
  updateMyTaskChecklistItems,
  updateMyTaskFormData,
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
  FormInputIcon,
  ListChecks,
  RotateCcw,
  Calendar,
  Activity,
  PauseCircle,
  StopCircle,
  XCircle,
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
import { formatDate, formatLabel } from "../../lib/utilFunctions";
import ViewLink from "./attachmentViewer";
import { useDebounce } from "../../lib/debounce";
import { DatePicker } from "antd";
const { RangePicker } = DatePicker;
import * as Yup from "yup";
import { useFormik } from "formik";

// --- Helper: Status Badge ---
const getStatusBadge = (status) => {
  switch (status) {
    case "Overdue":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>
      );

    case "Due Today":
    case "Delayed":
      return (
        <Badge className="flex items-center gap-1 text-yellow-600 border-yellow-300 bg-yellow-50">
          <Clock className="h-3 w-3" />
          {status}
        </Badge>
      );

    case "Completed":
      return (
        <Badge className="flex items-center gap-1 text-green-600 border-green-300 bg-green-50">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );

    case "Pending":
      return (
        <Badge className="flex items-center gap-1 text-blue-600 border-blue-300 bg-blue-50">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );

    case "Upcoming":
      return (
        <Badge className="flex items-center gap-1 text-indigo-600 border-indigo-300 bg-indigo-50">
          <Calendar className="h-3 w-3" />
          Upcoming
        </Badge>
      );

    case "Ongoing":
    case "InProcess":
      return (
        <Badge className="flex items-center gap-1 text-cyan-600 border-cyan-300 bg-cyan-50">
          <Activity className="h-3 w-3" />
          In Process
        </Badge>
      );

    case "Onhold":
      return (
        <Badge className="flex items-center gap-1 text-orange-600 border-orange-300 bg-orange-50">
          <PauseCircle className="h-3 w-3" />
          On Hold
        </Badge>
      );

    case "Stopped":
      return (
        <Badge className="flex items-center gap-1 text-red-600 border-red-300 bg-red-50">
          <StopCircle className="h-3 w-3" />
          Stopped
        </Badge>
      );

    case "Cancelled":
      return (
        <Badge className="flex items-center gap-1 text-gray-600 border-gray-300 bg-gray-100">
          <XCircle className="h-3 w-3" />
          Cancelled
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
  handleCompleteClick,
}) => {
  const isCompleted = task.status === "Completed";
  const upComing = task.status == "Upcoming";
  const onHold = task.status == "Onhold";
  const stopped = task.status == "Stopped";
  const isFms = task.taskType == "FmsInstanceTask";
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
              ((!task.checklist || task.checklist.length === 0) &&
                !isCompleted) ||
              onHold ||
              stopped
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
            className="h-8 w-8 text-gray-600 hover:bg-gray-50"
            onClick={() => handleCompleteClick(task)}
            disabled={
              ((!task.createdForm || task.createdForm.length === 0) &&
                !isCompleted) ||
              onHold ||
              stopped
            }
          >
            <ListChecks className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View Form</p>
        </TooltipContent>
      </Tooltip>

      {/* Complete/Reopen Button */}
      {!isCompleted ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={upComing || onHold || stopped}
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
      ) : !isFms ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-yellow-600 hover:bg-yellow-50"
              onClick={() => onToggleComplete(task)}
              disabled={onHold || stopped}
            >
              {/* You can change icon if you want */}
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reopen Task</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <></>
      )}

      {/* Note: Edit and Delete actions intentionally removed from UI per request */}
    </div>
  );
};
const buildValidationSchema = (fields) => {
  const shape = {};

  fields.forEach((field) => {
    let validator;

    switch (field.fieldType) {
      case "email":
        validator = Yup.string().email("Invalid email");
        break;

      case "number":
        validator = Yup.number().typeError("Must be a number");
        break;

      case "checkbox":
        validator = Yup.boolean();
        break;

      case "date":
        validator = Yup.date().typeError("Invalid date");
        break;

      default:
        validator = Yup.string().trim();
    }

    if (field.isMandatory) {
      validator = validator.required(
        `${formatLabel(field.fieldName)} is required`,
      );
    }

    shape[field.fieldName] = validator;
  });

  return Yup.object().shape(shape);
};

/* ------------------ ✅ Component ------------------ */
const FmsFormModal = ({ open, onClose, task, onSubmit }) => {
  const formatLabel = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const formik = useFormik({
    enableReinitialize: true,

    /* ✅ Dynamic Initial Values */
    initialValues:
      task?.createdForm?.reduce((acc, field) => {
        acc[field.fieldName] =
          task?.formData?.[field.fieldName] ??
          (field.fieldType === "checkbox" ? false : "");
        return acc;
      }, {}) || {},

    /* ✅ Dynamic Validation */
    validationSchema: buildValidationSchema(task?.createdForm || []),

    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg w-[480px] max-h-[80vh] overflow-y-auto border">
        {/* Header */}
        <div className="px-5 py-3 border-b">
          <h2 className="text-base font-semibold text-gray-800">
            Fill Task Form
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {task.createdForm.map((field, index) => (
            <div key={index}>
              <label className="block text-sm text-gray-700 mb-1">
                {formatLabel(field.fieldName)}
                {field.isMandatory && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>

              {/* TEXT / EMAIL */}
              {["text", "email"].includes(field.fieldType) && (
                <input
                  type={field.fieldType}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  {...formik.getFieldProps(field.fieldName)}
                />
              )}

              {/* NUMBER */}
              {field.fieldType === "number" && (
                <input
                  type="number"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  {...formik.getFieldProps(field.fieldName)}
                />
              )}

              {/* TEXTAREA */}
              {field.fieldType === "textarea" && (
                <textarea
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  {...formik.getFieldProps(field.fieldName)}
                />
              )}

              {/* DROPDOWN */}
              {field.fieldType === "dropdown" && (
                <Select
                  value={formik.values[field.fieldName] || ""}
                  onValueChange={(value) =>
                    formik.setFieldValue(field.fieldName, value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={`Select ${formatLabel(field.fieldName)}`}
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {field.options?.map((opt, i) => (
                      <SelectItem key={i} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* CHECKBOX */}
              {field.fieldType === "checkbox" && (
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={formik.values[field.fieldName] || false}
                    onChange={(e) =>
                      formik.setFieldValue(field.fieldName, e.target.checked)
                    }
                  />
                </div>
              )}

              {/* DATE */}
              {field.fieldType === "date" && (
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  {...formik.getFieldProps(field.fieldName)}
                />
              )}

              {/* ERROR MESSAGE */}
              {formik.touched[field.fieldName] &&
                formik.errors[field.fieldName] && (
                  <p className="text-red-500 text-xs mt-1">
                    {formik.errors[field.fieldName]}
                  </p>
                )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm border rounded-md text-gray-700"
          >
            Cancel
          </button>

          {task.status != "Completed" && (
            <button
              onClick={formik.handleSubmit}
              disabled={!formik.isValid}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              Submit
            </button>
          )}
        </div>
      </div>
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
        <span className="text-sm text-gray-600 w-50">Rows per page:</span>
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
      {/* Pending */}
      <Card
        className={`${getCardClass("pending", "yellow")} bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200`}
        onClick={() => onStatClick("pending")}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">
                {counts.pending}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-700" />
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
  dateRange,
  setDateRange,
}) => (
  <div className="flex flex-col md:flex-row gap-3 mb-1 p-4 bg-gray-50 rounded-lg border">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search by Task ID or Title..."
        className="pl-10 bg-white"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
    <div>
      <RangePicker
        value={dateRange}
        onChange={(dates) => setDateRange(dates)}
        format="DD MMM YYYY"
        style={{ height: "36px" }}
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
          <SelectItem value="FmsInstanceTask">FMS</SelectItem>
        </SelectContent>
      </Select>
      {(selectedStatFilter == "total" || !selectedStatFilter) && (
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
  upcomingRecurringTasks,
  onChecklist,
  onToggleComplete,
  onViewDescription,
  currentPage,
  itemsPerPage,
  allUsers,
  handleCompleteClick,
}) => {
  const combinedTasks = [...(tasks || []), ...(upcomingRecurringTasks || [])];
  return (
    <div className="overflow-x-auto border rounded-lg bg-white">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Sr. No.</TableHead>
            <TableHead>Task Id</TableHead>
            <TableHead>Task Title</TableHead>
            <TableHead>Assigned By</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
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
          {combinedTasks.length > 0 ? (
            combinedTasks.map((task, index) => {
              const assignedByUser = allUsers.find(
                (u) => String(u._id) === String(task.assignedBy?._id),
              );

              const assignedToUser = allUsers.find(
                (u) => String(u._id) === String(task.assignedTo?._id),
              );

              return (
                <React.Fragment key={task._id}>
                  <TableRow className={task.isOverdue ? "bg-red-50" : ""}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>{task.TaskId || "-"}</TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
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
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.taskType === "FmsInstanceTask"
                            ? "bg-blue-100 text-blue-700"
                            : task.taskType === "RecurringTask"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {task.taskType === "FmsInstanceTask"
                          ? "FMS"
                          : task.taskType === "RecurringTask"
                            ? "Recurring"
                            : "Delegation"}
                      </span>
                    </TableCell>
                    {/* <TableCell>{task.assignedBy?.name || "Self"}</TableCell> */}
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
                        handleCompleteClick={handleCompleteClick}
                      />
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={14}
                className="text-center py-8 text-gray-500"
              >
                No tasks found for this filter
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// --- MAIN COMPONENT ---
const MyTask = () => {
  const dispatch = useDispatch();
  const {
    tasks: fetchedTasks,
    upcomingRecurringTasks,
    taskCounts,
    status,
    error,
    totalTasks,
  } = useSelector((state) => state.myTasks);
  const { currentUser } = useSelector((state) => state.users);

  // UI State
  const [activeTab, setActiveTab] = useState("today");
  const [configOpen, setConfigOpen] = useState(false);
  const { isConnected, socket: sock, events } = useSocket();

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
  const [dateRange, setDateRange] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  // console.log(dateRange);
  // --- Initial Data Load ---
  useEffect(() => {
    if (currentUser?._id) {
      dispatch(fetchTaskCounts(currentUser._id));
    }
  }, [currentUser, dispatch, refetch]);

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
  useEffect(() => {
    setLocalCurrentPage(1);
  }, [
    activeTab,
    selectedStatFilter,
    selectedFilterStatus,
    selectedFilterTaskType,
    debouncedSearch,
    dateRange,
  ]);
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
      dispatch(getMyTaskStats({ userId: currentUser._id }));
      dispatch(
        getFilterTasks({
          userId: currentUser._id,
          page: localCurrentPage,
          limit: localItemsPerPage,
          dateRange,
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
    dateRange,
    refetch,
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
      const dataToExport = fetchedTasks.map((task, index) => ({
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
    const isFMSTask = task.taskType == "FmsInstanceTask";
    try {
      if (!isFMSTask) {
        await api.patch(`/tasks/${task._id || task.id}/completion`, {
          completeStatus: newStatus,
        });
      } else {
        await dispatch(
          completeFMSTask({
            id: task.fmsInstanceId,
            taskId: task.TaskId,
            status: newStatus,
          }),
        ).unwrap();
      }
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
      toast.error(
        err || err.response.data.message || "Failed to update status",
      );
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
  const handleChecklistToggle = async (task, taskID, index, currentValue) => {
    setRefetch(true);
    const isFMStask = task.taskType == "FmsInstanceTask";
    try {
      // ✅ Optimistic UI (IMMUTABLE)
      const updated = checklistItems.map((item, i) =>
        i === index ? { ...item, isCompleted: !currentValue } : item,
      );

      setChecklistItems(updated);

      if (!isFMStask) {
        // ✅ API CALL
        await dispatch(
          updateMyTaskChecklistItems({
            id: taskID,
            index,
            completed: !currentValue,
          }),
        ).unwrap();
      } else {
        await dispatch(
          updateFMSTaskChecklistItems({
            id: task.fmsInstanceId,
            taskId: task.taskId,
            index,
            completed: !currentValue,
          }),
        ).unwrap();
      }
    } catch (err) {
      console.error(err);

      // ❌ revert UI safely
      const reverted = checklistItems.map((item, i) =>
        i === index ? { ...item, isCompleted: currentValue } : item,
      );

      setChecklistItems(reverted);
    } finally {
      setRefetch(false);
    }
  };

  const handleCompleteClick = (task) => {
    if (task.taskType === "FmsInstanceTask" && task.createdForm?.length > 0) {
      setSelectedTask(task);
      setShowFormModal(true);
    } else {
      // onToggleComplete(task);
    }
  };
  const handleFormSubmit = async (formData) => {
    try {
      // 🔥 1. Save formData first
      await dispatch(
        updateMyTaskFormData({
          id: selectedTask.fmsInstanceId,
          taskId: selectedTask.taskId,
          data: formData,
        }),
      );

      // // 🔥 2. Complete task
      // await dispatch(
      //   completeFmsTask({
      //     instanceId: selectedTask.fmsInstanceId,
      //     taskId: selectedTask.taskId,
      //   })
      // );

      setShowFormModal(false);
    } catch (err) {
      console.error(err);
    }
  };
  if (status === "failed")
    return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="mx-auto">
        {/* SOCKET STATUS BAR */}
        <div className="mb-6 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}
              />
              <div>
                <div className="font-semibold text-emerald-900 text-sm">
                  Live Mode{" "}
                  {isConnected
                    ? `🔌 Connected (${events.length} events)`
                    : "(Disconnected)"}
                </div>
                {isConnected && sock?.id && (
                  <div className="text-xs text-emerald-700 font-mono bg-emerald-100 px-2 py-0.5 rounded">
                    {sock.id.slice(0, 8)}...
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setConfigOpen(true)}
                variant="outline"
              >
                ⚙️ Config
              </Button>
              <Button
                size="sm"
                variant={isConnected ? "destructive" : "secondary"}
              >
                {isConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="flex justify-between items-center px-6">
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

          <CardContent className="px-6 pb-6">
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
                dateRange={dateRange}
                setDateRange={setDateRange}
              />

              {/* DATA TABLE */}
              <div className="space-y-4">
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
                    {selectedStatFilter === "pending" && (
                      <div className="text-sm font-bold text-yellow-600 mb-2">
                        Showing Pending Tasks
                      </div>
                    )}

                    {/* Show search term in UI */}
                    {searchTerm && (
                      <div className="text-sm text-gray-600 mb-2">
                        Searching for: "
                        <span className="font-semibold">{searchTerm}</span>"
                        {/* {totalTasks === 0 && fetchedTasks.length > 0 && (
                          <span className="ml-2 text-red-500">
                            (No matches found in current view)
                          </span>
                        )} */}
                      </div>
                    )}

                    <TooltipProvider>
                      <TodayTasksTable
                        tasks={fetchedTasks}
                        upcomingRecurringTasks={upcomingRecurringTasks}
                        onEdit={handleEditClick}
                        onChecklist={handleChecklistClick}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteClick}
                        onViewDescription={(task) =>
                          handleViewDescription(task.description)
                        }
                        currentPage={localCurrentPage}
                        itemsPerPage={localItemsPerPage}
                        allUsers={allUsers}
                        handleCompleteClick={handleCompleteClick}
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
                      checked={item.isCompleted || item.completed}
                      onCheckedChange={() =>
                        handleChecklistToggle(
                          selectedTaskForChecklist,
                          selectedTaskForChecklist._id,
                          index,
                          item.isCompleted || item.completed,
                        )
                      }
                      disabled={
                        selectedTaskForChecklist?.status === "Completed"
                      }
                      className="mr-3"
                    />

                    <label
                      className={`text-sm ${
                        item.isCompleted || item.completed
                          ? "line-through text-gray-500"
                          : ""
                      }`}
                    >
                      {item.text || item.title}
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

      {/* Form Modal */}
      <FmsFormModal
        open={showFormModal}
        task={selectedTask}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default MyTask;
