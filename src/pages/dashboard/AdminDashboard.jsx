import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  UserCheck,
  Star,
  ChevronRight,
  ClipboardList,
  TriangleAlert,
  CircleArrowUp,
  CalendarCheck2,
  Settings,
  Users2,
  Zap,
  Rocket,
  Target,
  Crown,
  Medal,
  Bell,
  Award,
  Calendar,
  RefreshCcw,
} from "lucide-react";
import Cookies from "js-cookie";

import StatCard from "../../components/dashboard/StatCard";
import PerformanceCard from "../../components/dashboard/PerformanceCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import TopFmsCard from "../../components/dashboard/TopFmsCard";
import TimeFilterButtons from "../../components/dashboard/TimeFilterButtons ";
import StatCard2t from "../../components/dashboard/StatCard2t";
import { ChartPieDonutText } from "../../components/dashboard/ChartPieDonutText";
import TaskTable from "../../components/TaskTable";
import {
  fetchTasks,
  fetchTasksWithStats,
} from "../../redux/slices/task/taskSlice";
import { fetchUsers } from "../../redux/slices/user/userSlice";
import { fetchDepartments } from "../../redux/slices/department/departmentSlice";
import { fetchHolidays } from "../../redux/slices/holiday/holidaySlice";
import { fetchMyTasks } from "../../redux/slices/myTask/myTaskSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import dayjs from "dayjs";
import axios from "axios";
import api from "../../lib/api";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { tasks, loading: tasksLoading } = useSelector((state) => state.tasks);
  const { users } = useSelector((state) => state.users);
  const { departments } = useSelector((state) => state.departments);
  const { holidays } = useSelector((state) => state.holidays);
  const { tasks: myTasks } = useSelector((state) => state.myTasks);
  const { currentUser } = useSelector((state) => state.users);
  const isAdmin =
    currentUser?.role?.name === "Admin" || currentUser?.role?.name === "Owner";
  // const displayTasks = isAdmin ? tasks : myTasks;
  const [userCount, setUserCount] = useState(0);
  const [fmsCounts, setFmsCounts] = useState({
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    onhold: 0,
    stopped: 0,
    total: 0,
  });
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [fullDescription, setFullDescription] = useState("");
  const [allTaskForDashboard, setAllTaskForDashboard] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const fetchTasksForDashboard = async (filterType) => {
    try {
      const res = await dispatch(
        fetchTasksWithStats({
          filterType,
          userId: currentUser?._id,
          role: currentUser?.role?.name,
        }),
      ).unwrap();
      setAllTaskForDashboard(res);
    } catch (error) {
      console.log(error);
    }
  };
  // useEffect(() => {
  //   dispatch(fetchUsers());
  //   dispatch(fetchDepartments());
  //   dispatch(fetchHolidays());
  //   if (isAdmin) {
  //     // dispatch(fetchTasks());
  //   }
  //   if (currentUser?._id) {
  //     dispatch(fetchMyTasks({ userId: currentUser._id }));
  //   }
  // }, [dispatch, currentUser, isAdmin]);
  useEffect(() => {
    fetchTasksForDashboard(filterType);
  }, [filterType, currentUser]);

  const dynamicStats = useMemo(() => {
    const counts = allTaskForDashboard?.counts || {};
    const tasks = allTaskForDashboard?.data || [];
    const totalTasks = allTaskForDashboard?.total || 0;
    const completedTasks = counts.Completed || 0;
    const pendingTasks = counts.Pending || 0;
    const overdueTasks = counts.Overdue || 0;
    const todaysTasks = tasks.filter((t) => {
      const today = new Date();
      const taskDate = new Date(t.startDate);
      return (
        taskDate.getDate() === today.getDate() &&
        taskDate.getMonth() === today.getMonth() &&
        taskDate.getFullYear() === today.getFullYear()
      );
    }).length;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      todaysTasks,
      overdueTasks,
    };
  }, [allTaskForDashboard, users]);

  const topFmsItems = [
    { name: "Social Media FMS", performance: 98.2 },
    { name: "Email Marketing FMS", performance: 95.7 },
    { name: "Content Creation FMS", performance: 94.3 },
    { name: "SEO Optimization FMS", performance: 92.1 },
    { name: "Analytics FMS", performance: 90.5 },
  ].map((item) => ({
    name: item.name,
    percentage: item.performance,
  }));

  const upcomingTasks = useMemo(() => {
    if (!allTaskForDashboard?.data) return [];

    const now = dayjs();
    const next3Days = dayjs().add(3, "day");

    return allTaskForDashboard.data.filter((task) => {
      if (!task.dueDate) return false;

      const due = dayjs(task.dueDate);

      return (
        due.isAfter(now) && // future only
        due.isBefore(next3Days) && // within 3 days
        task.status !== "Completed" // ignore completed
      );
    });
  }, [allTaskForDashboard]);
  const sortedUpcoming = useMemo(() => {
    return [...upcomingTasks].sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
    );
  }, [upcomingTasks]);
  const [topPerformers, setTopPerformers] = useState([]);
  const handleGetReport = async () => {
    try {
      const payload = {
        period: "yearly",
      };

      const response = await api.post(`/mis/report`, payload);
      // const users = response.data?.data || [];
      setTopPerformers(response.data.topPerformers);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    handleGetReport();
    fetchActiveUserCount();
    fetchInstanceCount();
  }, []);
  const fetchActiveUserCount = async () => {
    const response = await api.get(`/setup/users/user-count`);
    setUserCount(response.data.totalUser);
  };
  const fetchInstanceCount = async () => {
    const response = await api.get(`/fms/instances-count`);
    const data = response.data.data;
    setFmsCounts({
      upcoming: data.upcoming,
      ongoing: data.ongoing,
      completed: data.completed,
      onhold: data.onhold,
      stopped: data.stopped,
      total: data.total,
    });
  };
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
  const role = Cookies.get("role") || "";
  const isSuper = role === "Super";
  const isModuleEnabled = (moduleKey) => {
    // ✅ Super user can access all modules
    if (isSuper) return true;

    return modules.some((m) => m.moduleKey === moduleKey && m.isEnabled);
  };
  const fmsOn = isModuleEnabled("FMS_ENGINE");
  const zone2Items = [
    fmsOn ? "fms-perf" : null,
    "delegated-perf",
    fmsOn ? "ongoing-fms" : null,
    "active-users",
  ].filter(Boolean);

  // ── Zone 3: leaderboard items (Top FMS conditional) ─────────────────────
  const zone3Items = [
    "top-performers",
    fmsOn ? "top-fms" : null,
    "top-managers",
  ].filter(Boolean);
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <span className="text-md">Dashboard</span>
          <ChevronRight className="w-5 h-5" />
          <span className="text-gray-900 font-medium text-md">Dashboard</span>
        </div>
        <TimeFilterButtons
          filterType={filterType}
          setFilterType={setFilterType}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 1 — Alerts (2 cols) + Stats (4 cols)
          Always visible. Never changes shape.
      ══════════════════════════════════════════════════════════════════ */}

      {/* Alert row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg p-4 bg-amber-50 border border-amber-200">
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-amber-100 rounded-md">
              <Zap className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-md text-gray-600 font-medium">
                Active Escalations
              </p>
              <p className="text-xl font-bold text-amber-600">N/A</p>
            </div>
          </div>
          <div className="mt-1 w-full bg-amber-200 rounded-full h-1">
            <div className="bg-amber-500 h-1 rounded-full w-0" />
          </div>
        </div>

        <div className="rounded-lg p-4 bg-red-50 border border-red-200">
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-red-100 rounded-md">
              <TriangleAlert className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-md text-gray-600 font-medium">
                Total Overdue Tasks
              </p>
              <p className="text-xl font-bold text-red-600">
                {dynamicStats.overdueTasks}
              </p>
            </div>
          </div>
          <div className="mt-1 w-full bg-red-200 rounded-full h-1">
            <div className="bg-red-500 h-1 rounded-full w-2/3" />
          </div>
        </div>
      </div>

      {/* Stats row — always 4 cols on large screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Tasks"
          value={dynamicStats.totalTasks}
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          title="Completed Tasks"
          value={dynamicStats.completedTasks}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending Tasks"
          value={dynamicStats.pendingTasks}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Today's Tasks"
          value={dynamicStats.todaysTasks}
          icon={CalendarCheck2}
          color="purple"
        />
        {fmsOn && (
          <StatCard
            title="Ongoing FMS"
            value={fmsCounts.ongoing}
            icon={Settings}
            color="yellow"
          />
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 2 — Metric cards
          Derives column count from visible items so grid never has gaps.
          FMS on  → 4 cols: [FMS Perf] [Delegated Perf] [Ongoing FMS] [Active Users]
          FMS off → 2 cols: [Delegated Perf] [Active Users]
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${zone2Items.length}, minmax(0, 1fr))`,
        }}
      >
        {/* FMS Engine Performance — only when FMS on */}
        {/* {fmsOn && (
          <Card className="p-4 hover:scale-[1.02] transition-all duration-500">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                FMS Engine Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-gray-500 text-sm">Data not available</p>
            </CardContent>
          </Card>
        )} */}

        {/* Delegated Tasks Performance — always visible */}
        {/* <Card className="p-4 hover:scale-[1.02] transition-all duration-500">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Delegated Tasks Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-gray-500 text-sm">Data not available</p>
          </CardContent>
        </Card> */}

        {/* Active Users — always visible */}
        {/* <Card className="flex items-center justify-center border shadow-sm bg-white p-4 hover:scale-[1.02] transition-all duration-500">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-50">
              <Users2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-md font-medium text-gray-600">
                Total Active Users
              </p>
              <p className="text-xl font-bold text-green-600">{userCount}</p>
            </div>
          </div>
        </Card> */}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 3 — Leaderboards
          Derives column count from visible items so grid never has gaps.
          FMS on  → 3 cols: [Top Performers] [Top FMS] [Top Managers]
          FMS off → 2 cols: [Top Performers] [Top Managers]
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="grid gap-4 mb-4"
        style={{
          gridTemplateColumns: `repeat(${zone3Items.length}, minmax(0, 1fr))`,
        }}
      >
        {/* Top Performers — always visible */}
        {/* <Card className="border p-4 shadow-sm bg-white hover:scale-[1.02] transition-all duration-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                Top Performers — This Year
              </h3>
            </div>
          </div>
          <div className="space-y-3">
            {Array.isArray(topPerformers) && topPerformers.length > 0 ? (
              topPerformers.map((item, id) => {
                const rankStyles = [
                  {
                    bg: "bg-yellow-50",
                    border: "border-yellow-300",
                    badge: "bg-yellow-500",
                  },
                  {
                    bg: "bg-gray-50",
                    border: "border-gray-300",
                    badge: "bg-gray-500",
                  },
                  {
                    bg: "bg-orange-50",
                    border: "border-orange-300",
                    badge: "bg-orange-500",
                  },
                ];
                const style = rankStyles[id] || {
                  bg: "bg-blue-50",
                  border: "border-blue-200",
                  badge: "bg-blue-500",
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
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-sm text-green-600">
                          {item.score}%
                        </span>
                        <span className="text-xs text-gray-500">
                          Done on Time
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-sm text-red-600">
                          {item.lateScore}%
                        </span>
                        <span className="text-xs text-gray-500">Late</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm">No data available</p>
            )}
          </div>
        </Card> */}

        {/* Top FMS — only when FMS on */}
        {/* {fmsOn && (
          <Card className="border p-4 shadow-sm bg-white hover:scale-[1.02] transition-all duration-500">
            <TopFmsCard title="Top 5 FMS by On-Time %" items={topFmsItems} />
          </Card>
        )} */}

        {/* Top Managers — always visible */}
        {/* <Card className="border p-4 shadow-sm bg-white hover:scale-[1.02] transition-all duration-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-100 rounded-md">
              <Medal className="w-4 h-4 text-purple-600" />
            </div>
            <h1 className="text-md text-gray-700 font-bold">
              Top 3 Managers by On-Time %
            </h1>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-gray-500 text-sm">Data not available</p>
          </div>
        </Card> */}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 4 — Performance overview
          Fixed layout: 1/3 chart + 2/3 deadlines. No FMS dependency.
          Uses fr units so it never collapses.
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="grid gap-4 mb-6"
        style={{ gridTemplateColumns: "1fr 2fr" }}
      >
        {/* Performance donut chart */}
        <div className="group hover:scale-[1.02] transition-all duration-500">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl p-4 transition-all duration-500 h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-md font-semibold text-gray-800">
                Your Performance
              </h2>
            </div>
            <ChartPieDonutText record={allTaskForDashboard} />
          </div>
        </div>

        {/* Upcoming deadlines — always 2-col inner grid */}
        <Card className="border-0 p-4 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-5 h-5 text-red-600" />
              </div>
              <h1 className="text-md font-medium">Upcoming Deadlines</h1>
            </div>
            {sortedUpcoming.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming deadlines</p>
            ) : (
              <div
                className={`grid gap-2 ${
                  sortedUpcoming.length === 1
                    ? "grid-cols-1"
                    : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {" "}
                {sortedUpcoming.map((task) => {
                  const daysLeft = dayjs(task.dueDate).diff(dayjs(), "day");
                  return (
                    <div
                      key={task._id}
                      className="flex justify-between items-center p-2 rounded-md border bg-red-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {task.assignedTo?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">
                          {dayjs(task.dueDate).format("DD MMM")}
                        </p>
                        <p className="text-xs font-semibold text-red-600">
                          {daysLeft <= 0 ? "Today" : `${daysLeft}d left`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Description dialog — unchanged ─────────────────────────────── */}
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
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
