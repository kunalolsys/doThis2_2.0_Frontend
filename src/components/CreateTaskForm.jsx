import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  Zap,
  Search,
  Clock,
  Plus,
  Trash2,
  ListTodo,
  ClipboardList,
  Users as UsersIcon, // Renamed to avoid conflict
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import api from "../lib/api";
import { fetchTasks } from "../redux/slices/task/taskSlice"; // Assuming fetchTasks is needed here

import { cn, frequencyMap } from "./utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
  Textarea,
  Checkbox,
  Select,
  SelectContext,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  RadioGroup,
  RadioGroupItem,
} from "./ui/index.jsx"; // Import specific UI components needed
import dayjs from "dayjs";
import { DatePicker } from "antd";
import AttachmentUpload from "./attachmentsUpload.jsx";

const CreateTaskForm = ({
  users,
  departments,
  holidays,
  onTaskCreated,
  allTasks,
  workingWeeks,
}) => {
  const dispatch = useDispatch();

  // Form States
  const [date, setDate] = useState(); // Unused in final form logic, remove?
  const [startDate, setStartDate] = useState();
  const [taskEndDateOffset, setTaskEndDateOffset] = useState(""); // New state for task end date offset
  const [isDependent, setIsDependent] = useState(false);
  const [dependentDueDate, setDependentDueDate] = useState(); // Unused, remove?
  const [parentTask, setParentTask] = useState("");
  const [parentTaskSearch, setParentTaskSearch] = useState("");
  const [startTimeSetting, setStartTimeSetting] =
    useState("planned-to-planned");
  const [frequencyType, setFrequencyType] = useState("days");
  const [xValue, setXValue] = useState("");
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("daily");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState();
  const [weeklyRecurrenceDays, setWeeklyRecurrenceDays] = useState([]);

  // Checklist State
  const [checklist, setChecklist] = useState([]);
  const [checklistItem, setChecklistItem] = useState("");

  // --- Assignee States ---
  const [openDepartments, setOpenDepartments] = useState(new Set());
  const [selectedDepartments, setSelectedDepartments] = useState(new Set());
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);

  // Basic Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentFile, setAttachmentFile] = useState([]);
  const [attachmentFileList, setAttachmentFileList] = useState([]);

  // UI/Loading States
  const [loading, setLoading] = useState(false); // For form submission
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  // Memoized filtered tasks for the parent task dropdown
  const filteredParentTasks = useMemo(() => {
    if (!parentTaskSearch) {
      return allTasks;
    }
    const lowercasedSearch = parentTaskSearch.toLowerCase();
    return allTasks.filter(
      (task) =>
        task &&
        ((task.title && task.title.toLowerCase().includes(lowercasedSearch)) ||
          (task.TaskId &&
            String(task.TaskId).toLowerCase().includes(lowercasedSearch))),
    );
  }, [allTasks, parentTaskSearch]);

  // --- Checklist Handlers ---
  const addChecklistItem = () => {
    if (!checklistItem.trim()) return;
    setChecklist([...checklist, { text: checklistItem, isCompleted: false }]);
    toast.success("Checklist item added.");
    setChecklistItem("");
  };

  const removeChecklistItem = (index) => {
    const newList = [...checklist];
    newList.splice(index, 1);
    setChecklist(newList);
  };

  useEffect(() => {
    if (startDate && date && startDate > date) {
      setDate(undefined);
      toast.info(
        "Due date has been cleared because it was before the new start date.",
      );
    }
  }, [startDate, date]);

  // useEffect(() => {
  //   if (startDate && recurrenceEndDate && startDate > recurrenceEndDate) {
  //     setRecurrenceEndDate(undefined);
  //     toast.info(
  //       "Recurrence end date has been cleared because it was before the new start date.",
  //     );
  //   }
  // }, [startDate, recurrenceEndDate]);

  // --- Assignee Dropdown Logic ---
  const assignDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        assignDropdownRef.current &&
        !assignDropdownRef.current.contains(event.target)
      ) {
        setIsAssignDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [assignDropdownRef]);

  // Handle Department Expand/Collapse
  const handleDeptExpand = (deptId) => {
    setOpenDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  // Handle Department Select All Toggle
  const handleDeptSelectAll = (deptId) => {
    setSelectedDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
        // Deselect all users in this dept
        const deptUsers = users.filter(
          (u) =>
            u.department &&
            Array.isArray(u.department) &&
            u.department.some((d) => d && d._id === deptId),
        );
        const deptUserIds = deptUsers.map((u) => u._id);
        setSelectedUsers((prevUsers) =>
          prevUsers.filter((id) => !deptUserIds.includes(id)),
        );
      } else {
        newSet.add(deptId);
        // Select all users in this dept
        const deptUsers = users.filter(
          (u) =>
            u.department &&
            Array.isArray(u.department) &&
            u.department.some((d) => d && d._id === deptId),
        );
        const deptUserIds = deptUsers.map((u) => u._id);
        setSelectedUsers((prevUsers) => {
          const newUsers = new Set(prevUsers);
          deptUserIds.forEach((id) => newUsers.add(id));
          return Array.from(newUsers);
        });
      }
      return newSet;
    });
  };

  // Handle Individual User Toggle
  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) => {
      const newUsers = new Set(prev);
      if (newUsers.has(userId)) {
        newUsers.delete(userId);
      } else {
        newUsers.add(userId);
      }
      return Array.from(newUsers);
    });
  };

  const dateChangeHandler = (e, setter) => {
    const dateString = e.target.value;
    if (!dateString) {
      setter(undefined);
      return;
    }
    const [year, month, day] = dateString.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);

    if (newDate.getDay() === 0) {
      // Sunday
      toast.error("Sundays are not allowed. Please select another date.");
      e.target.value = "";
      setter(undefined);
      return;
    }

    const holiday = holidays.find((h) => h.date.startsWith(dateString));
    if (holiday) {
      toast.error(
        `Selected date is a holiday: ${holiday.name}. Please select another date.`,
      );
      e.target.value = "";
      setter(undefined);
      return;
    }
    setter(newDate);
  };

  // --- Handle Form Submission (Create) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    if (!isDependent && !isRecurrent && !taskEndDateOffset) {
      toast.error("Task end day is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!isDependent && !startDate) {
      toast.error("A Start Date is required for non-dependent tasks.");
      return;
    }
    if (isDependent && !parentTask) {
      toast.error("Please select a parent task");
      return;
    }
    if (isDependent && xValue.trim() === "") {
      toast.error("X Value is required for dependent tasks.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("assignedTo", JSON.stringify(selectedUsers));
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      // Keep for backward compatibility if needed, but selectedUsers covers it
      // if (soleSelectedDept)
      //   formData.append("departmentOfAssignToUser", soleSelectedDept);

      // Set date fields by default
      if (startDate) {
        console.log(startDate);
        formData.append("startDate", startDate);
      } else {
        const todayStr = new Date().toLocaleDateString("en-CA");
        formData.append("startDate", todayStr);
      }
      if (!isRecurrent && taskEndDateOffset) {
        formData.append("taskEndDays", taskEndDateOffset);
      }

      if (checklist.length > 0)
        formData.append("checklist", JSON.stringify(checklist));
      // if (attachmentFile) formData.append("attachmentFile", attachmentFile);
      if (attachmentFile) {
        attachmentFile.forEach((file) => {
          formData.append("attachmentFile", file);
        });
      }
      formData.append("isRecurrent", String(isRecurrent));

      if (isRecurrent) {
        if (recurrenceFrequency)
          formData.append(
            "frequency",
            frequencyMap[recurrenceFrequency] || recurrenceFrequency,
          );
        if (
          recurrenceFrequency === "weekly" &&
          weeklyRecurrenceDays.length > 0
        ) {
          formData.append("weekDays", JSON.stringify(weeklyRecurrenceDays));
        }
        if (recurrenceEndDate)
          formData.append("recurrenceEndDate", recurrenceEndDate);
      }

      formData.append("isDependent", String(isDependent));
      if (isDependent) {
        if (parentTask) formData.append("parentTask", parentTask);
        if (startTimeSetting)
          formData.append("startTimeSetting", startTimeSetting);
        if (frequencyType)
          formData.append(
            "isDependentFrequency",
            frequencyType === "days" ? "T+X in days" : "T-X in hours",
          );
        if (xValue !== "") formData.append("xValue", xValue);

        // EXPLICIT SAFEGUARD: For actual-to-planned, forcefully remove any date fields.
        if (startTimeSetting === "actual-to-planned") {
          formData.delete("startDate");
          // formData.delete("taskEndDays");
        }
      }

      const res = await api.post("/tasks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        setTitle("");
        setSelectedUsers([]);
        setOpenDepartments(new Set());
        setSelectedDepartments(new Set());
        setDescription("");
        setDate(null);
        setStartDate(null);
        setChecklist([]);
        setAttachmentFile([]);
        setAttachmentFileList([]);
        setIsRecurrent(false);
        setIsDependent(false);
        setParentTask("");
        setStartTimeSetting("planned-to-planned");
        setXValue("");
        setRecurrenceEndDate(null);
        setWeeklyRecurrenceDays([]);
        setDependentDueDate(null);
        setTaskEndDateOffset("");
        onTaskCreated(); // Callback to parent to refresh tasks
        toast.success(res.data.message || "Tasks assigned successfully!");
      }
    } catch (err) {
      console.error("Submission Error:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to create task";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="m-4 shadow-xl bg-white/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-500 group">
      <CardHeader className="border-b border-gray-200/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Delegate a New Task
            </CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsFormCollapsed(!isFormCollapsed)}
            className="h-8 w-8 text-gray-500 hover:bg-gray-100"
          >
            {isFormCollapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      {!isFormCollapsed && (
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Row 1: Title & Assignee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">
                  Task Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="hover:shadow-md transition-all duration-200"
                />
              </div>

              {/* --- ASSIGN TO (Multi-Select Dropdown) --- */}
              <div className="space-y-2 relative" ref={assignDropdownRef}>
                <Label>
                  Assign To <span className="text-red-500">*</span>
                </Label>
                <div
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
                >
                  <span
                    className={
                      selectedUsers.length === 0
                        ? "text-muted-foreground"
                        : "text-foreground font-medium"
                    }
                  >
                    {selectedUsers.length > 0
                      ? `${selectedUsers.length} User(s) Selected`
                      : "Select Departments & Users"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 opacity-50 transition-transform",
                      isAssignDropdownOpen ? "rotate-180" : "",
                    )}
                  />
                </div>

                {/* Dropdown Content */}
                {isAssignDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-xl animate-in fade-in-80 max-h-72 overflow-y-auto p-2">
                    {departments.length > 0 ? (
                      departments.map((dept) => {
                        // Filter Users for this specific department
                        const deptUsers = users.filter(
                          (u) =>
                            u.department &&
                            Array.isArray(u.department) &&
                            u.department.some((d) => d && d._id === dept._id),
                        );

                        if (deptUsers.length === 0)
                          return (
                            <div
                              key={dept._id}
                              className="mb-2 p-2 text-xs text-gray-400 border-b"
                            >
                              {dept.name} (No users)
                            </div>
                          );

                        return (
                          <div key={dept._id} className="mb-4">
                            {/* Department Header (Original Style): Checkbox + Name(count) + Chevron */}
                            <div className="flex items-center gap-2 p-2 bg-slate-100/80 rounded-md mb-1 font-semibold text-slate-700 hover:bg-slate-200/80 transition-colors">
                              <Checkbox
                                id={`dept-${dept._id}`}
                                checked={selectedDepartments.has(dept._id)}
                                onChange={(e) => handleDeptSelectAll(dept._id)}
                                className="border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
                              />
                              <div
                                className="flex-1 cursor-pointer select-none flex items-center justify-between text-sm hover:text-slate-800"
                                onClick={() => handleDeptExpand(dept._id)}
                              >
                                {dept.name}
                                <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full">
                                  {deptUsers.length}
                                </span>
                              </div>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 text-slate-500 transition-transform cursor-pointer hover:text-slate-600 flex-shrink-0",
                                  openDepartments.has(dept._id) && "rotate-180",
                                )}
                                onClick={() => handleDeptExpand(dept._id)}
                              />
                            </div>

                            {/* Users List - Show if dept expanded */}
                            {openDepartments.has(dept._id) && (
                              <div className="pl-6 space-y-1 border-l-2 border-slate-200 ml-2">
                                {deptUsers.map((u) => (
                                  <div
                                    key={u._id}
                                    className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded transition-colors group"
                                  >
                                    <Checkbox
                                      id={`user-${u._id}`}
                                      checked={selectedUsers.includes(u._id)}
                                      onChange={() => handleUserToggle(u._id)}
                                      className="h-4 w-4 border-slate-300 data-[state=checked]:bg-blue-500"
                                    />
                                    <Label
                                      htmlFor={`user-${u._id}`}
                                      className="cursor-pointer select-none text-sm text-gray-600 group-hover:text-gray-900 flex-1 flex items-center gap-2"
                                    >
                                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                        {u.name
                                          ? u.name.charAt(0).toUpperCase()
                                          : "?"}
                                      </div>
                                      {u.name || u.email}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-sm text-gray-500 text-center flex flex-col items-center">
                        <UsersIcon className="w-8 h-8 mb-2 opacity-20" />
                        No departments found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="space-y-2">
              <Label htmlFor="task-description">
                Task Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed description..."
                rows={3}
                className="hover:shadow-md transition-all duration-200 resize-none"
              />
            </div>

            {/* Checklist Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-700">
                  <ListTodo className="w-4 h-4 text-blue-500" /> Checklist
                  (Optional)
                </Label>
                <Badge
                  variant="secondary"
                  className="bg-white border shadow-sm"
                >
                  {checklist.length} {checklist.length === 1 ? "item" : "items"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Input
                  value={checklistItem}
                  onChange={(e) => setChecklistItem(e.target.value)}
                  placeholder="Add a sub-task or checklist item..."
                  className="bg-white shadow-sm focus-visible:ring-blue-500"
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addChecklistItem())
                  }
                />
                <Button
                  type="button"
                  onClick={addChecklistItem}
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {checklist.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 bg-white/50">
                    <ClipboardList className="w-6 h-6 mb-2 opacity-50" />
                    <p className="text-sm">No items yet. Add one above!</p>
                  </div>
                )}

                {checklist.map((item, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {item.text}
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeChecklistItem(index)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 3: Dependency Logic */}
            <div className="space-y-2 pt-2">
              <Label>Is this task dependent on another Task?</Label>
              <RadioGroup
                value={isDependent ? "yes" : "no"}
                onValueChange={(val) => {
                  const isDep = val === "yes";
                  setIsDependent(isDep);
                  if (isDep) {
                    setIsRecurrent(false); // Dependent tasks cannot be recurrent
                  }
                  if (!isDep) {
                    setParentTask("");
                    setStartTimeSetting(null);
                  }
                }}
                className="flex flex-col gap-2 pt-1"
              >
                <div className="flex gap-3 pt-2">
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <RadioGroupItem value="yes" id="r-yes" />
                    <Label
                      htmlFor="r-yes"
                      className="cursor-pointer font-normal"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <RadioGroupItem value="no" id="r-no" />
                    <Label
                      htmlFor="r-no"
                      className="cursor-pointer font-normal"
                    >
                      No
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Row 4: Conditional Fields */}
            {!isDependent ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label>
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    className="w-full h-10 hover:shadow-md transition-all duration-200"
                    format="DD MMM YYYY"
                    value={startDate ? dayjs(startDate) : null}
                    onChange={(date) => {
                      if (!date) return;

                      const selected = dayjs(date);
                      const selectedDate = selected.format("YYYY-MM-DD");

                      // 🟡 1. Check Holiday
                      const holiday = holidays.find(
                        (h) =>
                          dayjs(h.date).format("YYYY-MM-DD") === selectedDate,
                      );

                      if (holiday) {
                        toast.error(
                          `Selected date is a holiday: ${holiday.name}. Please select another date.`,
                        );
                        setStartDate(null);
                        return;
                      }

                      // 🟡 2. Check Working Day
                      const dayName = selected.format("dddd").toLowerCase();
                      // e.g. "monday"

                      if (!workingWeeks?.[dayName]) {
                        toast.error(
                          `Selected day (${dayName}) is not a working day. Please choose a valid day.`,
                        );
                        setStartDate(null);
                        return;
                      }

                      // ✅ Valid date
                      setStartDate(selectedDate);
                    }}
                    // disabledDate={(current) => {
                    //   const today = dayjs().startOf("day");
                    //   return current && current < today;
                    // }} // Disable past dates
                  />
                  {/* <Input
                  type="date"
                  value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => dateChangeHandler(e, setStartDate)}
                  className="hover:shadow-md transition-all duration-200"
                  // min={new Date().toLocaleDateString('en-CA')}
                /> */}
                </div>

                {/* How many days Task Ended */}
                <div className="space-y-2">
                  <Label className={isRecurrent ? "text-gray-400" : ""}>
                    How many days Task Ended{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    disabled={isRecurrent}
                    value={taskEndDateOffset}
                    onChange={(e) => setTaskEndDateOffset(e.target.value)}
                    placeholder="E.g., 1 for same day, 2 for next day"
                    className="hover:shadow-md transition-all duration-200"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Attachment (Optional)</Label>
                  {/* <Input
                    type="file"
                    onChange={(e) =>
                      setAttachmentFile(e.target.files?.[0] || null)
                    }
                    className="cursor-pointer"
                  /> */}
                  <AttachmentUpload
                    setFiles={setAttachmentFile}
                    fileList={attachmentFileList}
                    setFileList={setAttachmentFileList}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="space-y-2">
                  <Label>
                    Task on which it is dependent (Parent Task){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={parentTask}
                    onValueChange={(value) => {
                      setParentTask(value);
                      setParentTaskSearch(""); // Clear search on selection
                    }}
                  >
                    <SelectTrigger className="bg-white w-full text-left justify-between font-normal">
                      {(() => {
                        const selectedTask =
                          parentTask &&
                          allTasks.find((t) => (t._id || t.id) === parentTask);
                        if (selectedTask) {
                          return (
                            <span className="truncate block">
                              <span className="font-semibold">
                                {selectedTask.TaskId}
                              </span>
                              <span className="text-gray-600">
                                {" "}
                                - {selectedTask.title}
                              </span>
                            </span>
                          );
                        }
                        return (
                          <span className="text-gray-500">
                            Select parent task...
                          </span>
                        );
                      })()}
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 sticky top-0 bg-white z-10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by ID or title..."
                            value={parentTaskSearch}
                            onChange={(e) =>
                              setParentTaskSearch(e.target.value)
                            }
                            className="pl-9 bg-gray-50"
                          />
                        </div>
                      </div>
                      <div className="">
                        {filteredParentTasks.length > 0 ? (
                          filteredParentTasks.map((t) => (
                            <SelectItem
                              key={t._id || t.id}
                              value={t._id || t.id}
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm">
                                  {t.TaskId} - {t.title}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Due:{" "}
                                  {t.dueDate
                                    ? format(new Date(t.dueDate), "dd-MM-yyyy")
                                    : "N/A"}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-sm text-center text-gray-500">
                            No tasks found.
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Start Time Setting <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={startTimeSetting || ""}
                    onValueChange={setStartTimeSetting}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select logic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned-to-planned">
                        Planned to Planned
                      </SelectItem>
                      <SelectItem value="actual-to-planned">
                        Actual to Planned
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Frequency <span className="text-red-500">*</span>
                  </Label>{" "}
                  {/* Lag Type*/}
                  <Select
                    value={frequencyType}
                    onValueChange={setFrequencyType}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select Lag Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">T+X Days</SelectItem>
                      <SelectItem value="hours">T+X Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    X Value <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={xValue}
                    onChange={(e) => setXValue(e.target.value)}
                    placeholder="Enter value"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    How many days Task Ended{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={taskEndDateOffset}
                    onChange={(e) => setTaskEndDateOffset(e.target.value)}
                    placeholder="E.g., 1 for same day, 2 for next day"
                    className="hover:shadow-md transition-all duration-200 bg-white"
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Row 5: Recurrence Toggle */}
            <div className="flex flex-col gap-4 mt-2 border-t pt-4">
              {!isDependent && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurrence-check"
                    checked={isRecurrent}
                    onChange={(e) => {
                      setIsRecurrent(e.target.checked);
                      if (e.target.checked) {
                        setDate(null);
                      }
                    }}
                  />
                  <Label
                    htmlFor="recurrence-check"
                    className="flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Clock className="w-4 h-4 text-blue-600" /> Set as Recurring
                    Task
                  </Label>
                </div>
              )}

              {isRecurrent && !isDependent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>
                      Frequency <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={recurrenceFrequency}
                      onValueChange={(value) => {
                        setRecurrenceFrequency(value);
                        if (value !== "weekly") {
                          setWeeklyRecurrenceDays([]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="half-yearly">Half Yearly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      End Date
                    </Label>
                    <DatePicker
                      className="w-full h-10 hover:shadow-md transition-all duration-200"
                      format="DD MMM YYYY"
                      value={
                        recurrenceEndDate ? dayjs(recurrenceEndDate) : null
                      }
                      disabledDate={(current) => {
                        // ❌ disable past dates OR before startDate
                        if (!current) return false;

                        const today = dayjs().startOf("day");

                        if (startDate) {
                          return current.isBefore(
                            dayjs(startDate).startOf("day"),
                          );
                        }

                        return current.isBefore(today);
                      }}
                      onChange={(date) => {
                        if (!date) {
                          setRecurrenceEndDate(undefined);
                          return;
                        }

                        const selectedDate = date.startOf("day");

                        // 🔥 Validation: endDate >= startDate
                        if (
                          startDate &&
                          selectedDate.isBefore(dayjs(startDate).startOf("day"))
                        ) {
                          toast.error("End Date cannot be before Start Date");
                          setRecurrenceEndDate(undefined);
                          return;
                        }

                        // ✅ store in backend format
                        setRecurrenceEndDate(
                          selectedDate.format("DD MMM YYYY"),
                        );
                      }}
                    />
                  </div>

                  {recurrenceFrequency === "weekly" && (
                    <div className="md:col-span-2 space-y-2">
                      <Label>Select Days of the Week</Label>
                      <div className="flex flex-wrap gap-4 pt-2">
                        {[
                          "Sunday",
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                        ].map((day) => (
                          <div key={day} className="flex items-center gap-2">
                            <Checkbox
                              id={`day-${day}`}
                              checked={weeklyRecurrenceDays.includes(
                                day.toLowerCase(),
                              )}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const dayLowerCase = day.toLowerCase();
                                setWeeklyRecurrenceDays((prev) =>
                                  checked
                                    ? [...prev, dayLowerCase]
                                    : prev.filter((d) => d !== dayLowerCase),
                                );
                              }}
                            />
                            <Label
                              htmlFor={`day-${day}`}
                              className="font-normal cursor-pointer"
                            >
                              {day}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-4">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg w-full md:w-auto px-8"
              >
                {loading ? "Assigning..." : "Assign Task"}
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
};

export default CreateTaskForm;
