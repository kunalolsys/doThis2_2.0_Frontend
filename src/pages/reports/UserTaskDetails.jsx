import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Search,
  Inbox,
  User,
} from "lucide-react";
import api from "../../lib/api";
import { Select as AntdSelect, DatePicker, Spin, message } from "antd";
import dayjs from "dayjs";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import DataPagination from "../../components/ui/commonPagination";

const { RangePicker } = DatePicker;

export default function UserTaskDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query Params & User Info
  const userId = searchParams.get("userId");
  const userName = searchParams.get("userName") || "User Tasks";

  // Filter States
  const [period, setPeriod] = useState(searchParams.get("period") || "this_month");
  const [customDates, setCustomDates] = useState([
    searchParams.get("startDate") ? dayjs(searchParams.get("startDate")) : null,
    searchParams.get("endDate") ? dayjs(searchParams.get("endDate")) : null,
  ]);
  const [departmentId, setDepartmentId] = useState(searchParams.get("departmentId") || "all");
  const [templateId, setTemplateId] = useState(searchParams.get("templateId") || "all");
  const [taskSource, setTaskSource] = useState(searchParams.get("taskSource") || "all");
  const [timingLogic, setTimingLogic] = useState(searchParams.get("timingLogic") || "all");
  const [taskStatus, setTaskStatus] = useState(searchParams.get("taskStatus") || "all");
  const [searchQuery, setSearchQuery] = useState("");

  // Data States
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [exportTasks, setExportTasks] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to calculate delay in days
  const calculateDelayDays = (task) => {
    if (task.delayDays !== undefined && task.delayDays !== null) {
      return task.delayDays;
    }

    const due = task.dueDate ? new Date(task.dueDate) : null;
    if (!due) return 0;

    const completed = task.completedAt ? new Date(task.completedAt) : null;

    if (completed) {
      if (completed > due) {
        const diffTime = completed.getTime() - due.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return 0;
    } else {
      const now = new Date();
      if (now > due && task.status !== "Completed") {
        const diffTime = now.getTime() - due.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
    return 0;
  };

  // 🚀 Fetch Specific User Tasks
  const fetchUserTasks = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const payload = {
        period,
        startDate: customDates[0] ? customDates[0].format("YYYY-MM-DD") : null,
        endDate: customDates[1] ? customDates[1].format("YYYY-MM-DD") : null,
        departmentId: departmentId !== "all" ? departmentId : null,
        templateId: templateId !== "all" ? templateId : null,
        memberIds: [userId],
        taskSource,
        timingLogic,
        taskStatus,
        page,
        limit,
      };

      const res = await api.post("/mis/combined-report", payload);
      setTasks(res.data?.tasks || []);
      setExportTasks(res.data?.allTasksForExport || res.data?.tasks || []);
      setTotalCount(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch user tasks:", err);
      message.error("Failed to load user tasks.");
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    period,
    customDates,
    departmentId,
    templateId,
    taskSource,
    timingLogic,
    taskStatus,
    page,
    limit,
  ]);

  useEffect(() => {
    fetchUserTasks();
  }, [fetchUserTasks]);

  // 🚀 User Specific CSV Export
  const handleExportUserCSV = () => {
    if (!exportTasks.length) {
      message.warning("No user task records to export.");
      return;
    }

    const headers = [
      "Task ID",
      "Title",
      "Type",
      "Assignee",
      "Department",
      "Frequency",
      "Delay Days",
      "Start Date",
      "Due Date",
      "Completed At",
      "Time Status",
    ];

    const csvRows = [headers.join(",")];

    exportTasks.forEach((t) => {
      const delay = calculateDelayDays(t);
      const row = [
        `"${t.taskId || ""}"`,
        `"${t.title || ""}"`,
        `"${t.taskType || ""}"`,
        `"${t.assignedTo?.name || userName}"`,
        `"${t.department || ""}"`,
        `"${t.frequency || "One-time"}"`,
        `"${delay}"`,
        `"${t.startDate ? formatDate(t.startDate) : ""}"`,
        `"${t.dueDate ? formatDate(t.dueDate) : ""}"`,
        `"${t.completedAt ? formatDate(t.completedAt) : ""}"`,
        `"${t.timeStatus || ""}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tasks_${userName.replace(/\s+/g, "_")}_${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.taskId?.toLowerCase().includes(q) ||
        t.instanceName?.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 space-y-4">
      <Card className="border-0 shadow-md bg-white">
        
        {/* Header Bar */}
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9 bg-gray-100 hover:bg-gray-200 border-none rounded-lg cursor-pointer"
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="text-blue-600" size={20} />
                  Task Logs: {userName}
                </CardTitle>
                <p className="text-xs text-gray-500 font-medium">
                  Viewing detailed task breakdown with delay analysis and completion timestamps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportUserCSV}
                className="flex items-center gap-2 text-sm h-[38px] bg-green-50 text-green-700 border-green-200 hover:bg-green-100 font-semibold"
              >
                <Download size={15} />
                Export User Tasks CSV
              </Button>
              <Button
                variant="outline"
                onClick={fetchUserTasks}
                className="flex items-center gap-2 text-sm h-[38px]"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          
          {/* Top Filter Bar */}
          <div className="flex flex-wrap items-end justify-between gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
            <div className="flex flex-wrap items-end gap-3 flex-1">
              
              {/* Period Dropdown */}
              <div className="w-36">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Time Period
                </span>
                <AntdSelect
                  size="middle"
                  value={period}
                  onChange={(v) => {
                    setPeriod(v);
                    setPage(1);
                  }}
                  className="w-full text-xs"
                  options={[
                    { value: "today", label: "Today" },
                    { value: "this_week", label: "This Week" },
                    { value: "this_month", label: "This Month" },
                    { value: "custom", label: "Custom Range" },
                  ]}
                />
              </div>

              {/* Custom Date Range Picker */}
              {period === "custom" && (
                <div className="w-60">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                    Custom Date Range
                  </span>
                  <RangePicker
                    size="middle"
                    value={customDates}
                    className="w-full text-xs rounded-md"
                    onChange={(dates) => {
                      setCustomDates(dates || [null, null]);
                      setPage(1);
                    }}
                  />
                </div>
              )}

              {/* Task Source Toggle */}
              <div className="w-36">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Task Type
                </span>
                <AntdSelect
                  size="middle"
                  value={taskSource}
                  onChange={(v) => {
                    setTaskSource(v);
                    setPage(1);
                  }}
                  className="w-full text-xs"
                  options={[
                    { value: "all", label: "All Tasks" },
                    { value: "fms", label: "FMS Only" },
                    { value: "regular", label: "Regular Only" },
                  ]}
                />
              </div>

              {/* Timing Logic Filter */}
              <div className="w-40">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Timing Logic
                </span>
                <AntdSelect
                  size="middle"
                  value={timingLogic}
                  onChange={(v) => {
                    setTimingLogic(v);
                    setPage(1);
                  }}
                  className="w-full text-xs"
                  options={[
                    { value: "all", label: "All Logic Types" },
                    { value: "actual-to-planned", label: "Actual-to-Planned" },
                    { value: "planned-to-planned", label: "Planned-to-Planned" },
                  ]}
                />
              </div>

              {/* Status Filter */}
              <div className="w-36">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Task Status
                </span>
                <AntdSelect
                  size="middle"
                  value={taskStatus}
                  onChange={(v) => {
                    setTaskStatus(v);
                    setPage(1);
                  }}
                  className="w-full text-xs"
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "completed", label: "Completed" },
                    { value: "pending", label: "Pending" },
                    { value: "overdue", label: "Overdue" },
                  ]}
                />
              </div>

              {/* Search Box */}
              <div className="w-52">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Search
                </span>
                <div className="flex items-center gap-2 bg-white border border-gray-300 px-3 h-[32px] rounded-md">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search tasks or instance..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none flex-1 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <span className="text-xs font-mono text-gray-500 pb-1">
              Total Tasks: <b>{totalCount}</b>
            </span>
          </div>

          {/* User Specific Tasks Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-xs font-bold w-12">#</TableHead>
                  <TableHead className="text-xs font-bold min-w-[90px]">
                    TYPE
                  </TableHead>
                  <TableHead className="text-xs font-bold min-w-[200px]">
                    TASK / INSTANCE
                  </TableHead>
                  <TableHead className="text-xs font-bold min-w-[120px]">
                    FREQUENCY
                  </TableHead>
                  <TableHead className="text-xs font-bold min-w-[120px]">
                    START DATE
                  </TableHead>
                  <TableHead className="text-xs font-bold min-w-[120px]">
                    DUE DATE
                  </TableHead>
                  <TableHead className="text-xs font-bold min-w-[130px]">
                    COMPLETED AT
                  </TableHead>
                  <TableHead className="text-xs font-bold text-center min-w-[100px]">
                    DELAY DAYS
                  </TableHead>
                  <TableHead className="text-xs font-bold text-center min-w-[110px]">
                    TIME STATUS
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-8 text-center">
                      <Spin />
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length > 0 ? (
                  filteredTasks.map((t, idx) => {
                    const delayDays = calculateDelayDays(t);

                    return (
                      <TableRow key={t._id} className="hover:bg-gray-50 text-xs">
                        <TableCell className="p-3 text-gray-400 font-mono">
                          {(page - 1) * limit + idx + 1}
                        </TableCell>

                        {/* Task Type Badge */}
                        <TableCell className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              t.taskType === "FMS"
                                ? "border-purple-300 bg-purple-50 text-purple-700"
                                : "border-blue-300 bg-blue-50 text-blue-700"
                            }
                          >
                            {t.taskType}
                          </Badge>
                        </TableCell>

                        {/* Task Title & Instance */}
                        <TableCell className="p-3">
                          <span className="font-bold text-gray-900 block truncate max-w-[200px]">
                            {t.title}
                          </span>
                          {t.instanceName && t.instanceName !== "N/A" && (
                            <span className="text-[10px] text-gray-400 font-mono block">
                              Instance: {t.instanceName}
                            </span>
                          )}
                        </TableCell>

                        {/* Frequency Badge */}
                        <TableCell className="p-3">
                          <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {t.frequency || "One-time"}
                          </Badge>
                        </TableCell>

                        {/* Dates */}
                        <TableCell className="p-3 font-mono text-gray-500">
                          {formatDate(t.startDate)}
                        </TableCell>
                        <TableCell className="p-3 font-mono text-gray-500">
                          {formatDate(t.dueDate)}
                        </TableCell>
                        <TableCell className="p-3 font-mono text-gray-700 font-semibold">
                          {formatDate(t.completedAt)}
                        </TableCell>

                        {/* Delay Days Badge */}
                        <TableCell className="p-3 text-center">
                          {delayDays > 0 ? (
                            <Badge
                              variant="default"
                              className="bg-red-100 text-red-800 hover:bg-red-100 font-bold font-mono"
                            >
                              +{delayDays} Days
                            </Badge>
                          ) : (
                            <span className="text-emerald-600 font-semibold font-mono text-xs">
                              0 Days
                            </span>
                          )}
                        </TableCell>

                        {/* Time Status */}
                        <TableCell className="p-3 text-center">
                          <Badge
                            variant="default"
                            className={
                              t.timeStatus === "On Time"
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                : t.timeStatus === "Late"
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                  : t.timeStatus === "Overdue"
                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {t.timeStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="p-8 text-center text-gray-500"
                    >
                      <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      No task records found matching the specified filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Common Pagination */}
          <DataPagination
            page={page}
            limit={limit}
            total={totalCount}
            totalPages={Math.ceil(totalCount / limit) || 1}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}