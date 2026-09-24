import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileBarChart2,
  RefreshCw,
  Search,
  Download,
  Eye,
  Calendar,
  PieChart as PieIcon,
  BarChart3,
  Award,
  Layers,
} from "lucide-react";
import api from "../../lib/api";
import { Select as AntdSelect, DatePicker, Spin, message } from "antd";
import dayjs from "dayjs";

// Recharts for Visual Analytics
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

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

const { RangePicker } = DatePicker;

/* ─── Color Palette for Recharts ─── */
const CHART_COLORS = {
  completed: "#10B981", // Emerald
  pending: "#F59E0B", // Amber
  overdue: "#EF4444", // Red
  fms: "#8B5CF6", // Purple
  regular: "#3B82F6", // Blue
};

export default function UnifiedReport() {
  const navigate = useNavigate();

  // Active Filters State
  const [period, setPeriod] = useState("this_month");
  const [customDates, setCustomDates] = useState([null, null]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState(["all"]);
  const [taskSource, setTaskSource] = useState("all");
  const [timingLogic, setTimingLogic] = useState("all");
  const [taskStatus, setTaskStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Options Dropdowns
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  // Data States
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // 🚀 Fetch Filter Options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [deptRes, tplRes, userRes] = await Promise.allSettled([
        api.get("/setup/departments/allDepartments"),
        api.post("/fms/templates-list-drop", { includeLinked: true }),
        api.get("/users/list-drop"),
      ]);

      if (deptRes.status === "fulfilled") {
        setDepartments(deptRes.value.data?.data || deptRes.value.data || []);
      }
      if (tplRes.status === "fulfilled") {
        setTemplates(tplRes.value.data?.data || tplRes.value.data || []);
      }
      if (userRes.status === "fulfilled") {
        setUserOptions(userRes.value.data?.data || userRes.value.data || []);
      }
    } catch (err) {
      console.error("Failed to load options:", err);
    }
  }, []);

  // 🚀 Fetch Combined Report Data
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);

      const payload = {
        period,
        startDate: customDates[0] ? customDates[0].format("YYYY-MM-DD") : null,
        endDate: customDates[1] ? customDates[1].format("YYYY-MM-DD") : null,
        departmentId: selectedDepartment !== "all" ? selectedDepartment : null,
        templateId: selectedTemplate !== "all" ? selectedTemplate : null,
        memberIds: selectedUsers.includes("all") ? [] : selectedUsers,
        taskSource,
        timingLogic,
        taskStatus,
        page: 1,
        limit: 10000,
      };

      const res = await api.post("/mis/combined-report", payload);
      setReportData(res.data);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      message.error("Failed to load combined metrics.");
    } finally {
      setLoading(false);
    }
  }, [
    period,
    customDates,
    selectedDepartment,
    selectedTemplate,
    selectedUsers,
    taskSource,
    timingLogic,
    taskStatus,
  ]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summary = reportData?.summary || {
    totalTasks: 0,
    completed: 0,
    onTime: 0,
    late: 0,
    overdue: 0,
    notDone: 0,
    actualToPlannedCount: 0,
    plannedToPlannedCount: 0,
  };

  const userSummary = reportData?.userSummary || [];

  // Chart Data Preparation
  const statusPieData = useMemo(
    () => [
      { name: "On Time", value: summary.onTime, color: CHART_COLORS.completed },
      { name: "Late", value: summary.late, color: CHART_COLORS.pending },
      { name: "Overdue", value: summary.overdue, color: CHART_COLORS.overdue },
    ],
    [summary],
  );

  const taskTypeData = useMemo(
    () => [
      {
        name: "FMS Tasks",
        value: summary.actualToPlannedCount + summary.plannedToPlannedCount,
        color: CHART_COLORS.fms,
      },
      {
        name: "Regular Tasks",
        value: Math.max(
          0,
          summary.totalTasks -
            (summary.actualToPlannedCount + summary.plannedToPlannedCount),
        ),
        color: CHART_COLORS.regular,
      },
    ],
    [summary],
  );

  const topUserLeaderboard = useMemo(() => {
    return [...userSummary]
      .map((u) => ({
        userName: u.userName,
        rate:
          u.completionRate !== undefined
            ? u.completionRate
            : u.total > 0
              ? Math.round((u.completed / u.total) * 100)
              : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }, [userSummary]);

  // Client-side search for User Matrix
  const filteredUserSummary = userSummary.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      u.userName?.toLowerCase().includes(q) ||
      u.employeeCode?.toLowerCase().includes(q)
    );
  });

  // 🚀 CSV Export for Summary Matrix
  const handleExportSummaryCSV = () => {
    if (!userSummary.length) {
      message.warning("No user matrix records to export.");
      return;
    }

    const headers = [
      "Member Name",
      "Employee Code",
      "Total Tasks",
      "Completed Tasks",
      "Completion %",
      "On Time",
      "On Time %",
      "Late",
      "Overdue",
      "Not Done",
      "Not Done %",
    ];

    const csvRows = [headers.join(",")];

    userSummary.forEach((u) => {
      const compRate =
        u.completionRate ??
        (u.total > 0 ? Math.round((u.completed / u.total) * 100) : 0);
      const onTimeRate =
        u.onTimeRate ??
        (u.completed > 0 ? Math.round((u.onTime / u.completed) * 100) : 0);
      const notDoneRate =
        u.notDoneRate ??
        (u.total > 0 ? Math.round((u.notDone / u.total) * 100) : 0);

      const row = [
        `"${u.userName || ""}"`,
        `"${u.employeeCode || ""}"`,
        u.total,
        u.completed,
        `"${compRate}%"`,
        u.onTime,
        `"${onTimeRate}%"`,
        u.late,
        u.overdue,
        u.notDone,
        `"${notDoneRate}%"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `User_Performance_Summary_${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // 🚀 Navigate to Dedicated User Task Details Page
  const handleViewUserTasks = (user) => {
    const queryParams = new URLSearchParams({
      userId: user.userId,
      userName: user.userName,
      period,
      startDate: customDates[0] ? customDates[0].format("YYYY-MM-DD") : "",
      endDate: customDates[1] ? customDates[1].format("YYYY-MM-DD") : "",
      departmentId: selectedDepartment,
      templateId: selectedTemplate,
      taskSource,
      timingLogic,
      taskStatus,
    }).toString();

    navigate(`/reports/user-tasks?${queryParams}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 space-y-4">
      <Card className="border-0 shadow-md bg-white">
        {/* Header Bar */}
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                <FileBarChart2 className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  User Performance Summary & Analytics
                </CardTitle>
                <p className="text-xs text-gray-500 font-medium">
                  Executive User Overview & Visual Metrics Across Workflows &
                  Delegated Tasks
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportSummaryCSV}
                className="flex items-center gap-2 text-sm h-[38px] bg-green-50 text-green-700 border-green-200 hover:bg-green-100 font-semibold"
              >
                <Download size={15} />
                Export Matrix CSV
              </Button>
              <Button
                variant="outline"
                onClick={fetchReport}
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

        <CardContent className="pt-4 space-y-5">
          {/* Controls & Reactive Filters Toolbar */}
          <div className="flex flex-wrap items-end justify-between gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
            <div className="flex flex-wrap items-end gap-3 flex-1">
              <div className="w-36">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Time Period
                </span>
                <AntdSelect
                  size="middle"
                  value={period}
                  onChange={(v) => setPeriod(v)}
                  className="w-full text-xs"
                  options={[
                    { value: "today", label: "Today" },
                    { value: "this_week", label: "This Week" },
                    { value: "this_month", label: "This Month" },
                    { value: "custom", label: "Custom Range" },
                  ]}
                />
              </div>

              {period === "custom" && (
                <div className="w-60">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                    Custom Range
                  </span>
                  <RangePicker
                    size="middle"
                    className="w-full text-xs rounded-md"
                    onChange={(dates) => setCustomDates(dates || [null, null])}
                  />
                </div>
              )}

              <div className="w-48">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Users / Assignees
                </span>
                <AntdSelect
                  mode="multiple"
                  maxTagCount={1}
                  size="middle"
                  value={selectedUsers}
                  onChange={(v) => {
                    if (v.includes("all") && v.length > 1) {
                      setSelectedUsers(v.filter((x) => x !== "all"));
                    } else if (v.length === 0) {
                      setSelectedUsers(["all"]);
                    } else {
                      setSelectedUsers(v);
                    }
                  }}
                  className="w-full text-xs"
                  options={[
                    { value: "all", label: "All Users" },
                    ...userOptions.map((u) => ({
                      value: u._id,
                      label: u.name,
                    })),
                  ]}
                />
              </div>

              <div className="w-40">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Department
                </span>
                <AntdSelect
                  size="middle"
                  value={selectedDepartment}
                  onChange={(v) => setSelectedDepartment(v)}
                  className="w-full text-xs"
                  options={[
                    { value: "all", label: "All Depts" },
                    ...departments.map((d) => ({
                      value: d._id,
                      label: d.name,
                    })),
                  ]}
                />
              </div>

              <div className="w-44">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  FMS Template
                </span>
                <AntdSelect
                  size="middle"
                  value={selectedTemplate}
                  onChange={(v) => setSelectedTemplate(v)}
                  className="w-full text-xs"
                  options={[
                    { value: "all", label: "All Templates" },
                    ...templates.map((t) => ({
                      value: t._id,
                      label: t.templateName || t.fmsId,
                    })),
                  ]}
                />
              </div>

              <div className="w-36">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Task Type
                </span>
                <AntdSelect
                  size="middle"
                  value={taskSource}
                  onChange={(v) => setTaskSource(v)}
                  className="w-full text-xs"
                  options={[
                    { value: "all", label: "All Tasks" },
                    { value: "fms", label: "FMS Only" },
                    { value: "regular", label: "Regular Only" },
                  ]}
                />
              </div>

              <div className="w-40">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Timing Logic
                </span>
                <AntdSelect
                  size="middle"
                  value={timingLogic}
                  onChange={(v) => setTimingLogic(v)}
                  className="w-full text-xs"
                  options={[
                    { value: "all", label: "All Logic Types" },
                    { value: "actual-to-planned", label: "Actual-to-Planned" },
                    {
                      value: "planned-to-planned",
                      label: "Planned-to-Planned",
                    },
                  ]}
                />
              </div>

              <div className="w-100">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Search User
                </span>
                <div className="flex items-center gap-2 bg-white border border-gray-300 px-3 h-[32px] rounded-md">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none flex-1 text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Core Metrics KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase block">
                Total Tasks
              </span>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {summary.totalTasks}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                On-Time Done
              </span>
              <h3 className="text-2xl font-black text-emerald-800 mt-1">
                {summary.onTime}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="text-[10px] font-bold text-amber-600 uppercase block">
                Late Done
              </span>
              <h3 className="text-2xl font-black text-amber-800 mt-1">
                {summary.late}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-100">
              <span className="text-[10px] font-bold text-red-600 uppercase block">
                Overdue
              </span>
              <h3 className="text-2xl font-black text-red-800 mt-1">
                {summary.overdue}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-100/80 border border-gray-200">
              <span className="text-[10px] font-bold text-gray-600 uppercase block">
                Not Done
              </span>
              <h3 className="text-2xl font-black text-gray-800 mt-1">
                {summary.notDone}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase block">
                Actual-To-Planned
              </span>
              <h3 className="text-2xl font-black text-purple-900 mt-1">
                {summary.actualToPlannedCount}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-600 uppercase block">
                Planned-To-Planned
              </span>
              <h3 className="text-2xl font-black text-indigo-900 mt-1">
                {summary.plannedToPlannedCount}
              </h3>
            </div>
          </div>

          {/* Visual Charts Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: Status Distribution */}
            <Card className="border border-gray-200/80 shadow-2xs bg-white">
              <CardHeader className="p-3.5 border-b border-gray-100 flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <PieIcon size={16} className="text-blue-600" />
                  <CardTitle className="text-xs font-bold text-gray-800 uppercase">
                    Status Distribution
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 h-52 flex items-center justify-center">
                {summary.totalTasks > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend
                        verticalAlign="bottom"
                        height={30}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-xs text-gray-400">
                    No status data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 2: Task Type Volume */}
            <Card className="border border-gray-200/80 shadow-2xs bg-white">
              <CardHeader className="p-3.5 border-b border-gray-100 flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-purple-600" />
                  <CardTitle className="text-xs font-bold text-gray-800 uppercase">
                    Source Volume (FMS vs Regular)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 h-52 flex items-center justify-center">
                {summary.totalTasks > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={taskTypeData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {taskTypeData.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-xs text-gray-400">
                    No volume data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 3: Top Performer Completion Rates */}
            <Card className="border border-gray-200/80 shadow-2xs bg-white">
              <CardHeader className="p-3.5 border-b border-gray-100 flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-emerald-600" />
                  <CardTitle className="text-xs font-bold text-gray-800 uppercase">
                    Completion Rate Leaderboard
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 h-52 flex items-center justify-center">
                {topUserLeaderboard.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={topUserLeaderboard}
                      margin={{ top: 0, right: 20, left: 30, bottom: 0 }}
                    >
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fontSize: 9 }}
                      />
                      <YAxis
                        dataKey="userName"
                        type="category"
                        tick={{ fontSize: 9 }}
                        width={65}
                      />
                      <RechartsTooltip
                        formatter={(value) => [`${value}%`, "Completion Rate"]}
                      />
                      <Bar
                        dataKey="rate"
                        fill="#10B981"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-xs text-gray-400">
                    No leaderboard stats
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Performance Summary Matrix Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              User Performance Summary Matrix ({filteredUserSummary.length})
            </span>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">
                      MEMBER NAME
                    </TableHead>
                    <TableHead className="text-xs font-bold text-center">
                      TOTAL
                    </TableHead>
                    <TableHead className="text-xs font-bold text-center">
                      COMPLETED
                    </TableHead>
                    <TableHead className="text-xs font-bold text-center">
                      COMPLETION %
                    </TableHead>
                    <TableHead className="text-xs font-bold text-center">
                      ON TIME
                    </TableHead>
                    <TableHead className="text-xs font-bold text-center">
                      ON TIME %
                    </TableHead>
                    <TableHead className="text-xs font-bold text-center">
                      LATE
                    </TableHead>
                    <TableHead className="text-xs font-bold text-center">
                      OVERDUE
                    </TableHead>
                    <TableHead className="text-xs font-bold text-center">
                      NOT DONE
                    </TableHead>
                    <TableHead className="text-xs font-bold text-center">
                      NOT DONE %
                    </TableHead>
                    <TableHead className="text-xs font-bold text-center w-28">
                      ACTION
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="p-8 text-center">
                        <Spin />
                      </TableCell>
                    </TableRow>
                  ) : filteredUserSummary.length > 0 ? (
                    filteredUserSummary.map((u) => {
                      const compRate =
                        u.completionRate !== undefined
                          ? u.completionRate
                          : u.total > 0
                            ? Math.round((u.completed / u.total) * 100)
                            : 0;
                      const onTimeRate =
                        u.onTimeRate !== undefined
                          ? u.onTimeRate
                          : u.completed > 0
                            ? Math.round((u.onTime / u.completed) * 100)
                            : 0;
                      const notDoneRate =
                        u.notDoneRate !== undefined
                          ? u.notDoneRate
                          : u.total > 0
                            ? Math.round((u.notDone / u.total) * 100)
                            : 0;

                      return (
                        <TableRow
                          key={u.userId}
                          className="hover:bg-gray-50 text-xs"
                        >
                          <TableCell className="p-3 font-semibold text-gray-900">
                            {u.userName}{" "}
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({u.employeeCode})
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-gray-900">
                            {u.total}
                          </TableCell>
                          <TableCell className="text-center font-bold text-emerald-600">
                            {u.completed}
                          </TableCell>

                          {/* Completion Rate Column */}
                          <TableCell className="text-center p-2">
                            <Badge
                              variant="default"
                              className={
                                compRate >= 75
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-semibold"
                                  : compRate >= 40
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200 font-semibold"
                                    : "bg-red-100 text-red-800 hover:bg-red-100 border border-red-200 font-semibold"
                              }
                            >
                              {compRate}%
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center font-bold text-emerald-700">
                            {u.onTime}
                          </TableCell>

                          {/* On Time Rate Column */}
                          <TableCell className="text-center font-mono font-semibold text-emerald-700">
                            {onTimeRate}%
                          </TableCell>

                          <TableCell className="text-center font-bold text-amber-600">
                            {u.late}
                          </TableCell>
                          <TableCell className="text-center font-bold text-red-600">
                            {u.overdue}
                          </TableCell>
                          <TableCell className="text-center font-bold text-gray-600">
                            {u.notDone}
                          </TableCell>

                          {/* Not Done Rate Column */}
                          <TableCell className="text-center font-mono font-bold text-gray-700">
                            <Badge
                              variant="outline"
                              className="bg-slate-100 text-slate-800 border-slate-200 font-semibold"
                            >
                              {notDoneRate}%
                            </Badge>
                          </TableCell>

                          {/* Action Button to Open Dedicated User Tasks View */}
                          <TableCell className="text-center p-2">
                            <Button
                              size="sm"
                              onClick={() => handleViewUserTasks(u)}
                              className="h-8 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-2.5 rounded-md flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              <Eye size={13} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="p-8 text-center text-gray-500"
                      >
                        No user performance summary found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
