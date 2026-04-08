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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { DatePicker, Divider } from "antd";
import dayjs from "dayjs";
import { Badge } from "../../components/ui";

// Initial Task Data
const initialTask = {
  id: "",
  description: "",
  dept: "",
  doer: "",
  checklist: false,
  checklistItems: [],
  isDependent: "no",
  dependentOn: "",
  frequency: "none",
  value: "",
  startTime: "none",
  decisionStep: "no",
  ifTrue: "",
  ifFalse: "",
  formFields: [],
};

// --- Main Component ---
const CreateNewFmsTem = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users } = useSelector((state) => state.users);
  const { departments, status: deptStatus } = useSelector(
    (state) => state.departments,
  );

  const [tasks, setTasks] = useState([initialTask]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Modal states
  const [checklistModal, setChecklistModal] = useState({
    open: false,
    taskIndex: -1,
  });
  const [formModal, setFormModal] = useState({ open: false, taskIndex: -1 });

  // useEffect(() => {
  //   dispatch(fetchUsers({ limit: 100 }));
  //   dispatch(fetchDepartments());
  // }, [dispatch]);

  const formik = useFormik({
    initialValues: {
      fms_id: "",
      templateName: "",
      description: "",
      fms_duration: "timeless",
      endTime: "",
      manager: "",
      srManager: "",
      tasks: [],
    },
    validationSchema: Yup.object({
      templateName: Yup.string().required("Name is required"),
      description: Yup.string().required("Description is required"),
      manager: Yup.string().required("Manager is required"),
      srManager: Yup.string().required("Sr. Manager is required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const payload = {
          ...values,
          tasks,
        };
        console.log("Submitting FMS Template:", payload);
        alert("Template created successfully! Check console.");
        navigate("/fms-engine/fms-templates");
      } catch (error) {
        console.error("Submit error:", error);
        alert("Failed to create template.");
      } finally {
        setLoading(false);
      }
    },
  });

  const addTask = () => {
    const newId = `FMS-NEW-${tasks.length + 1}`;
    const newTask = { ...initialTask, id: newId };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    formik.setFieldValue("tasks", newTasks);
  };

  const removeTask = (index) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    formik.setFieldValue("tasks", newTasks);
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
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

  // Filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "all" || task.dept === deptFilter;
    return matchesSearch && matchesDept;
  });

  const managers =
    users.filter((u) => u.role && u.role.name === "manager") || [];
  const doers = users || [];

  if (deptStatus === "loading") {
    return (
      <div className="m-6 space-y-4">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <Card className="m-6 shadow-lg">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Create New FMS Template</CardTitle>
          <Button type="button" variant="outline">
            Bulk Upload Tasks
          </Button>
        </div>
      </CardHeader>
      <CardContent className="">
        <form className="space-y-6" onSubmit={formik.handleSubmit}>
          {/* Template Details */}
          <div className="space-y-6">
            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {managers.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            {/* Duration Section */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
              {/* Duration Type */}
              <div className="space-y-2">
                <Label>FMS Duration</Label>
                <RadioGroup
                  value={formik.values.fms_duration}
                  onValueChange={(val) =>
                    formik.setFieldValue("fms_duration", val)
                  }
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="timeless" id="timeless" />
                    <Label htmlFor="timeless">Timeless</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">Fixed Period</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* End Date (AntD DatePicker) */}
              {formik.values.fms_duration === "fixed" && (
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <DatePicker
                    className="w-full"
                    value={
                      formik.values.endTime
                        ? dayjs(formik.values.endTime)
                        : null
                    }
                    onChange={(date) =>
                      formik.setFieldValue(
                        "endTime",
                        date ? date.toISOString() : "",
                      )
                    }
                    format="YYYY-MM-DD"
                  />
                </div>
              )}
            </div>
          </div>
          {/* Tasks */}
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
                  placeholder="Search tasks"
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
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Department</TableHead>
                    <TableHead className="w-[100px]">Doer</TableHead>
                    <TableHead className="w-[100px]">Checklist</TableHead>
                    <TableHead>Is Dependent?</TableHead>
                    <TableHead>Depend On</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Start Time Setting</TableHead>
                    <TableHead>Decision Step?</TableHead>
                    <TableHead>If True - Step</TableHead>
                    <TableHead>Else - Step</TableHead>
                    <TableHead className="w-[80px]">Create Form</TableHead>
                    {/* <TableHead>Notifs</TableHead> */}
                    <TableHead className="w-[60px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={task.id}
                          disabled
                          className="font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
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
                          value={task.doer}
                          onValueChange={(v) =>
                            handleTaskChange(index, "doer", v)
                          }
                        >
                          <SelectTrigger className="w-[90px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {doers.slice(0, 10).map((u) => (
                              <SelectItem key={u._id} value={u._id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Checkbox
                            checked={task.checklist}
                            onCheckedChange={(checked) => {
                              handleTaskChange(index, "checklist", !!checked);
                              if (checked && !task.checklistItems.length)
                                openChecklistModal(index);
                            }}
                          />
                          {task.checklist && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 ml-2 text-xs"
                              onClick={() => openChecklistModal(index)}
                            >
                              <ListCheck className="h-3 w-3 mr-1" /> Manage
                            </Button>
                          )}
                          {task.checklistItems.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {task.checklistItems.length}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.isDependent}
                          onValueChange={(v) =>
                            handleTaskChange(index, "isDependent", v)
                          }
                        >
                          <SelectTrigger className="w-[60px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          disabled={task.isDependent !== "yes"}
                          className="w-[90px]"
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
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
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          disabled={task.frequency == "none"}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
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
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
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
                          disabled={task.decisionStep === "no"}
                          className="w-22"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          disabled={task.decisionStep === "no"}
                          className="w-22"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-1 text-xs"
                            onClick={() => openFormModal(index)}
                          >
                            <FilePlus className="h-3 w-3 mr-1" /> Add Form
                          </Button>
                          {task.formFields.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTask(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <div className="flex justify-end gap-2 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Template"}
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
