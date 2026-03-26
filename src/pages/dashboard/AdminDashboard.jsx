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

  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [fullDescription, setFullDescription] = useState("");
  const [allTaskForDashboard, setAllTaskForDashboard] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const fetchTasksForDashboard = async (filterType) => {
    try {
      const res = await dispatch(
        fetchTasksWithStats({
          filterType,
          userId: currentUser._id,
          role: currentUser.role?.name,
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

  const handleRefreshTasks = () => {
    if (isAdmin) {
      dispatch(fetchTasks());
    } else {
      if (currentUser?._id) {
        dispatch(fetchMyTasks({ userId: currentUser._id }));
      }
    }
  };

  const handleViewDescription = (description) => {
    setFullDescription(description);
    setIsDescriptionDialogOpen(true);
  };

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
    const activeUsers = users.filter((u) => u.isActive).length;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      todaysTasks,
      overdueTasks,
      activeUsers,
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
  const upcomingDeadlines = [
    { task: "Prepare Weekly Report", date: "2025-10-29", priority: "high" },
    { task: "Client Follow-up Call", date: "2025-10-29", priority: "medium" },
    { task: "Submit Expense Sheet", date: "2025-10-29", priority: "low" },
    { task: "FMS-1-L1-04", date: "2025-10-29", priority: "high" },
  ];
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 border-red-300";
      case "medium":
        return "bg-yellow-100 border-yellow-300";
      case "low":
        return "bg-green-100 border-green-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };
  const getPriorityDot = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <span className="text-md">Dashboard</span>
          <ChevronRight className="w-5 h-5" />
          <span className="text-gray-900 font-medium text-md">Dashboard</span>
        </div>
        <div>
          <TimeFilterButtons
            filterType={filterType}
            setFilterType={setFilterType}
          />
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            <div className="bg-amber-500 h-1 rounded-full w-0"></div>
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
            <div className="bg-red-500 h-1 rounded-full w-2/3"></div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card className="p-4">
          <CardHeader>
            <CardTitle>FMS Engine Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">Data not available</p>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Delegated Tasks Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">Data not available</p>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center border shadow-sm bg-white p-4">
          <div className="flex items-center gap-3 ">
            <div className="p-2 rounded-md bg-blue-50">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-md font-medium text-gray-600">Ongoing FMS</p>
              <p className="text-xl font-bold text-blue-600">N/A</p>
            </div>
          </div>
        </Card>
        <Card className="flex items-center justify-center border shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-50">
              <Users2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-md font-medium text-gray-600">
                Total Active Users
              </p>
              <p className="text-xl font-bold text-green-600">
                {dynamicStats.activeUsers}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Leaderboards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Top Performers */}
        <Card className="border p-4 shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-0">
            <div className="p-1.5 bg-amber-100 rounded-md">
              <Crown className="w-4 h-4 text-amber-600" />
            </div>
            <h1 className="text-md font-bold text-gray-700">
              Top 3 Performers
            </h1>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-gray-500 text-sm">Data not available</p>
          </div>
        </Card>

        {/* Top FMS */}
        <TopFmsCard title="Top 5 FMS by On-Time %" items={topFmsItems} />

        {/* Top Managers */}
        <Card className="border p-4 shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-0">
            <div className="p-1.5 bg-purple-100 rounded-md">
              <Medal className="w-4 h-4 text-purple-600" />
            </div>
            <h1 className="text-md text-gray-700 font-bold ">
              Top 3 Managers by On-Time %
            </h1>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-gray-500 text-sm">Data not available</p>
          </div>
        </Card>
      </div>
      {/* Performance Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
        {/* Performance Chart */}
        <div className="group hover:scale-[1.02] transition-all duration-500">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl p-4 transition-all duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-md font-semibold text-gray-800">
                Your Performance
              </h2>
            </div>
            <ChartPieDonutText />
          </div>
        </div>

        {/* Upcoming Deadlines - Enhanced */}
        <Card className="flex border-0 p-4 col-span-2 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-5 h-5 text-red-600" />
              </div>
              <h1 className="text-md font-medium">Upcoming Deadlines</h1>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-gray-500 text-sm">Data not available</p>
            </div>
          </div>
        </Card>
      </div>

      {/* <Card>
                <CardHeader>
                    <CardTitle>My Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                    <TaskTable
                        allTasks={displayTasks}
                        tasksLoading={tasksLoading}
                        users={users}
                        departments={departments}
                        currentUser={currentUser}
                        holidays={holidays}
                        onRefreshTasks={handleRefreshTasks}
                        onViewDescription={handleViewDescription}
                    />
                </CardContent>
            </Card> */}

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
