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
import { Spin, message } from "antd";
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

export default function UserTaskDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query Params
  const userId = searchParams.get("userId");
  const userName = searchParams.get("userName") || "User Tasks";
  const period = searchParams.get("period") || "this_month";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const departmentId = searchParams.get("departmentId");
  const templateId = searchParams.get("templateId");
  const taskSource = searchParams.get("taskSource") || "all";
  const timingLogic = searchParams.get("timingLogic") || "all";
  const taskStatus = searchParams.get("taskStatus") || "all";

  // Data States
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [exportTasks, setExportTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  // 🚀 Fetch Specific User Tasks
  const fetchUserTasks = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const payload = {
        period,
        startDate: startDate || null,
        endDate: endDate || null,
        departmentId: departmentId !== "all" ? departmentId : null,
        templateId: templateId !== "all" ? templateId : null,
        memberIds: [userId], // Strictly filter for this single user
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
    startDate,
    endDate,
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
      "Timing Logic",
      "Time Status",
      "Start Date",
      "Due Date",
      "Completed At",
    ];

    const csvRows = [headers.join(",")];

    exportTasks.forEach((t) => {
      const row = [
        `"${t.taskId || ""}"`,
        `"${t.title || ""}"`,
        `"${t.taskType || ""}"`,
        `"${t.assignedTo?.name || userName}"`,
        `"${t.department || ""}"`,
        `"${t.startTimeSetting || ""}"`,
        `"${t.timeStatus || ""}"`,
        `"${t.startDate ? formatDate(t.startDate) : ""}"`,
        `"${t.dueDate ? formatDate(t.dueDate) : ""}"`,
        `"${t.completedAt ? formatDate(t.completedAt) : ""}"`,
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
        t.taskId?.toLowerCase().includes(q),
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
                  Viewing all assigned tasks filtered for the selected user
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

        <CardContent className="pt-4 space-y-4">
          {/* Search Toolbar */}
          <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
            <div className="flex items-center gap-2 bg-white border border-gray-300 px-3 h-[34px] rounded-md w-72">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search user tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-xs font-medium"
              />
            </div>

            <span className="text-xs font-mono text-gray-500">
              Total Assigned: <b>{totalCount}</b> tasks
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
                  <TableHead className="text-xs font-bold min-w-[220px]">
                    TASK / INSTANCE
                  </TableHead>
                  <TableHead className="text-xs font-bold min-w-[130px]">
                    TIMING LOGIC
                  </TableHead>
                  <TableHead className="text-xs font-bold min-w-[130px]">
                    START DATE
                  </TableHead>
                  <TableHead className="text-xs font-bold min-w-[130px]">
                    DUE DATE
                  </TableHead>
                  <TableHead className="text-xs font-bold text-center min-w-[110px]">
                    TIME STATUS
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-8 text-center">
                      <Spin />
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length > 0 ? (
                  filteredTasks.map((t, idx) => (
                    <TableRow key={t._id} className="hover:bg-gray-50 text-xs">
                      <TableCell className="p-3 text-gray-400 font-mono">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>

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

                      <TableCell className="p-3">
                        <span className="font-bold text-gray-900 block truncate max-w-[220px]">
                          {t.title}
                        </span>
                        {t.instanceName !== "N/A" && (
                          <span className="text-[10px] text-gray-400 font-mono block">
                            Instance: {t.instanceName}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="p-3 font-mono text-gray-600">
                        {t.startTimeSetting}
                      </TableCell>

                      <TableCell className="p-3 font-mono text-gray-500">
                        {formatDate(t.startDate)}
                      </TableCell>
                      <TableCell className="p-3 font-mono text-gray-500">
                        {formatDate(t.dueDate)}
                      </TableCell>

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
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="p-8 text-center text-gray-500"
                    >
                      <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      No task records found for this user.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

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
