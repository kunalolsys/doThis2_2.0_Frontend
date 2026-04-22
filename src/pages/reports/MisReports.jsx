import {
  ChevronRight,
  Download,
  Calendar,
  Filter,
  User,
  ClipboardList,
  Zap,
  TrendingUp,
  Award,
  BarChart3,
  Crown,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Calendar28 } from "../../components/ui/DatePicker";
import { Card } from "../../components/ui/card";
import { ChartBarLabel } from "../../components/dashboard/ChartBarLabel";
import { ChartLineLinear } from "../../components/dashboard/ChartLineLinear";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useSelector } from "react-redux";
import api from "../../lib/api";
import { DatePicker, Tooltip } from "antd";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
const { RangePicker } = DatePicker;

const MisReports = () => {
  const { currentUser } = useSelector((state) => state.users);
  const [activeTab, setActiveTab] = useState("delegated");
  const [selectedDoer, setSelectedDoer] = useState("all");
  const [selectedManager, setSelectedManager] = useState("all");
  const [selectedSrManager, setSelectedSrManager] = useState("all");
  const [doers, setDoers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [srManagers, setSrManagers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [interval, setInterval] = useState("yearly"); // default
  const [taskDetails, setTaskDetails] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const handleChange = (dates) => {
    setDateRange(dates);
  };
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
      }
    };

    if (currentUser?._id) {
      fetchUsers();
    }
  }, [currentUser]);
  const handleFilterChange = (setter, value) => {
    setter(value);
    // // Logic to reset other filters so only one user filter is active at a time
    // if (setter !== setSelectedDoer) setSelectedDoer("all");
    // if (setter !== setSelectedManager) setSelectedManager("all");
    // if (setter !== setSelectedSrManager) setSelectedSrManager("all");
  };
  const handleGetReport = async () => {
    try {
      const payload = {
        period: interval,
        startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
        endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
        srManagerId:
          selectedSrManager !== "all" ? selectedSrManager : undefined,
        managerId: selectedManager !== "all" ? selectedManager : undefined,
        memberIds: selectedDoer !== "all" ? [selectedDoer] : undefined,
      };

      const response = await api.post(`/mis/report`, payload);
      // const users = response.data?.data || [];
      setTaskDetails(response.data.data);
      setTopPerformers(response.data.topPerformers);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (!interval) return; // ✅ wait until interval is set

    handleGetReport();
  }, [interval]);
  const exportToCSV = (data, fileName = "MIS_Report.csv") => {
    if (!data || !data.length) {
      toast.error("No record found.");
    }

    // Format data as per requirement
    const formattedData = data.map((item, index) => ({
      "Sr No": index + 1,
      "User Name": item.userName,
      "Total Tasks": item.totalTasks,
      "Done On Time": item.doneOnTime,
      "Not Done On Time": item.notDoneOnTime,
      "Not Done": item.notDone,
      "Score (%)": item.score.toFixed(3), // 3 decimal places
    }));

    // Headers
    const headers = Object.keys(formattedData[0]);

    // Convert to CSV
    const csvRows = [
      headers.join(","),
      ...formattedData.map((row) =>
        headers.map((field) => `"${row[field]}"`).join(","),
      ),
    ];

    const csvString = csvRows.join("\n");

    // Download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        {/* Breadcrumb */}

        {/* Filter Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  MIS Reports
                </h1>
                <p className="text-xs text-gray-400">
                  Filter and analyze performance
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => exportToCSV(taskDetails)}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Interval */}
            <div className="min-w-[140px]">
              <label className="text-xs text-gray-500">Interval</label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="min-w-[220px]">
              <label className="text-xs text-gray-500">Date Range</label>
              <RangePicker
                value={dateRange}
                onChange={handleChange}
                className="w-full h-9"
                format="DD MMM YYYY"
              />
            </div>

            {/* Sr Manager */}
            <div className="min-w-[160px]">
              <label className="text-xs text-gray-500">Sr Manager</label>
              <Select
                value={selectedSrManager}
                onValueChange={(val) =>
                  handleFilterChange(setSelectedSrManager, val)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {srManagers.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manager */}
            <div className="min-w-[160px]">
              <label className="text-xs text-gray-500">Manager</label>
              <Select
                value={selectedManager}
                onValueChange={(val) =>
                  handleFilterChange(setSelectedManager, val)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {managers.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doer */}
            <div className="min-w-[160px]">
              <label className="text-xs text-gray-500">Doer</label>
              <Select
                value={selectedDoer}
                onValueChange={(val) =>
                  handleFilterChange(setSelectedDoer, val)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {doers.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                onClick={handleGetReport}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Report
              </Button>
            </div>
          </div>
        </div>

        {/* Reports Tabs */}
        <div className="mb-6">
          <div className="flex space-x-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("delegated")}
              className={`pb-3 px-1 font-medium border-b-2 transition-all duration-300 ${
                activeTab === "delegated"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1 rounded ${activeTab === "delegated" ? "bg-blue-100" : "bg-gray-100"}`}
                >
                  <ClipboardList className="w-4 h-4" />
                </div>
                Delegated Tasks Report
              </div>
            </button>
            <button
              onClick={() => setActiveTab("fms")}
              className={`pb-3 px-1 font-medium border-b-2 transition-all duration-300 ${
                activeTab === "fms"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1 rounded ${activeTab === "fms" ? "bg-blue-100" : "bg-gray-100"}`}
                >
                  <BarChart3 className="w-4 h-4" />
                </div>
                FMS Tasks Report
              </div>
            </button>
          </div>
        </div>

        {/* Top Performers and Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Top Performers Card */}

          <Card className="p-4 border shadow-sm bg-white">
            <div className="flex items-center justify-between mb-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Crown className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  Top Performers
                </h3>
              </div>
            </div>
            <div className="space-y-3">
              {Array.isArray(topPerformers) &&
                topPerformers.length > 0 &&
                topPerformers.map((item, id) => {
                  const rankStyles = [
                    {
                      bg: "bg-yellow-50",
                      border: "border-yellow-300",
                      badge: "bg-yellow-500",
                      text: "text-yellow-700",
                    },
                    {
                      bg: "bg-gray-50",
                      border: "border-gray-300",
                      badge: "bg-gray-500",
                      text: "text-gray-700",
                    },
                    {
                      bg: "bg-orange-50",
                      border: "border-orange-300",
                      badge: "bg-orange-500",
                      text: "text-orange-700",
                    },
                  ];

                  const style = rankStyles[id] || {
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    badge: "bg-blue-500",
                    text: "text-blue-700",
                  };

                  return (
                    <div
                      key={id}
                      className={`flex justify-between items-center p-3 rounded-lg border ${style.bg} ${style.border}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 ${style.badge} rounded-full flex items-center justify-center text-white text-xs font-semibold`}
                        >
                          {id + 1}
                        </div>
                        <span className="font-medium text-gray-800 text-sm">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex gap-4 justify-end items-center">
                        {/* Done on Time */}
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-sm text-green-600">
                            {item.score}%
                          </span>
                          <span className="text-xs text-gray-500">
                            Done on Time
                          </span>
                        </div>

                        {/* Not Done on Time */}
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-sm text-red-600">
                            {item.lateScore}%
                          </span>
                          <span className="text-xs text-gray-500">Late</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* Chart */}
          {/* <Card className="p-4 border shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-0">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Performance Overview
              </h3>
            </div>
            <ChartBarLabel />
          </Card> */}
          <Card className="p-5 border border-gray-200 rounded-xl shadow-sm bg-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-md">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Team Performance
                </h3>
              </div>

              <span className="text-xs text-gray-400">On-Time %</span>
            </div>

            {/* Chart */}
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskDetails}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="userName"
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />

                  <YAxis domain={[0, 100]} />

                  <Tooltip />

                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {taskDetails.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.score > 80
                            ? "#22c55e" // green
                            : entry.score > 50
                              ? "#eab308" // yellow
                              : entry.score > 0
                                ? "#3b82f6" // blue
                                : "#e5e7eb" // gray (0 score)
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Card className="border shadow-sm bg-white">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Task Details
              </h3>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table className="text-sm">
                <TableHeader className="bg-gray-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold p-3">Sr. No</TableHead>{" "}
                    <TableHead className="font-semibold p-3">
                      USER NAME
                    </TableHead>
                    <TableHead className="font-semibold p-3">ROLE</TableHead>
                    <TableHead className="font-semibold p-3">
                      TOTAL TASKS
                    </TableHead>
                    <TableHead className="font-semibold p-3">
                      DONE ON TIME
                    </TableHead>
                    <TableHead className="font-semibold p-3">
                      NOT DONE ON TIME
                    </TableHead>
                    <TableHead className="font-semibold p-3">
                      NOT DONE
                    </TableHead>
                    <TableHead className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold text-gray-700">
                          SCORE
                        </span>
                        <span className="text-sm text-gray-400">
                          (Done on Time %)
                        </span>
                      </div>
                    </TableHead>
                    <TableHead className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold text-gray-700">
                          SCORE
                        </span>
                        <span className="text-sm text-gray-400">
                          (Not Done on Time %)
                        </span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(taskDetails) && taskDetails.length > 0 ? (
                    taskDetails.map((user, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium p-3">
                          {index + 1}
                        </TableCell>{" "}
                        <TableCell className="font-medium p-3">
                          {user.userName}
                        </TableCell>
                        <TableCell className="p-3">{user.role}</TableCell>
                        <TableCell className="p-3">{user.totalTasks}</TableCell>
                        <TableCell className="p-3">{user.doneOnTime}</TableCell>
                        <TableCell className="p-3">
                          {user.notDoneOnTime}
                        </TableCell>
                        <TableCell className="p-3">{user.notDone}</TableCell>
                        <TableCell className="p-3 text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-sm font-medium ${
                              user.score >= 70
                                ? "bg-green-100 text-green-800"
                                : user.score >= 40
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.score || 0}%
                          </span>
                        </TableCell>
                        <TableCell className="p-3 text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-sm font-medium ${
                              user.lateScore > 30
                                ? "bg-red-100 text-red-800"
                                : user.lateScore > 10
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.lateScore || 0}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-gray-50">
                      <TableCell className="font-medium p-3">
                        No record found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
        {/* Data Table */}
      </div>
    </div>
  );
};

export default MisReports;
