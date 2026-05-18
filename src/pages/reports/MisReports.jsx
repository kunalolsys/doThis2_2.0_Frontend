import {
  Download,
  Filter,
  TrendingUp,
  Crown,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
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

  const [selectedDoer, setSelectedDoer] = useState("all");
  const [selectedManager, setSelectedManager] = useState("all");
  const [selectedSrManager, setSelectedSrManager] = useState("all");

  const [doers, setDoers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [srManagers, setSrManagers] = useState([]);

  const [dateRange, setDateRange] = useState([null, null]);
  const [interval, setInterval] = useState("yearly");

  const [taskDetails, setTaskDetails] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [summary, setSummary] = useState({});
  const [topPerformers, setTopPerformers] = useState([]);
  const [lowPerformers, setLowPerformers] = useState([]);

  const handleChange = (dates) => {
    setDateRange(dates);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/setup/users/allUsers");

        const users = response.data?.data || [];

        const doers = users.filter((u) => u.role?.name === "Member");

        const managers = users.filter((u) => u.role?.name === "Manager");

        const srManagers = users.filter(
          (u) => u.role?.name === "Sr. Manager",
        );

        setDoers(doers);
        setManagers(managers);
        setSrManagers(srManagers);
      } catch (error) {
        console.log(error);
      }
    };

    if (currentUser?._id) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleGetReport = async () => {
    try {
      const payload = {
        period: interval,
        startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
        endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
        srManagerId:
          selectedSrManager !== "all" ? selectedSrManager : undefined,
        managerId:
          selectedManager !== "all" ? selectedManager : undefined,
        memberIds:
          selectedDoer !== "all" ? [selectedDoer] : [],
      };

      const response = await api.post("/mis/report", payload);

      console.log("MIS REPORT", response.data);

      setTaskDetails(response.data.reports || []);
      setAllTasks(response.data.tasks || []);
      setSummary(response.data.summary || {});
      setTopPerformers(response.data.topPerformers || []);
      setLowPerformers(response.data.lowPerformers || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch report");
    }
  };

  useEffect(() => {
    handleGetReport();
  }, [interval]);

  const exportToCSV = (data, fileName = "MIS_Report.csv") => {
    if (!data?.length) {
      toast.error("No record found");
      return;
    }

    const formattedData = data.map((item, index) => ({
      "Sr No": index + 1,
      "User Name": item.userName,
      Role: item.role,
      Departments: item.departments?.join(", "),
      "Total Tasks": item.totalTasks,
      Completed: item.completed,
      Pending: item.pending,
      Upcoming: item.upcoming,
      Overdue: item.overdue,
      Delayed: item.delayed,
      "Completion Rate %": item.completionRate,
      "On Time Rate %": item.onTimeRate,
      "Overdue Rate %": item.overdueRate,
    }));

    const headers = Object.keys(formattedData[0]);

    const csvRows = [
      headers.join(","),
      ...formattedData.map((row) =>
        headers.map((field) => `"${row[field] ?? ""}"`).join(","),
      ),
    ];

    const csvString = csvRows.join("\n");

    const blob = new Blob([csvString], {
      type: "text/csv;charset=utf-8;",
    });

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
      {/* FILTER SECTION */}

      <div className="bg-white border rounded-xl p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>

            <div>
              <h1 className="text-lg font-semibold">MIS Reports</h1>
              <p className="text-xs text-gray-500">
                Team performance analytics
              </p>
            </div>
          </div>

          <Button onClick={() => exportToCSV(taskDetails)}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {/* Interval */}

          <div className="min-w-[160px]">
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

          {/* Date */}

          <div className="min-w-[250px]">
            <label className="text-xs text-gray-500">Date Range</label>

            <RangePicker
              value={dateRange}
              onChange={handleChange}
              className="w-full h-9"
            />
          </div>

          {/* SR MANAGER */}

          <div className="min-w-[180px]">
            <label className="text-xs text-gray-500">Sr Manager</label>

            <Select
              value={selectedSrManager}
              onValueChange={setSelectedSrManager}
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

          {/* MANAGER */}

          <div className="min-w-[180px]">
            <label className="text-xs text-gray-500">Manager</label>

            <Select
              value={selectedManager}
              onValueChange={setSelectedManager}
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

          {/* MEMBER */}

          <div className="min-w-[180px]">
            <label className="text-xs text-gray-500">Member</label>

            <Select value={selectedDoer} onValueChange={setSelectedDoer}>
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

          <Button
            onClick={handleGetReport}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Get Report
          </Button>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {[
          {
            label: "Total",
            value: summary.totalTasks || 0,
            bg: "bg-blue-100",
            text: "text-blue-700",
          },
          {
            label: "Completed",
            value: summary.completed || 0,
            bg: "bg-green-100",
            text: "text-green-700",
          },
          {
            label: "Pending",
            value: summary.pending || 0,
            bg: "bg-yellow-100",
            text: "text-yellow-700",
          },
          {
            label: "Upcoming",
            value: summary.upcoming || 0,
            bg: "bg-indigo-100",
            text: "text-indigo-700",
          },
          {
            label: "Overdue",
            value: summary.overdue || 0,
            bg: "bg-red-100",
            text: "text-red-700",
          },
          {
            label: "Delayed",
            value: summary.delayed || 0,
            bg: "bg-orange-100",
            text: "text-orange-700",
          },
          {
            label: "On Time",
            value: summary.doneOnTime || 0,
            bg: "bg-emerald-100",
            text: "text-emerald-700",
          },
        ].map((item, index) => (
          <Card key={index} className="p-4 shadow-sm border">
            <div
              className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3`}
            >
              <Sparkles className={`w-5 h-5 ${item.text}`} />
            </div>

            <p className="text-sm text-gray-500">{item.label}</p>

            <h2 className={`text-2xl font-bold mt-1 ${item.text}`}>
              {item.value}
            </h2>
          </Card>
        ))}
      </div>

      {/* CHART + TOP */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* TOP PERFORMERS */}

        <Card className="p-5 shadow-sm border">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Crown className="w-5 h-5 text-yellow-700" />
            </div>

            <h2 className="font-semibold text-lg">Top Performers</h2>
          </div>

          <div className="space-y-4">
            {topPerformers?.length > 0 ? (
              topPerformers.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div>
                    <h3 className="font-semibold">{item.userName}</h3>

                    <p className="text-xs text-gray-500">{item.role}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-green-600 font-bold">
                      {item.completionRate}%
                    </p>

                    <p className="text-xs text-gray-500">Completion Rate</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">
                No top performers found
              </div>
            )}
          </div>
        </Card>

        {/* LOW PERFORMERS */}

        <Card className="p-5 shadow-sm border">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-700" />
            </div>

            <h2 className="font-semibold text-lg">Low Performers</h2>
          </div>

          <div className="space-y-4">
            {lowPerformers?.length > 0 ? (
              lowPerformers.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div>
                    <h3 className="font-semibold">{item.userName}</h3>

                    <p className="text-xs text-gray-500">{item.role}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-red-600 font-bold">
                      {item.overdueRate}%
                    </p>

                    <p className="text-xs text-gray-500">Overdue Rate</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">
                No low performers found
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* CHART */}

      <Card className="p-5 shadow-sm border mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-indigo-700" />
          </div>

          <h2 className="font-semibold text-lg">Performance Overview</h2>
        </div>

        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taskDetails}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="userName"
                tick={{ fontSize: 12 }}
                interval={0}
              />

              <YAxis />

              <Tooltip />

              <Bar dataKey="completionRate" radius={[8, 8, 0, 0]}>
                {taskDetails.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.completionRate >= 70
                        ? "#22c55e"
                        : entry.completionRate >= 40
                          ? "#eab308"
                          : "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* USER TABLE */}

      <Card className="shadow-sm border overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">User Performance Report</h2>
        </div>

        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Sr.</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Upcoming</TableHead>
              <TableHead>Overdue</TableHead>
              <TableHead>Delayed</TableHead>
              <TableHead>Completion %</TableHead>
              <TableHead>On Time %</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {taskDetails?.length > 0 ? (
              taskDetails.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium">{item.userName}</p>

                      <p className="text-xs text-gray-500">{item.email}</p>
                    </div>
                  </TableCell>

                  <TableCell>{item.role}</TableCell>

                  <TableCell>
                    {item.departments?.join(", ")}
                  </TableCell>

                  <TableCell>{item.totalTasks}</TableCell>

                  <TableCell>{item.completed}</TableCell>

                  <TableCell>{item.pending}</TableCell>

                  <TableCell>{item.upcoming}</TableCell>

                  <TableCell>
                    <span className="text-red-600 font-medium">
                      {item.overdue}
                    </span>
                  </TableCell>

                  <TableCell>{item.delayed}</TableCell>

                  <TableCell>
                    <span className="text-green-600 font-semibold">
                      {item.completionRate}%
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-blue-600 font-semibold">
                      {item.onTimeRate}%
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={20}
                  className="text-center py-10 text-gray-500"
                >
                  No record found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default MisReports;