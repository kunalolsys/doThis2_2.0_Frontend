import { ChevronRight, Download, Calendar, Filter, User, ClipboardList, Zap, TrendingUp, Award, BarChart3, Crown, Sparkles } from "lucide-react";
import { useState } from "react";
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
} from "../../components/ui/table"

const MisReports = () => {
  const [activeTab, setActiveTab] = useState("delegated");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        {/* Breadcrumb */}
      
        

        {/* Filter Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h1 className="text-gray-900 mb-6 text-blue-600 text-2xl font-medium">MIS Reports</h1>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 items-end">
            {/* Interval Select */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Time Interval
              </label>
              <div className="relative">
                <select
                  name="interval"
                  className="w-full bg-white border border-gray-300 text-gray-900 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none text-sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <Calendar28 />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <Calendar28 />
            </div>

            {/* Role Filters */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Sr. Manager
              </label>
              <div className="relative">
                <select
                  name="sr_manager"
                  className="w-full bg-white border border-gray-300 text-gray-900 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none text-sm"
                >
                  <option value="all">All Senior Managers</option>
                  <option value="manager1">John Doe</option>
                  <option value="manager2">Jane Smith</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Manager</label>
              <div className="relative">
                <select
                  name="manager"
                  className="w-full bg-white border border-gray-300 text-gray-900 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none text-sm"
                >
                  <option value="all">All Managers</option>
                  <option value="manager1">Team Lead 1</option>
                  <option value="manager2">Team Lead 2</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Doer</label>
              <div className="relative">
                <select
                  name="doer"
                  className="w-full bg-white border border-gray-300 text-gray-900 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none text-sm"
                >
                  <option value="all">All Doers</option>
                  <option value="doer1">Employee 1</option>
                  <option value="doer2">Employee 2</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Export to CSV
              </button>
            </div>
          </form>
        </div>

        {/* Reports Tabs */}
        <div className="mb-6">
          <div className="flex space-x-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("delegated")}
              className={`pb-3 px-1 font-medium border-b-2 transition-all duration-300 ${activeTab === "delegated"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${activeTab === "delegated" ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <ClipboardList className="w-4 h-4" />
                </div>
                Delegated Tasks Report
              </div>
            </button>
            <button
              onClick={() => setActiveTab("fms")}
              className={`pb-3 px-1 font-medium border-b-2 transition-all duration-300 ${activeTab === "fms"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${activeTab === "fms" ? 'bg-blue-100' : 'bg-gray-100'}`}>
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
                <h3 className="text-base font-semibold text-gray-900">Top Performers</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    1
                  </div>
                  <span className="font-medium text-gray-700 text-sm">This Week</span>
                </div>
                <span className="text-green-600 font-semibold text-sm">Jane Doe</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    2
                  </div>
                  <span className="font-medium text-gray-700 text-sm">This Month</span>
                </div>
                <span className="text-green-600 font-semibold text-sm">John Smith</span>
              </div>
              <div className="flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    3
                  </div>
                  <span className="font-medium text-gray-700 text-sm">This Quarter</span>
                </div>
                <span className="text-green-600 font-semibold text-sm">Baldev Singh</span>
              </div>
            </div>
          </Card>

          {/* Chart */}
          <Card className="p-4 border shadow-sm bg-white">
            <div className="flex items-center gap-2 mb-0">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Performance Overview</h3>
            </div>
            <ChartBarLabel />
          </Card>
        </div>

        {/* Charts and Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Line Chart */}
          <Card className="p-4 border shadow-sm bg-white lg:col-span-2">
            <div className="flex items-center gap-2 mb-0">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Task Trends</h3>
            </div>
            <ChartLineLinear />
          </Card>

          {/* Total Tasks Card */}
          <Card className="p-4 border shadow-sm bg-white">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-700">Total Tasks Delegated</h3>
                </div>
                <select className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Quarter</option>
                </select>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="text-4xl font-bold text-blue-600 mb-4">152</div>
                <ClipboardList size={48} className="text-gray-200" />
              </div>
            </div>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="border shadow-sm bg-white">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
                <h3 className="text-base font-semibold text-gray-900">Task Details</h3>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table className="text-sm">
                <TableHeader className="bg-gray-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold p-3">USER NAME</TableHead>
                    <TableHead className="font-semibold p-3">ROLE</TableHead>
                    <TableHead className="font-semibold p-3">TOTAL TASKS</TableHead>
                    <TableHead className="font-semibold p-3">DONE ON TIME</TableHead>
                    <TableHead className="font-semibold p-3">NOT DONE ON TIME</TableHead>
                    <TableHead className="font-semibold p-3">NOT DONE</TableHead>
                    <TableHead className="font-semibold p-3 text-right">SCORE (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Atul Mohan", role: "Sr. Manager", total: 50, done: 44, notDoneTime: 6, notDone: 0, score: 88.0, color: "yellow" },
                    { name: "Baldev Singh", role: "Manager", total: 30, done: 28, notDoneTime: 2, notDone: 0, score: 93.3, color: "yellow" },
                    { name: "Priya Sharma", role: "Manager", total: 20, done: 16, notDoneTime: 4, notDone: 0, score: 80.0, color: "red" },
                    { name: "Jane Doe", role: "Member", total: 18, done: 18, notDoneTime: 0, notDone: 0, score: 100.0, color: "green" },
                    { name: "John Smith", role: "Member", total: 12, done: 10, notDoneTime: 2, notDone: 0, score: 83.3, color: "red" },
                    { name: "Amit Kumar", role: "Member", total: 10, done: 7, notDoneTime: 3, notDone: 0, score: 70.0, color: "red" }
                  ].map((user, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium p-3">{user.name}</TableCell>
                      <TableCell className="p-3">{user.role}</TableCell>
                      <TableCell className="p-3">{user.total}</TableCell>
                      <TableCell className="p-3">{user.done}</TableCell>
                      <TableCell className="p-3">{user.notDoneTime}</TableCell>
                      <TableCell className="p-3">{user.notDone}</TableCell>
                      <TableCell className="p-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                          user.color === 'green' ? 'bg-green-100 text-green-800' :
                          user.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.score}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MisReports;