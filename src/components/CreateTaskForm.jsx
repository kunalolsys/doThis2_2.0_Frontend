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
import { DatePicker, Select as AntdSelect } from "antd";
import AttachmentUpload from "./attachmentsUpload.jsx";
import Cookies from "js-cookie";

const CreateTaskForm = ({
  users,
  departments,
  holidays,
  onTaskCreated,
  allTasks,
  workingWeeks,
}) => {
  const dispatch = useDispatch();
  const role = Cookies.get("role");

  // Form States
  const [date, setDate] = useState(); // Unused in final form logic, remove?
  const [startDate, setStartDate] = useState();
  const [taskEndDateOffset, setTaskEndDateOffset] = useState("1"); // New state for task end date offset
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
  const [assignmentRows, setAssignmentRows] = useState([
    {
      departmentId: "",
      users: [],
    },
  ]);
  const selectedUsers = assignmentRows.flatMap((r) => r.users || []);
  const addAssignmentRow = () => {
    const selectedUsers = assignmentRows.flatMap((r) => r.users || []);

    const availableUsers = users.filter((u) => !selectedUsers.includes(u._id));

    if (availableUsers.length === 0) {
      toast.error("No more users available to assign");
      return;
    }

    setAssignmentRows((prev) => [...prev, { departmentId: "", users: [] }]);
  };
  const isDepartmentFullySelected = (deptId) => {
    const deptUsers = users.filter(
      (u) =>
        Array.isArray(u.department) &&
        u.department.some((d) => d?._id === deptId),
    );

    const selectedUsers = assignmentRows
      .filter((r) => r.departmentId === deptId)
      .flatMap((r) => r.users || []);

    return deptUsers.length > 0 && selectedUsers.length >= deptUsers.length;
  };
  const removeAssignmentRow = (index) => {
    // Always keep one row
    if (assignmentRows.length === 1) return;

    setAssignmentRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDepartment = (index, departmentId) => {
    setAssignmentRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              departmentId,
              users: [], // reset users when department changes
            }
          : row,
      ),
    );
  };

  const updateUsers = (index, newUsers) => {
    setAssignmentRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              users: [...new Set(newUsers)],
            }
          : row,
      ),
    );
  };

  // --- Handle Form Submission (Create) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ─────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const hasUsers = assignmentRows.some((row) => row.users.length > 0);

    if (!hasUsers) {
      toast.error("Please select at least one user");
      return;
    }

    // validate each row
    for (const row of assignmentRows) {
      if (!row.departmentId) {
        toast.error("Please select department");
        return;
      }

      if (row.users.length === 0) {
        toast.error("Please select users");
        return;
      }
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
      // ─────────────────────────────────────────────
      // LOOP THROUGH EACH DEPARTMENT ROW
      // ─────────────────────────────────────────────
      for (const row of assignmentRows) {
        // skip invalid rows
        if (!row.departmentId || row.users.length === 0) {
          continue;
        }

        const formData = new FormData();

        // ─────────────────────────────────────────────
        // MAIN DATA
        // ─────────────────────────────────────────────
        formData.append("assignedTo", JSON.stringify(row.users));

        formData.append("departmentOfAssignToUser", row.departmentId);

        formData.append("title", title.trim());

        formData.append("description", description.trim());

        // ─────────────────────────────────────────────
        // START DATE
        // ─────────────────────────────────────────────
        if (startDate) {
          formData.append("startDate", startDate);
        } else {
          const todayStr = new Date().toLocaleDateString("en-CA");

          formData.append("startDate", todayStr);
        }

        // ─────────────────────────────────────────────
        // TASK END DAYS
        // ─────────────────────────────────────────────
        if (!isRecurrent && taskEndDateOffset) {
          formData.append("taskEndDays", taskEndDateOffset);
        }

        // ─────────────────────────────────────────────
        // CHECKLIST
        // ─────────────────────────────────────────────
        if (checklist.length > 0) {
          formData.append("checklist", JSON.stringify(checklist));
        }

        // ─────────────────────────────────────────────
        // ATTACHMENTS
        // ─────────────────────────────────────────────
        if (attachmentFile && attachmentFile.length > 0) {
          attachmentFile.forEach((file) => {
            formData.append("attachmentFile", file);
          });
        }

        // ─────────────────────────────────────────────
        // RECURRENT FLAGS
        // ─────────────────────────────────────────────
        formData.append("isRecurrent", String(isRecurrent));

        if (isRecurrent) {
          if (recurrenceFrequency) {
            formData.append(
              "frequency",
              frequencyMap[recurrenceFrequency] || recurrenceFrequency,
            );
          }

          if (
            recurrenceFrequency === "weekly" &&
            weeklyRecurrenceDays.length > 0
          ) {
            formData.append("weekDays", JSON.stringify(weeklyRecurrenceDays));
          }

          if (recurrenceEndDate) {
            formData.append("recurrenceEndDate", recurrenceEndDate);
          }
        }

        // ─────────────────────────────────────────────
        // DEPENDENCY
        // ─────────────────────────────────────────────
        formData.append("isDependent", String(isDependent));

        if (isDependent) {
          if (parentTask) {
            formData.append("parentTask", parentTask);
          }

          if (startTimeSetting) {
            formData.append("startTimeSetting", startTimeSetting);
          }

          if (frequencyType) {
            formData.append(
              "isDependentFrequency",
              frequencyType === "days" ? "T+X in days" : "T-X in hours",
            );
          }

          if (xValue !== "") {
            formData.append("xValue", xValue);
          }

          // IMPORTANT
          if (startTimeSetting === "actual-to-planned") {
            formData.delete("startDate");
          }
        }

        // ─────────────────────────────────────────────
        // API CALL
        // ─────────────────────────────────────────────
        await api.post("/tasks", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // ─────────────────────────────────────────────
      // RESET FORM
      // ─────────────────────────────────────────────
      setTitle("");

      setAssignmentRows([
        {
          departmentId: "",
          users: [],
        },
      ]);

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

      setTaskEndDateOffset("1");

      onTaskCreated();

      toast.success("Tasks assigned successfully!");
    } catch (err) {
      console.error("Submission Error:", err);

      const msg =
        err.response?.data?.message || err.message || "Failed to create task";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedDeptIds = Array.from(selectedDepartments);

  // 🔥 Build user → departments map
  const userMap = new Map();

  users.forEach((u) => {
    const userDeptIds = u.department?.map((d) => String(d._id)) || [];

    const matchedDepts = userDeptIds.filter((id) =>
      selectedDeptIds.includes(id),
    );

    if (matchedDepts.length > 0) {
      if (!userMap.has(u._id)) {
        userMap.set(u._id, {
          ...u,
          deptNames: [],
        });
      }

      matchedDepts.forEach((deptId) => {
        const deptName = departments.find(
          (d) => String(d._id) === deptId,
        )?.name;

        if (deptName) {
          userMap.get(u._id).deptNames.push(deptName);
        }
      });
    }
  });

  return (
    <Card className="m-4 shadow-xl bg-white/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-500 group">
      <CardHeader className="border-b border-gray-200/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 tracking-tight">
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
            <div className="space-y-4">
              {/* Task Title */}
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

              {/* Dynamic Department/User Rows */}
              {assignmentRows.map((row, index) => {
                const filteredUsers = users.filter((u) => {
                  const inDepartment =
                    Array.isArray(u.department) &&
                    u.department.some((d) => d?._id === row.departmentId);

                  const alreadySelectedElsewhere =
                    selectedUsers.includes(u._id) && !row.users.includes(u._id);

                  return inDepartment && !alreadySelectedElsewhere;
                });
                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border rounded-xl p-4 bg-slate-50"
                  >
                    {/* Department */}
                    <div className="md:col-span-4 space-y-2">
                      <Label>
                        Department <span className="text-red-500">*</span>
                      </Label>

                      <AntdSelect
                        showSearch
                        placeholder="Select Department"
                        value={row.departmentId || undefined}
                        onChange={(value) => updateDepartment(index, value)}
                        style={{ width: "100%", minHeight: 38 }}
                        optionFilterProp="label"
                        options={departments.map((d) => ({
                          value: d._id,
                          label: d.name,
                          disabled: isDepartmentFullySelected(d._id), // ✅ ONLY ADD THIS
                        }))}
                      />
                    </div>

                    {/* Users */}
                    <div className="md:col-span-6 space-y-2">
                      <Label>
                        Users <span className="text-red-500">*</span>
                      </Label>

                      <AntdSelect
                        mode="multiple"
                        showSearch
                        placeholder={`Select Users (${filteredUsers.length})`}
                        value={row.users}
                        onChange={(values) => updateUsers(index, values)}
                        disabled={!row.departmentId}
                        style={{ width: "100%", minHeight: 38 }}
                        optionFilterProp="label"
                        options={filteredUsers.map((u) => ({
                          value: u._id,
                          label: `${u.name || u.email}`,
                        }))}
                      />
                    </div>

                    {/* Delete Button */}
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                        disabled={assignmentRows.length === 1}
                        onClick={() => removeAssignmentRow(index)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Add Row Button */}
              {role !== "Member" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAssignmentRow}
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Department{" "}
                </Button>
              )}
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
                    disabledDate={(current) => {
                      const today = dayjs().startOf("day");
                      return current && current < today;
                    }} // Disable past dates
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
                    {!isRecurrent && <span className="text-red-500">*</span>}
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
                    type="text"
                    inputMode="numeric"
                    value={xValue}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");

                      if (value === "" || Number(value) > 0) {
                        setXValue(value);
                      }
                    }}
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
                    type="text"
                    inputMode="numeric"
                    value={taskEndDateOffset}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");

                      if (value === "" || Number(value) >= 1) {
                        setTaskEndDateOffset(value);
                      }
                    }}
                    placeholder="E.g., 1 for same day, 2 for next day"
                    className="hover:shadow-md transition-all duration-200 bg-white"
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
                        <SelectItem value="fortnightly">Fortnightly</SelectItem>
                        <SelectItem value="half-yearly">Half Yearly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
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
