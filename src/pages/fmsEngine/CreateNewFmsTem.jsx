import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Plus,
  Trash2,
  Search,
  Filter,
  ListCheck,
  FilePlus,
  Check,
  Pencil,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// import { fetchUsers } from "../../../redux/slices/user/userSlice";
// import { fetchDepartments } from "../../../redux/slices/department/departmentSlice";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Checkbox } from "../../components/ui/checkbox";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";

// Modals
import ChecklistModal from "../../components/ChecklistModal";
import CustomFormModal from "../../components/CustomFormModal";
import { DatePicker, Divider, Popconfirm, Spin } from "antd";
import dayjs from "dayjs";
import { Badge } from "../../components/ui";
import api from "../../lib/api";
import { toast } from "sonner";
import { useDebounce } from "../../lib/debounce";

// Initial Task Data
const initialTask = {
  taskId: "",
  description: "",
  dept: "",
  doer: "",
  checklist: false,
  checklistItems: [],
  isDependent: "no",
  dependentOn: "",
  frequency: "Daily",
  value: "",
  startTime: "none",
  decisionStep: "no",
  ifTrue: "",
  ifFalse: "",
  formFields: [],
};
const mapTasksToUI = (apiTasks) => {
  return apiTasks.map((task) => ({
    _id: task._id, // keep for edit
    isFromAPI: true, // ✅ IMPORTANT
    taskId: task.taskId || "",
    description: task.description || "",

    dept: task.departmentOfAssignToUser?._id || "",
    doer: task.assignedTo?._id || "",

    checklist: task.checklist?.length > 0,
    checklistItems: task.checklist || [],

    isDependent: task.isDependent ? "yes" : "no",
    dependentOn: task.dependentOn || "",

    frequency: task.frequency || "Daily",
    value: task.xValue ?? "",

    startTime: task.startTimeSetting || "none",

    decisionStep: task.decisionStep ? "yes" : "no",
    ifTrue: task.ifTrueStep || "",
    ifFalse: task.elseStep || "",

    formFields: task.createdForm || [],
  }));
};
// --- Main Component ---
const CreateNewFmsTem = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [templateCreated, setTemplateCreated] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [templateFMSId, setTemplateFMSId] = useState("");
  const [tasks, setTasks] = useState([{ ...initialTask }]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Modal states
  const [checklistModal, setChecklistModal] = useState({
    open: false,
    taskIndex: -1,
  });
  const [formModal, setFormModal] = useState({ open: false, taskIndex: -1 });

  const [allUsers, setAllUsers] = useState([]);
  const [doers, setDoers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [srManagers, setSrManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newRowIndex, setNewRowIndex] = useState(null);
  const [loadUpdate, setLoadUpdate] = useState(false);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/setup/users/allUsers");
        const users = response.data?.data || [];
        setAllUsers(users);
        const doers = users.filter((u) => u.role?.name === "Member");

        const managers = users.filter((u) => u.role?.name === "Manager");

        const srManagers = users.filter((u) => u.role?.name === "Sr. Manager");

        // ✅ SET STATE
        setDoers(doers);
        setManagers(managers);
        setSrManagers(srManagers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Could not load users.");
      }
    };

    fetchUsers();
    fetchDepartments();
  }, []);
  const fetchDepartments = async () => {
    try {
      const response = await api.get("/setup/departments/allDepartments");
      setDepartments(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };
  const formik = useFormik({
    initialValues: {
      fms_id: "",
      templateName: "",
      description: "",
      fmsDuration: "Timeless",
      endDate: "",
      manager: "",
      srManager: "",
      // tasks: [],
    },
    // validationSchema: Yup.object({
    //   fms_id: Yup.string().required("FMS ID is required"),
    //   templateName: Yup.string().required("Template name is required"),
    //   description: Yup.string().required("Description is required").min(10),
    //   manager: Yup.string().required("Manager is required"),
    //   srManager: Yup.string().required("Sr. Manager is required"),
    //   tasks: Yup.array()
    //     .of(
    //       Yup.object({
    //         description: Yup.string().required("Task description required"),
    //         dept: Yup.string().required("Department required"),
    //         doer: Yup.string().required("Doer required"),
    //       })
    //     )
    //     .min(1, "At least one task required"),
    //   ...(formik.values.fms_duration === "fixed" && {
    //     endDate: Yup.string().required("End date required for fixed duration"),
    //   }),
    // }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // ✅ FIRST TIME → CREATE TEMPLATE ONLY
        if (!templateCreated) {
          const payload = {
            ...values,
          };

          const res = await api.post("/fms/templates", payload);
          const createdId = res.data?.data?._id || res.data?.data?.id;
          navigate(`/fms-engine/edit-template/${createdId}`);
          toast.success("Template created successfully!");
          return;
        }

        // ✅ AFTER TEMPLATE CREATED → SAVE TASKS
        const payload = tasks
          .filter((task) => !task.isFromAPI) // 🔥 ONLY NEW TASKS
          .map((task) => ({
            fmsTemplateId: templateId,
            taskId: task.taskId,
            description: task.description,
            departmentOfAssignToUser: task.dept,
            assignedTo: task.doer,
            frequency: task.frequency,
            xValue: task.value,
            isDependent: task.isDependent === "yes",
            dependentOn: task.dependentOn,
            startTimeSetting:
              task.startTime == "none" ? undefined : task.startTime,
            decisionStep: task.decisionStep == "yes",
            ifTrueStep: task.ifTrue,
            elseStep: task.ifFalse,
            // taskEndDays: task.taskEndDays,
            checklist: task.checklistItems,
            createdForm: task.formFields,
          }));

        const res = await api.post(
          `/fms/templates/${templateId}/tasks`,
          payload,
        );
        if (res.data.errors.length > 0) {
          const messages = res.data.errors.map((e) => e.error);

          // remove duplicates (optional)
          const uniqueMessages = [...new Set(messages)];

          toast.error(
            <div>
              {uniqueMessages.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>,
          );
          return;
        }
        toast.success("Tasks saved successfully!");
        await fetchTasks();
      } catch (error) {
        console.error(error);
        toast.error(error.response.data.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
  });
  //**edit mode details */
  const fetchTemplate = async () => {
    try {
      const res = await api.get(`/fms/templates-details/${id}`);
      const data = res.data.data;

      setTemplateId(data._id);
      setTemplateFMSId(data.fmsId);
      setTemplateCreated(true);

      // setTasks(data.tasks || []);

      formik.setValues({
        fms_id: data.fmsId,
        templateName: data.templateName,
        description: data.description,
        fmsDuration: data.fmsDuration,
        endDate: data.endDate,
        manager: data.manager._id,
        srManager: data.srManager._id,
        // tasks: data.tasks || [],
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load template");
    }
  };
  const fetchTasks = async (search, departmentId) => {
    setLoadingTasks(true);

    try {
      const res = await api.post(`/fms/templates/${id}/tasks-list`, {
        search,
        departmentId: departmentId == "all" ? undefined : departmentId,
      });
      const tasksData = res.data.data || [];
      const formattedTasks = mapTasksToUI(tasksData);

      setTasks(formattedTasks);

      // optional: sync with formik if needed
      formik.setFieldValue("tasks", tasksData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };
  useEffect(() => {
    if (!id) return;
    fetchTemplate();
  }, [id, loadUpdate]);

  const debounceSearch = useDebounce(searchTerm);
  useEffect(() => {
    if (!id) return;
    fetchTasks(debounceSearch, deptFilter);
  }, [id, loadUpdate, debounceSearch, deptFilter]);
  // useEffect(() => {
  //   if (!templateFMSId) return;

  //   const updatedTasks = tasks.map((t, i) => ({
  //     ...t,
  //     taskId: `${templateFMSId}-${String(i + 1).padStart(2, "0")}`,
  //   }));

  //   setTasks(updatedTasks);
  //   formik.setFieldValue("tasks", updatedTasks);
  // }, [templateFMSId, tasks.length]);
  useEffect(() => {
    if (!templateFMSId) return;

    setTasks((prev) =>
      prev.map((t, i) => ({
        ...t,
        taskId: `${templateFMSId}-${String(i + 1).padStart(2, "0")}`,
      })),
    );
  }, [templateFMSId, tasks.length]);
  //**auto update template when change */
  const updateTemplate = async () => {
    setLoadUpdate(true);
    try {
      let payload = { ...formik.values };

      // ✅ remove endDate if Timeless
      if (payload.fmsDuration === "Timeless") {
        payload.endDate = null; // 🔥 important
      }

      await api.put(`/fms/templates/${templateId}`, payload);
      // await api.put(`/fms/templates/${templateId}`, formik.values);
      toast.success("Template updated successfully");
      // console.log("Template auto-updated");
    } catch (err) {
      toast.error(err.response.data.message || "Update failed");
      setLoadUpdate(false);
    } finally {
      setLoadUpdate(false);
    }
  };
  const addTask = () => {
    const newTask = { ...initialTask, isFromAPI: false }; // ✅

    const newTasks = [...tasks, newTask];
    setTasks(newTasks);

    const newIndex = newTasks.length - 1;

    setEditingIndex(null); // ❌ don't force edit mode
    setNewRowIndex(newIndex);
  };
  const removeTask = (index) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    formik.setFieldValue("tasks", newTasks);
  };
  const handleDeleteTask = async (index) => {
    const task = tasks[index];

    // ✅ NEW ROW (not in DB)
    if (!task._id) {
      removeTask(index);
      return;
    }

    // ✅ EXISTING ROW (API)
    try {
      await api.delete(`/fms/templates/${templateId}/tasks/${task.taskId}`);

      removeTask(index);
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete task");
    }
  };
  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];

    // 🚫 First task rules
    if (index === 0) {
      if (field === "isDependent") return;
      newTasks[index].isDependent = "no";
      newTasks[index].dependentOn = "";
    }

    newTasks[index][field] = value;
    if (field === "dept") {
      newTasks[index].doer = ""; // clear selected user
    }
    setTasks(newTasks);
    formik.setFieldValue("tasks", newTasks);
  };

  const openChecklistModal = (index) => {
    setChecklistModal({ open: true, taskIndex: index });
  };

  const openFormModal = (index) => {
    setFormModal({ open: true, taskIndex: index });
  };

  const saveChecklistItems = (items) => {
    const index = checklistModal.taskIndex;
    const newTasks = [...tasks];
    newTasks[index].checklistItems = items;
    newTasks[index].checklist = items.length > 0;
    setTasks(newTasks);
    formik.setFieldValue("tasks", newTasks);
    setChecklistModal({ open: false, taskIndex: -1 });
  };

  const saveFormFields = (fields) => {
    const index = formModal.taskIndex;
    const newTasks = [...tasks];
    newTasks[index].formFields = fields;
    setTasks(newTasks);
    formik.setFieldValue("tasks", newTasks);
    setFormModal({ open: false, taskIndex: -1 });
  };

  const handleSave = async (index) => {
    try {
      const task = tasks[index];
      const payload = {
        fmsTemplateId: templateId,
        taskId: task.taskId,
        description: task.description,
        departmentOfAssignToUser: task.dept,
        assignedTo: task.doer,
        frequency: task.frequency,
        xValue: task.value,
        isDependent: task.isDependent === "yes",
        dependentOn: task.dependentOn,
        startTimeSetting: task.startTime == "none" ? undefined : task.startTime,
        decisionStep: task.decisionStep == "yes",
        ifTrueStep: task.ifTrue,
        elseStep: task.ifFalse,
        // taskEndDays: task.taskEndDays,
        checklist: task.checklistItems,
        createdForm: task.formFields,
      };

      await api.put(
        `/fms/templates/${templateId}/tasks/${task.taskId}`,
        payload,
      );

      toast.success("Tasks edit successfully!");
      // ✅ after save → remove new flag
      if (newRowIndex === index) {
        setNewRowIndex(null);
      }

      setEditingIndex(null);
    } catch (error) {
      console.log(error);
    }
  };
  const handleEdit = (index) => {
    setEditingIndex(index);
  };
  return (
    <Card className="m-6 shadow-lg">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          {/* Left Side */}
          <div className="flex flex-col">
            <CardTitle className="text-lg font-semibold">
              {templateCreated ? "Edit" : "Create New"} FMS Template
            </CardTitle>

            {templateCreated && (
              <span className="text-xs text-muted-foreground">
                ID: {templateFMSId}
              </span>
            )}
          </div>

          {/* Right Side */}
          {templateCreated && (
            <Button type="button" variant="outline" size="sm">
              Bulk Upload Tasks
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="">
        <form className="space-y-6" onSubmit={formik.handleSubmit}>
          {/* Template Details */}
          <div className="space-y-6">
            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FMS ID */}
              <div className="space-y-2">
                <Label>FMS ID *</Label>
                <Input
                  name="fms_id"
                  disabled
                  value={templateFMSId || ""}
                  // onChange={formik.handleChange}
                  // onBlur={formik.handleBlur}
                  placeholder="Auto Generated"
                />
              </div>

              {/* Template Name */}
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  name="templateName"
                  value={formik.values.templateName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter template name"
                />
              </div>

              {/* Manager */}
              <div className="space-y-2">
                <Label>Manager *</Label>
                <Select
                  value={formik.values.manager}
                  onValueChange={(v) => formik.setFieldValue("manager", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sr Manager */}
              <div className="space-y-2">
                <Label>Sr Manager *</Label>
                <Select
                  value={formik.values.srManager}
                  onValueChange={(v) => formik.setFieldValue("srManager", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Sr Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {srManagers.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>FMS Duration</Label>

                <div className="border rounded-lg" style={{ padding: "8px" }}>
                  <RadioGroup
                    value={formik.values.fmsDuration}
                    onValueChange={(val) =>
                      formik.setFieldValue("fmsDuration", val)
                    }
                    className="flex flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Timeless" id="Timeless" />
                      <Label htmlFor="Timeless">Timeless</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Fixed Period" id="Fixed Period" />
                      <Label htmlFor="Fixed Period">Fixed Period</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* End Date (AntD DatePicker) */}
              {formik.values.fmsDuration === "Fixed Period" && (
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <DatePicker
                    className="w-full"
                    value={
                      formik.values.endDate
                        ? dayjs(formik.values.endDate)
                        : null
                    }
                    onChange={(date) =>
                      formik.setFieldValue(
                        "endDate",
                        date ? date.toISOString() : "",
                      )
                    }
                    format="DD MMM YYYY"
                  />
                </div>
              )}
            </div>
            {/* Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rows={4}
                placeholder="Enter description..."
              />
            </div>
            {templateCreated && (
              <div className="flex justify-end gap-2 pt-6 border-t">
                <Button
                  type="button"
                  onClick={updateTemplate}
                  disabled={loadUpdate}
                >
                  {"Update Template"}
                </Button>
              </div>
            )}
          </div>
          {/* Tasks */}
          {templateCreated && (
            <>
              <Divider />
              <div className="space-y-4">
                <div className="flex justify-between">
                  <h3 className="text-lg font-semibold">Task List</h3>
                  <Button type="button" onClick={addTask} variant="outline">
                    <Plus className="w-4 h-4 mr-1" /> Add Task
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  {/* Search (takes more space) */}
                  <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks by Task Id or Description"
                      className="pl-10 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Filter (compact) */}
                  <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Depts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Depts</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d._id} value={d._id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-[400px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Task Id</TableHead>{" "}
                        {/* increased */}
                        <TableHead className="w-[300px]">
                          Description
                        </TableHead>{" "}
                        {/* increased */}
                        <TableHead className="w-[140px]">Department</TableHead>
                        <TableHead className="w-[140px]">Doer</TableHead>
                        <TableHead className="w-[120px]">
                          Is Dependent?
                        </TableHead>
                        <TableHead className="w-[160px]">Depend On</TableHead>
                        <TableHead className="w-[140px]">Frequency</TableHead>
                        <TableHead className="w-[100px]">Value</TableHead>
                        <TableHead className="w-[180px]">
                          Start Time Setting
                        </TableHead>
                        <TableHead className="w-[140px]">
                          Decision Step?
                        </TableHead>
                        <TableHead className="w-[160px]">
                          If True - Step
                        </TableHead>
                        <TableHead className="w-[160px]">Else - Step</TableHead>
                        <TableHead className="w-[140px]">Checklist</TableHead>
                        <TableHead className="w-[140px]">Create Form</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingTasks ? (
                        <TableRow>
                          <TableCell colSpan={15} className="text-center">
                            <div className="flex justify-center items-center h-32">
                              <Spin />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        tasks.map((task, index) => {
                          const isEditable =
                            !task.isFromAPI || editingIndex === index;
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  value={task.taskId} // value={task.taskId}
                                  name="taskId"
                                  disabled
                                  className="font-mono text-xs w-[150px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  disabled={!isEditable}
                                  className="w-[300px]"
                                  value={task.description}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      index,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  disabled={!isEditable}
                                  value={task.dept}
                                  onValueChange={(v) =>
                                    handleTaskChange(index, "dept", v)
                                  }
                                >
                                  <SelectTrigger className="w-[90px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {departments.map((d) => (
                                      <SelectItem key={d._id} value={d._id}>
                                        {d.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  disabled={!isEditable}
                                  value={task.doer}
                                  onValueChange={(v) =>
                                    handleTaskChange(index, "doer", v)
                                  }
                                >
                                  <SelectTrigger className="w-[90px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {doers
                                      .filter((u) =>
                                        task.dept
                                          ? u.department?.some(
                                              (d) =>
                                                String(d._id) ===
                                                String(task.dept),
                                            )
                                          : true,
                                      )
                                      .slice(0, 10)
                                      .map((u) => (
                                        <SelectItem key={u._id} value={u._id}>
                                          {u.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>

                              <TableCell>
                                <Select
                                  disabled={!isEditable}
                                  value={index === 0 ? "no" : task.isDependent}
                                  onValueChange={(v) =>
                                    index !== 0 &&
                                    handleTaskChange(index, "isDependent", v)
                                  }
                                >
                                  <SelectTrigger
                                    className="w-[60px]"
                                    disabled={index === 0}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="no">No</SelectItem>
                                    {index !== 0 && (
                                      <SelectItem value="yes">Yes</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={task.dependentOn || undefined} // IMPORTANT (no empty string)
                                  onValueChange={(val) =>
                                    handleTaskChange(index, "dependentOn", val)
                                  }
                                  disabled={
                                    !isEditable ||
                                    index === 0 ||
                                    task.isDependent !== "yes"
                                  }
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select Task" />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {tasks
                                      .filter((_, i) => i !== index) // ❌ remove current row
                                      .map((t) => (
                                        <SelectItem
                                          key={t.taskId}
                                          value={
                                            t.taskId || `temp-${Math.random()}`
                                          }
                                        >
                                          {t.taskId || "New Task"}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  disabled={!isEditable}
                                  value={task.frequency}
                                  onValueChange={(v) =>
                                    handleTaskChange(index, "frequency", v)
                                  }
                                  className="w-[70px]"
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {task.isDependent == "no" &&
                                      task.isDependent == "no" && (
                                        <>
                                          {/* <SelectItem value="none">None</SelectItem> */}
                                          <SelectItem value="Anytime">
                                            Anytime
                                          </SelectItem>
                                          <SelectItem value="Daily">
                                            Daily
                                          </SelectItem>
                                          <SelectItem value="Weekly">
                                            Weekly
                                          </SelectItem>
                                          <SelectItem value="Monthly">
                                            Monthly
                                          </SelectItem>
                                          <SelectItem value="Start+X in days">
                                            Start+X in days
                                          </SelectItem>
                                          <SelectItem value="Start+X in hours">
                                            Start+X in hours
                                          </SelectItem>
                                        </>
                                      )}
                                    {task.isDependent == "yes" && (
                                      <>
                                        <SelectItem value="Task+X in days">
                                          Task+X in days
                                        </SelectItem>
                                        <SelectItem value="Task+X in hours">
                                          Task+X in hours
                                        </SelectItem>
                                        <SelectItem value="Task-X in days">
                                          Task-X in days
                                        </SelectItem>
                                        <SelectItem value="Task-X in hours">
                                          Task-X in hours
                                        </SelectItem>
                                      </>
                                    )}
                                    {formik.values.fmsDuration ==
                                      "Fixed Period" &&
                                      task.isDependent == "no" && (
                                        <>
                                          <SelectItem value="Event+X in days">
                                            Event+X in days
                                          </SelectItem>
                                          <SelectItem value="Event+X in hours">
                                            Event+X in hours
                                          </SelectItem>
                                          <SelectItem value="Event-X in days">
                                            Event-X in days
                                          </SelectItem>
                                          <SelectItem value="Event-X in hours">
                                            Event-X in hours
                                          </SelectItem>
                                        </>
                                      )}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  disabled={
                                    !isEditable ||
                                    task.frequency === "Anytime" ||
                                    task.frequency === "Daily" ||
                                    task.frequency === "Weekly" ||
                                    task.frequency === "Monthly" ||
                                    task.frequency === "Start+X in days" ||
                                    task.frequency === "Start+X in hours" ||
                                    task.frequency === "Event+X in days" ||
                                    task.frequency === "Event+X in hours" ||
                                    task.frequency === "Event-X in days" ||
                                    task.frequency === "Event-X in hours"
                                  }
                                  className="w-16"
                                  value={task.value}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      index,
                                      "value",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  disabled={
                                    !isEditable || task.isDependent == "no"
                                  }
                                  value={task.startTime}
                                  onValueChange={(v) =>
                                    handleTaskChange(index, "startTime", v)
                                  }
                                  className="w-[80px]"
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* <SelectItem value="none">None</SelectItem> */}
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="planned-to-planned">
                                      Planned-To-Planned
                                    </SelectItem>
                                    <SelectItem value="actual-to-planned">
                                      Actual-To-Planned
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  disabled={!isEditable}
                                  value={task.decisionStep}
                                  onValueChange={(v) =>
                                    handleTaskChange(index, "decisionStep", v)
                                  }
                                  className="w-[60px]"
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="no">No</SelectItem>
                                    <SelectItem value="yes">Yes</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  disabled={
                                    !isEditable || task.decisionStep === "no"
                                  }
                                  className="w-22"
                                  value={task.ifTrue}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      index,
                                      "ifTrue",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  disabled={
                                    !isEditable || task.decisionStep === "no"
                                  }
                                  className="w-22"
                                  value={task.ifFalse}
                                  onChange={(e) =>
                                    handleTaskChange(
                                      index,
                                      "ifFalse",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => openChecklistModal(index)}
                                    disabled={!isEditable}
                                  >
                                    <ListCheck className="h-3 w-3 mr-1" />
                                    {task.checklistItems.length > 0
                                      ? "Manage Items"
                                      : "Add Items"}
                                  </Button>

                                  {task.checklistItems.length > 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="ml-2 text-xs"
                                    >
                                      {task.checklistItems.length}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-1 text-xs"
                                    onClick={() => openFormModal(index)}
                                    disabled={!isEditable}
                                  >
                                    <FilePlus className="h-3 w-3 mr-1" /> Add
                                    Form
                                  </Button>
                                  {task.formFields.length > 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="ml-1 text-xs"
                                    >
                                      {task.formFields.length}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              {/* <TableCell>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-1 text-xs"
                        >
                          Setup
                        </Button>
                      </TableCell> */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    {task.isFromAPI ? (
                                      editingIndex === index ? (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleSave(index)}
                                        >
                                          <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                      ) : (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEdit(index)}
                                        >
                                          <Pencil className="h-4 w-4 text-blue-600" />
                                        </Button>
                                      )
                                    ) : null}
                                  </div>
                                  <Popconfirm
                                    title="Delete Task"
                                    description="Are you sure you want to delete this task?"
                                    onConfirm={() => handleDeleteTask(index)}
                                    okText="Yes"
                                    cancelText="No"
                                  >
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </Popconfirm>
                                  {/* <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeTask(index)}
                                      className="h-8 w-8 p-0"
                                      // disabled={index === 0} // ✅ disable first row
                                    >
                                      <Trash2
                                        className={`h-4 w-4 ${"text-destructive"}`}
                                      />
                                    </Button> */}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : templateCreated
                  ? "Save Tasks"
                  : "Create Template"}
            </Button>
          </div>
        </form>

        {/* Modals */}
        <ChecklistModal
          open={checklistModal.open}
          checklist={
            checklistModal.taskIndex >= 0
              ? tasks[checklistModal.taskIndex]?.checklistItems || []
              : []
          }
          onClose={() => setChecklistModal({ open: false, taskIndex: -1 })}
          onSave={saveChecklistItems}
        />
        <CustomFormModal
          open={formModal.open}
          formFields={
            formModal.taskIndex >= 0
              ? tasks[formModal.taskIndex]?.formFields || []
              : []
          }
          onClose={() => setFormModal({ open: false, taskIndex: -1 })}
          onSave={saveFormFields}
        />
      </CardContent>
    </Card>
  );
};

export default CreateNewFmsTem;
