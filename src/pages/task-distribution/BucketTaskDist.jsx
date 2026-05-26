import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "../../components/ui/index.jsx";

import {
  Users,
  Briefcase,
  CalendarDays,
  Repeat,
  CheckCircle2,
  Send,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

import { Table, Tag, Checkbox, Empty } from "antd";
import api from "../../lib/api.js";
import dayjs from "dayjs";
import { Input, Select } from "antd";

const { Search } = Input;
const TaskDistribution = () => {
  const [buckets, setBuckets] = useState([]);

  const [selectedBucket, setSelectedBucket] = useState(null);

  const [reportingUsers, setReportingUsers] = useState([]);

  const [selectedAssignments, setSelectedAssignments] = useState({});

  const [loading, setLoading] = useState(false);

  // =========================================================
  // FETCH BUCKETS
  // =========================================================

  const fetchBuckets = async () => {
    try {
      const res = await api.get("/task-buckets");

      setBuckets(res?.data?.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  // =========================================================
  // FETCH REPORTING USERS
  // =========================================================

  const fetchReportingUsers = async (bucketId) => {
    try {
      const res = await api.get(`/task-buckets/${bucketId}/reporting-users`);
      setReportingUsers(res?.data?.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  // =========================================================
  // HANDLE SELECT BUCKET
  // =========================================================

  const handleSelectBucket = async (bucket) => {
    setSelectedBucket(bucket);

    setSelectedAssignments({});

    await fetchReportingUsers(bucket._id);
  };

  // =========================================================
  // TABLE DATA
  // =========================================================

  const tableData = useMemo(() => {
    return reportingUsers.map((u) => ({
      key: u._id,

      userId: u._id,

      userName: u.name,

      email: u.email,

      role: u.role?.name || "-",

      managerId: u.reportingManager?._id,

      managerName: u.reportingManager?.name || "-",

      alreadyAssigned: u.alreadyAssigned || false,
    }));
  }, [reportingUsers]);
  // =========================================================
  // DISTRIBUTE TASK
  // =========================================================

  const handleDistribute = async () => {
    try {
      const selectedUsers = Object.keys(selectedAssignments);

      if (!selectedBucket?._id) {
        alert("Please select bucket");
        return;
      }

      if (selectedUsers.length === 0) {
        alert("Please select users");
        return;
      }

      setLoading(true);

      await api.post(`/task-buckets/${selectedBucket._id}/distribute`, {
        selectedUsers,
      });

      alert("Tasks distributed successfully");

      // refresh current bucket users
      await fetchReportingUsers(selectedBucket._id);

      // refresh bucket list
      await fetchBuckets();

      // clear selected
      setSelectedAssignments({});
    } catch (err) {
      console.log(err);

      alert(err?.response?.data?.message || "Failed to distribute task");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HANDLE SELECT USER
  // =========================================================

  const toggleUserSelection = (userId, checked) => {
    setSelectedAssignments((prev) => {
      const updated = { ...prev };

      if (checked) {
        updated[userId] = true;
      } else {
        delete updated[userId];
      }

      return updated;
    });
  };
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  /* ===================================================== */
  /* FILTERED BUCKETS */
  /* ===================================================== */

  const filteredBuckets = useMemo(() => {
    let data = [...buckets];

    // SEARCH
    if (search.trim()) {
      const q = search.toLowerCase();

      data = data.filter(
        (bucket) =>
          bucket.title?.toLowerCase().includes(q) ||
          bucket.description?.toLowerCase().includes(q),
      );
    }

    // FILTER
    if (filterType === "recurring") {
      data = data.filter((b) => b.isRecurrent);
    }

    if (filterType === "non-recurring") {
      data = data.filter((b) => !b.isRecurrent);
    }

    return data;
  }, [buckets, search, filterType]);
  // =========================================================
  // TABLE COLUMNS
  // =========================================================

  const columns = [
    {
      title: "Assign",
      dataIndex: "assign",
      width: 90,

      render: (_, record) => (
        <Checkbox
          disabled={record.alreadyAssigned}
          checked={
            record.alreadyAssigned || !!selectedAssignments[record.userId]
          }
          onChange={(e) => toggleUserSelection(record.userId, e.target.checked)}
        />
      ),
    },

    {
      title: "Employee",
      dataIndex: "userName",

      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-800">{record.userName}</div>

          <div className="text-xs text-slate-500">{record.email}</div>
        </div>
      ),
    },

    {
      title: "Role",
      dataIndex: "role",

      render: (value) => <Tag color="blue">{value}</Tag>,
    },

    {
      title: "Reporting Manager",
      dataIndex: "managerName",

      render: (value) => (
        <div className="font-medium text-slate-700">{value}</div>
      ),
    },

    // {
    //   title: "Status",
    //   dataIndex: "alreadyAssigned",

    //   render: (value) =>
    //     value ? (
    //       <Tag color="green">Assigned</Tag>
    //     ) : (
    //       <Tag color="orange">Pending</Tag>
    //     ),
    // },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-6">
      <div className="space-y-6">
        {/* ====================================================== */}
        {/* HEADER */}
        {/* ====================================================== */}

        <div className="rounded-[34px] bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-8 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Bulk Task Distribution
              </h1>

              <p className="text-blue-100 mt-2 max-w-3xl">
                Select task buckets and distribute tasks to employees reporting
                under your management hierarchy.
              </p>
            </div>

            <div className="bg-white/20 p-4 rounded-3xl">
              <Send className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* CONTENT */}
        {/* ====================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ==================================================== */}
          {/* LEFT SIDE */}
          {/* ==================================================== */}

          <div className="xl:col-span-1">
            <Card className="rounded-[24px] border border-slate-200 shadow-sm overflow-hidden h-full">
              {/* ===================================================== */}
              {/* HEADER */}
              {/* ===================================================== */}

              <CardHeader className="border-b bg-white px-5 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Task Buckets
                  </CardTitle>

                  <div className="text-sm font-semibold text-slate-500">
                    {filteredBuckets.length}
                  </div>
                </div>

                {/* ===================================================== */}
                {/* SEARCH + FILTER */}
                {/* ===================================================== */}

                <div className="flex items-center gap-3">
                  {/* SEARCH */}

                  <Search
                    placeholder="Search buckets..."
                    allowClear
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                    size="large"
                  />

                  {/* FILTER */}

                  <Select
                    value={filterType}
                    onChange={(value) => setFilterType(value)}
                    size="large"
                    style={{ width: 180 }}
                    options={[
                      {
                        label: "All Buckets",
                        value: "all",
                      },
                      {
                        label: "Recurring",
                        value: "recurring",
                      },
                      {
                        label: "Non Recurring",
                        value: "non-recurring",
                      },
                    ]}
                  />
                </div>
              </CardHeader>

              {/* ===================================================== */}
              {/* LIST */}
              {/* ===================================================== */}

              <CardContent className="p-0 max-h-[78vh] overflow-y-auto mt-3">
                {filteredBuckets.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    No buckets found
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredBuckets.map((bucket) => {
                      const isSelected = selectedBucket?._id === bucket._id;

                      return (
                        <div
                          key={bucket._id}
                          onClick={() => handleSelectBucket(bucket)}
                          className={`
                  px-5 py-4 cursor-pointer transition-all
                  ${
                    isSelected
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : "hover:bg-slate-50 border-l-4 border-transparent"
                  }
                `}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-slate-800 truncate">
                                {bucket.title}
                              </h3>

                              <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                                {bucket.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Repeat className="w-3.5 h-3.5" />

                              {bucket.isRecurrent
                                ? bucket.frequency
                                : "Non Recurring"}
                            </div>

                            <div className="flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5" />

                              {dayjs(bucket.createdAt).format("DD MMM YYYY")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ==================================================== */}
          {/* RIGHT SIDE */}
          {/* ==================================================== */}

          <div className="xl:col-span-2">
            <Card className="rounded-[28px] border-0 shadow-lg">
              <CardHeader className="border-b bg-slate-50 rounded-t-[28px]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                      Reporting Team Members
                    </CardTitle>

                    <p className="text-sm text-slate-500 mt-1">
                      Select employees who should receive tasks
                    </p>
                  </div>

                  <Button
                    disabled={
                      loading ||
                      !selectedBucket ||
                      Object.keys(selectedAssignments).length === 0
                    }
                    onClick={handleDistribute}
                    className="rounded-xl"
                  >
                    {loading ? "Distributing..." : "Distribute Tasks"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-5 mt-2">
                {!selectedBucket ? (
                  <div className="h-[450px] flex items-center justify-center">
                    <Empty description="Select task bucket first" />
                  </div>
                ) : tableData.length === 0 ? (
                  <div className="h-[450px] flex items-center justify-center">
                    <Empty description="No pending employees found" />
                  </div>
                ) : (
                  <Table
                    columns={columns}
                    dataSource={tableData}
                    bordered
                    pagination={{
                      pageSize: 7,
                    }}
                    // expandable={{
                    //   expandedRowRender: (record) => (
                    //     <div className="grid grid-cols-2 gap-5 p-2">
                    //       <div>
                    //         <p className="text-xs text-slate-500">User ID</p>

                    //         <div className="font-medium text-slate-700 break-all">
                    //           {record.userId}
                    //         </div>
                    //       </div>

                    //       <div>
                    //         <p className="text-xs text-slate-500">
                    //           Reporting Manager
                    //         </p>

                    //         <div className="font-medium text-slate-700">
                    //           {record.managerName}
                    //         </div>
                    //       </div>

                    //       <div>
                    //         <p className="text-xs text-slate-500">
                    //           Employee Email
                    //         </p>

                    //         <div className="font-medium text-slate-700">
                    //           {record.email}
                    //         </div>
                    //       </div>

                    //       <div>
                    //         <p className="text-xs text-slate-500">
                    //           Current Status
                    //         </p>

                    //         <div>
                    //           {record.alreadyAssigned ? (
                    //             <Tag color="green">Already Assigned</Tag>
                    //           ) : (
                    //             <Tag color="orange">Pending Assignment</Tag>
                    //           )}
                    //         </div>
                    //       </div>
                    //     </div>
                    //   ),
                    // }}
                  />
                )}

                {/* ============================================== */}
                {/* FOOTER */}
                {/* ============================================== */}

                {selectedBucket && (
                  <div className="mt-5 rounded-2xl bg-slate-50 border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500">
                          Selected Employees
                        </div>

                        <div className="font-bold text-2xl mt-1 text-slate-800">
                          {Object.keys(selectedAssignments).length}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-slate-500">
                            Total Employees
                          </div>

                          <div className="font-bold text-xl text-slate-800">
                            {tableData.length}
                          </div>
                        </div>

                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDistribution;
