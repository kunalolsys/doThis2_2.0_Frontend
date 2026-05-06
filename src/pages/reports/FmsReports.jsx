import React, { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CalendarIcon,
  Clock,
  Filter,
  Download,
  Zap,
  Sparkles,
} from "lucide-react";

import api from "../../lib/api";

import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";

import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useDispatch, useSelector } from "react-redux";
import { getUserForDrop } from "../../redux/slices/user/userSlice.js";

const FmsReports = () => {
  const { dropdownUsers } = useSelector((state) => state.users);
  const dispatch = useDispatch();
  const [period, setPeriod] = useState("weekly");
  const [limit] = useState(10);
  const [page, setPage] = useState(1);
  const [memberIdsMode, setMemberIdsMode] = useState("all"); // 'all' | 'ids'
  const [memberIdsText, setMemberIdsText] = useState(""); // comma-separated ids

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10,
  });

  const payload = useMemo(() => {
    const memberIds = memberIdsMode === "all" ? ["all"] : [memberIdsMode];

    return {
      period,
      limit: Number(limit) || 10,
      page: Number(page) || 1,
      memberIds,
    };
  }, [period, limit, page, memberIdsMode, memberIdsText]);

  const handleGetReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/fms-report/report", payload);

      setTasks(response.data?.tasks || []);
      setTopPerformers(response.data?.topPerformers || []);

      const p = response.data?.pagination;
      if (p) {
        setPagination({
          current: p.current ?? page,
          pages: p.pages ?? 1,
          total: p.total ?? 0,
          limit: p.limit ?? limit,
        });
      }
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to fetch FMS report",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    dispatch(getUserForDrop()); // Fetch all users for the reporting manager dropdown
  }, [dispatch]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
      <div className="fixed top-0 left-0 w-72 h-72 bg-blue-200/10 rounded-full blur-3xl animate-pulse -z-10" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-1000 -z-10" />

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group">
        <CardHeader className="border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                FMS Reports
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="">
          {/* Filters */}
          <div className="p-4 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm mb-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[160px]">
                <Label className="text-xs text-gray-500">Period</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[240px]">
                <Label className="text-xs text-gray-500">Member</Label>
                <div className="flex gap-2 items-center">
                  <Select
                    value={memberIdsMode}
                    onValueChange={setMemberIdsMode}
                  >
                    <SelectTrigger className="h-9 w-[110px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {dropdownUsers.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="me-2">{user.name}</span>

                            {user.role?.name}
                          </div>{" "}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleGetReport}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                {loading ? "Loading..." : "Get Report"}
              </Button>
            </div>

            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>

          {/* Tasks table + pagination */}
          <Card className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Filter className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  FMS Tasks
                </h3>
              </div>
            </div>

            <div className="overflow-auto">
              <Table className="text-sm">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Sr. No</TableHead>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Template Status</TableHead>
                    <TableHead>Task Due Date</TableHead>
                    {/* <TableHead>Actual Complete</TableHead> */}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {Array.isArray(tasks) && tasks.length > 0 ? (
                    tasks.map((t, idx) => (
                      <TableRow key={t._id || idx} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {(pagination.current - 1) * limit + idx + 1}
                        </TableCell>
                        <TableCell>
                          {t.fmsInstanceId?.instanceName ||
                            t.fmsInstanceId?.name ||
                            "-"}
                        </TableCell>
                        <TableCell>
                          {t.fmsTaskId?.taskId || t.taskId || "-"}
                        </TableCell>
                        <TableCell>
                          {t.assignedTo?.name || t.assignedTo?.email || "-"}
                        </TableCell>

                        <TableCell>{t.fmsInstanceId?.status || "-"}</TableCell>
                        <TableCell>
                          {t.plannedDueDate
                            ? new Date(t.plannedDueDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "-"}
                        </TableCell>
                        {/* <TableCell>
                          {t.actualCompleteDate
                            ? new Date(
                                t.actualCompleteDate,
                              ).toLocaleDateString()
                            : "-"}
                        </TableCell> */}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-sm text-gray-500"
                      >
                        No record found. Click Get Report.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  setTimeout(handleGetReport, 0);
                }}
                disabled={
                  pagination.pages <= 1 || pagination.current <= 1 || loading
                }
              >
                Prev
              </Button>

              <div className="text-sm text-gray-700">
                Page <span className="font-semibold">{pagination.current}</span>{" "}
                / {pagination.pages}
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setPage((p) => Math.min(pagination.pages, p + 1));
                  setTimeout(handleGetReport, 0);
                }}
                disabled={
                  pagination.pages <= 1 ||
                  pagination.current >= pagination.pages ||
                  loading
                }
              >
                Next
              </Button>
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default FmsReports;
