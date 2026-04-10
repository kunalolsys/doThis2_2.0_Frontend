import React, { useEffect, useState } from "react";
import {
  FilePenLine,
  Trash2,
  Plus,
  Edit,
  Zap,
  Sparkles,
  ListTodo,
  User,
  Building2,
} from "lucide-react";

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
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchTemplates } from "../../redux/slices/fms/fmsSlice";
import DataPagination from "../../components/ui/commonPagination";
import { toast } from "sonner";
import { Modal, Popconfirm, Spin } from "antd";
import api from "../../lib/api";
import { cn } from "../../lib/utils";

// --- Helper for Badges ---
const getDurationBadge = (duration) => {
  if (duration === "Timeless") {
    return (
      <Badge
        variant="default"
        className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200 text-sm px-2 py-1"
      >
        Timeless
      </Badge>
    );
  }
  if (duration === "Fixed Period") {
    return (
      <Badge
        variant="default"
        className="bg-purple-100 text-purple-800 hover:bg-purple-100 border border-purple-200 text-sm px-2 py-1"
      >
        Fixed Period
      </Badge>
    );
  }
  return <Badge variant="outline">{duration}</Badge>;
};

// --- Main Component ---
const FmsTemplates = () => {
  const dispatch = useDispatch();
  const [fmsTemplates, setFmsTemplates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const getTemplates = async () => {
    const res = await dispatch(fetchTemplates({ page, limit })).unwrap();
    console.log(res);
    setFmsTemplates(res.data);
    setPagination(res.pagination);
  };
  useEffect(() => {
    getTemplates();
  }, [page, limit]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const fetchTasks = async (templateId) => {
    setLoadingTasks(true);
    try {
      const res = await api.post(`/fms/templates/${templateId}/tasks-list`, {});
      setTasks(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoadingTasks(false);
    }
  };
  const handleOpenTasks = async (templateId) => {
    setSelectedTemplateId(templateId);
    setIsTaskModalOpen(true);
    fetchTasks(templateId);
  };
  const handleDeleteTemplate = async (templateId) => {
    try {
      await api.delete(`/fms/templates/${templateId}`);
      toast.success("Template deleted successfully");
      getTemplates();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete template");
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-72 h-72 bg-blue-200/10 rounded-full blur-3xl animate-pulse -z-10"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-1000 -z-10"></div>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b border-gray-200/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                FMS Templates
              </CardTitle>
            </div>
            <Link
              to="/fms-engine/create-template"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center text-sm font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Template
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <div className="rounded-lg border border-gray-200/50 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-sm p-3">
                      FMS ID
                    </TableHead>
                    <TableHead className="font-semibold text-sm p-3">
                      TEMPLATE NAME
                    </TableHead>
                    <TableHead className="font-semibold text-sm p-3">
                      DESCRIPTION
                    </TableHead>
                    <TableHead className="font-semibold text-sm p-3">
                      FMS DURATION
                    </TableHead>
                    <TableHead className="font-semibold text-sm p-3">
                      TASKS
                    </TableHead>
                    <TableHead className="font-semibold text-sm p-3">
                      LAUNCHED
                    </TableHead>
                    <TableHead className="font-semibold text-sm p-3">
                      ACTIONS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(fmsTemplates) && fmsTemplates.length > 0 ? (
                    fmsTemplates.map((template, index) => (
                      <TableRow
                        key={template.id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <TableCell className="font-medium p-3 text-sm">
                          {template.fmsId}
                        </TableCell>
                        <TableCell className="p-3 text-sm">
                          {template.templateName}
                        </TableCell>
                        <TableCell className="p-3 text-sm">
                          {template.description}
                        </TableCell>
                        <TableCell className="p-3">
                          {getDurationBadge(template.fmsDuration)}
                        </TableCell>
                        <TableCell className="p-3 text-sm">
                          <div
                            className="flex items-center gap-2 text-gray-600 cursor-pointer"
                            onClick={() => handleOpenTasks(template._id)}
                          >
                            <ListTodo className="h-4 w-4" />
                            <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-md">
                              {template.tasks?.length || 0}
                            </span>
                          </div>
                        </TableCell>{" "}
                        <TableCell className="p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "px-2 py-0.5 text-xs rounded-md font-medium",
                                template.isLaunched
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700",
                              )}
                            >
                              {template.isLaunched ? "Launched" : "Draft"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="flex gap-2">
                            <Link
                              to={`/fms-engine/edit-template/${template._id}`}
                              className="h-8 w-8 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center hover:bg-blue-200 transition-colors duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <Popconfirm
                              title="Delete Template"
                              description="Are you sure you want to delete this template?"
                              onConfirm={() =>
                                handleDeleteTemplate(template._id)
                              }
                              okText="Yes"
                              cancelText="No"
                              okButtonProps={{ danger: true }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </Popconfirm>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-gray-50 transition-colors duration-200">
                      <TableCell
                        colSpan={9} // 👈 adjust based on total columns
                        className="p-3 text-sm text-center text-gray-500"
                      >
                        No templates found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DataPagination
            page={page}
            limit={limit}
            total={pagination?.total || 0}
            totalPages={pagination?.pages || 1}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1); // reset page when limit changes
            }}
          />
          <Modal
            title="Tasks List"
            open={isTaskModalOpen}
            onCancel={() => setIsTaskModalOpen(false)}
            footer={null}
            width={700}
          >
            {loadingTasks ? (
              <div className="flex justify-center items-center h-40">
                <Spin />
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-center text-gray-500">No tasks found</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-start gap-3 p-3 border rounded-md hover:shadow-sm transition bg-white"
                  >
                    {/* Left Accent */}
                    <div className="w-1.5 h-full bg-indigo-500 rounded-full mt-1" />

                    {/* Content */}
                    <div className="flex-1">
                      {/* Top Row */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800">
                          {task.taskId}
                        </span>

                        <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded">
                          {task.frequency}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {task.description}
                      </p>

                      {/* Bottom Info */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {task.assignedTo?.name || "-"}
                        </div>

                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {task.departmentOfAssignToUser?.name || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Modal>
        </CardContent>
      </Card>
    </div>
  );
};

export default FmsTemplates;
