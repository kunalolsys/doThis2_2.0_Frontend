import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  FilePenLine,
  Trash2,
  Download,
  UploadCloud,
  FileText,
  ListChecks,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import * as XLSX from "xlsx";
import Papa from "papaparse";

import {
  fetchDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  exportDepts,
} from "../../redux/slices/department/departmentSlice";
import {
  fetchHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  exportHolidaysRecord,
} from "../../redux/slices/holiday/holidaySlice";
import {
  fetchWorkingWeek,
  updateWorkingWeek,
} from "../../redux/slices/workingWeek/workingWeekSlice";
import {
  fetchScheduleHolidayTask,
  upsertScheduleHolidayTask,
} from "../../redux/slices/scheduleHolidayTask/scheduleHolidayTaskSlice";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import WorkingWeekCheckbox from "../../components/ui/WorkingWeekCheckbox";
import { useDebounce } from "../../lib/debounce";

const initialWeekConfig = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
};

const DepartmentCalender = () => {
  const dispatch = useDispatch();
  const {
    departments,
    pagination: departmentPagination,
    status: deptStatus,
    error: deptError,
  } = useSelector((state) => state.departments);
  const {
    holidays,
    pagination: holidayPagination,
    status: holidayStatus,
    error: holidayError,
  } = useSelector((state) => state.holidays);
  // Provide a default empty object to prevent crashing if the slice is not in the store
  const {
    workingWeek: reduxWorkingWeek,
    status: workingWeekStatus,
    error: workingWeekError,
  } = useSelector((state) => state.workingWeek) || {};
  const {
    task: scheduleHolidayTask,
    status: scheduleHolidayTaskStatus,
    error: scheduleHolidayTaskError,
  } = useSelector((state) => state.scheduleHolidayTask);
  const [workingWeek, setWorkingWeek] = useState(initialWeekConfig);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [editingDepartment, setEditingDepartment] = useState(null); // null for add, object for edit

  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayDescription, setHolidayDescription] = useState("");
  const [editingHoliday, setEditingHoliday] = useState(null); // null for add, object for edit
  const [loading, setLoading] = useState(false);
  const [holidayAction, setHolidayAction] = useState("BEFORE");

  // Department bulk upload state
  const [isDeptBulkUploadOpen, setIsDeptBulkUploadOpen] = useState(false);
  const [deptUploadFile, setDeptUploadFile] = useState(null);
  const [deptImportResult, setDeptImportResult] = useState(null);

  // Holiday bulk upload state
  const [isHolidayBulkUploadOpen, setIsHolidayBulkUploadOpen] = useState(false);
  const [holidayUploadFile, setHolidayUploadFile] = useState(null);
  const [holidayImportResult, setHolidayImportResult] = useState(null);

  // Pagination and filter states for Departments
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
  const [departmentPage, setDepartmentPage] = useState(1);
  const [departmentLimit, setDepartmentLimit] = useState(5);

  // Pagination and filter states for Holidays
  const [holidaySearchTerm, setHolidaySearchTerm] = useState("");
  const [holidayPage, setHolidayPage] = useState(1);
  const [holidayLimit, setHolidayLimit] = useState(5);
  const debouncedDepartmentSearchTerm = useDebounce(departmentSearchTerm, 500);
  const debouncedHolidaySearchTerm = useDebounce(holidaySearchTerm, 500);

  useEffect(() => {
    dispatch(
      fetchDepartments({
        departmentPage,
        departmentLimit,
        departmentSearchTerm: debouncedDepartmentSearchTerm,
      }),
    );
  }, [departmentPage, departmentLimit, debouncedDepartmentSearchTerm]);
  useEffect(() => {
    dispatch(
      fetchHolidays({
        holidayPage,
        holidayLimit,
        holidaySearchTerm: debouncedHolidaySearchTerm,
      }),
    );
  }, [holidayPage, holidayLimit, debouncedHolidaySearchTerm]);
  useEffect(() => {
    dispatch(fetchScheduleHolidayTask());
    dispatch(fetchWorkingWeek());
  }, []);

  useEffect(() => {
    if (reduxWorkingWeek && reduxWorkingWeek.workingDays) {
      setWorkingWeek(reduxWorkingWeek.workingDays);
    }
  }, [reduxWorkingWeek]);

  useEffect(() => {
    if (scheduleHolidayTask && scheduleHolidayTask.holidayAction) {
      setHolidayAction(scheduleHolidayTask.holidayAction);
    }
  }, [scheduleHolidayTask]);

  useEffect(() => {
    if (deptStatus === "failed") {
      toast.error(deptError || "Failed to load departments.");
    }
    if (holidayStatus === "failed") {
      toast.error(holidayError || "Failed to load holidays.");
    }
    if (workingWeekStatus === "failed") {
      toast.error(
        workingWeekError || "Failed to load working week configuration.",
      );
    }
    if (scheduleHolidayTaskStatus === "failed") {
      toast.error(
        scheduleHolidayTaskError ||
          "Failed to load schedule holiday task configuration.",
      );
    }
  }, [
    deptStatus,
    deptError,
    holidayStatus,
    holidayError,
    workingWeekStatus,
    workingWeekError,
    scheduleHolidayTaskStatus,
    scheduleHolidayTaskError,
  ]);

  // Memoized logic for Departments
  // const filteredDepartments = useMemo(() => {
  //   return departments.filter((dept) =>
  //     dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase()),
  //   );
  // }, [departments, departmentSearchTerm]);

  // const paginatedDepartments = useMemo(() => {
  //   const startIndex = (departmentPage - 1) * departmentLimit;
  //   return filteredDepartments.slice(startIndex, startIndex + departmentLimit);
  // }, [filteredDepartments, departmentPage, departmentLimit]);

  const totalDepartmentPages = departmentPagination
    ? departmentPagination.totalPages || 1
    : 1;

  // Memoized logic for Holidays
  // const filteredHolidays = useMemo(() => {
  //   return holidays.filter((holiday) =>
  //     holiday.name.toLowerCase().includes(holidaySearchTerm.toLowerCase()),
  //   );
  // }, [holidays, holidaySearchTerm]);

  // const paginatedHolidays = useMemo(() => {
  //   const startIndex = (holidayPage - 1) * holidayLimit;
  //   return filteredHolidays.slice(startIndex, startIndex + holidayLimit);
  // }, [filteredHolidays, holidayPage, holidayLimit]);

  const totalHolidayPages = holidayPagination
    ? holidayPagination.totalPages || 1
    : 1;

  // Helper function to format dates as DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const formatDate2_0 = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", {
      month: "short",
    });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Department export
  const exportDepartments = async (format) => {
    const exportData = await dispatch(
      exportDepts({
        departmentSearchTerm: debouncedDepartmentSearchTerm,
      }),
    ).unwrap();
    if (!exportData || exportData.length === 0) {
      toast.error("No departments to export");
      return;
    }
    const rows = exportData.map((dept, idx) => ({
      "Sr. No.": idx + 1,
      Name: dept.name,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Departments");
    XLSX.writeFile(wb, `departments_export_${Date.now()}.${format}`);
    toast.success(`Departments exported as ${format.toUpperCase()}`);
  };

  // Holiday export
  const exportHolidays = async (format) => {
    const exportData = await dispatch(
      exportHolidaysRecord({ holidaySearchTerm: debouncedHolidaySearchTerm }),
    ).unwrap();
    if (!exportData || exportData.length === 0) {
      toast.error("No holidays to export");
      return;
    }
    const rows = exportData.map((holiday, idx) => ({
      "Sr. No.": idx + 1,
      Date: formatDate(holiday.date),
      "Holiday Name": holiday.name,
      Description: holiday.description || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Holidays");
    XLSX.writeFile(wb, `holidays_export_${Date.now()}.${format}`);
    toast.success(`Holidays exported as ${format.toUpperCase()}`);
  };

  // Department import handlers
  const handleDownloadDeptTemplate = () => {
    const headers = ["Name"];
    const demoRow = ["Human Resources"]; // Example department
    const ws = XLSX.utils.aoa_to_sheet([headers, demoRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Departments Template");
    XLSX.writeFile(wb, "department_upload_template.csv");
    toast.success("Department template downloaded");
  };

  const handleDeptFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setDeptUploadFile(file);
      toast.info(`File selected: ${file.name}`);
    } else {
      toast.error("Please select a valid CSV file.");
      setDeptUploadFile(null);
    }
  };

  const handleDeptImport = async () => {
    if (!deptUploadFile) {
      toast.error("Please select a file to import.");
      return;
    }
    setDeptImportResult(null);
    setLoading(true);
    const promise = new Promise((resolve, reject) => {
      Papa.parse(deptUploadFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: async (results) => {
          try {
            const rows = results.data;
            const validDepts = [];
            const errorRows = [];
            const existingDeptNames = new Set(
              departments.map((d) => d.name.toLowerCase()),
            );

            for (const row of rows) {
              const deptName = row.Name?.trim();
              if (!deptName) {
                errorRows.push({
                  ...row,
                  "Error Reason": "Department name is missing.",
                });
                continue;
              }
              if (existingDeptNames.has(deptName.toLowerCase())) {
                errorRows.push({
                  ...row,
                  "Error Reason": `Department '${deptName}' already exists.`,
                });
                continue;
              }
              validDepts.push({ name: deptName });
              existingDeptNames.add(deptName.toLowerCase()); // Avoid duplicates within the same file
            }

            if (validDepts.length > 0) {
              for (const deptData of validDepts) {
                await dispatch(addDepartment(deptData)).unwrap();
              }
            }
            resolve({ validCount: validDepts.length, errorRows });
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => reject(err),
      });
    });

    toast.promise(promise, {
      loading: "Importing departments...",
      success: (result) => {
        setDeptImportResult(result);
        setLoading(false);
        dispatch(
          fetchDepartments({
            departmentPage,
            departmentLimit,
            departmentSearchTerm: debouncedDepartmentSearchTerm,
          }),
        );
        return `${result.validCount} department(s) imported.`;
      },
      error: (err) => {
        setLoading(false);
        return `Import failed: ${err.message || "An unknown error occurred."}`;
      },
    });
  };

  const handleDownloadDeptErrorFile = () => {
    if (
      !deptImportResult ||
      !deptImportResult.errorRows ||
      deptImportResult.errorRows.length === 0
    )
      return;

    const headers = [...Object.keys(deptImportResult.errorRows[0])];
    const ws = XLSX.utils.json_to_sheet(deptImportResult.errorRows, {
      header: headers,
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Department Import Errors");
    XLSX.writeFile(wb, "department_import_errors.csv");
    toast.success("Error report downloaded.");
  };

  const handleDownloadHolidayErrorFile = () => {
    if (
      !holidayImportResult ||
      !holidayImportResult.errorRows ||
      holidayImportResult.errorRows.length === 0
    )
      return;

    const headers = [...Object.keys(holidayImportResult.errorRows[0])];
    const ws = XLSX.utils.json_to_sheet(holidayImportResult.errorRows, {
      header: headers,
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Holiday Import Errors");
    XLSX.writeFile(wb, "holiday_import_errors.csv");
    toast.success("Error report downloaded.");
  };

  // Holiday import handlers
  const handleDownloadHolidayTemplate = () => {
    const headers = [
      "Date (DD-MM-YYYY or DD/MM/YYYY)",
      "Holiday Name",
      "Description",
    ];
    const demoRow = ["01-01-2024", "New Year's Day", "First day of the year"];
    const ws = XLSX.utils.aoa_to_sheet([headers, demoRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Holidays Template");
    XLSX.writeFile(wb, "holiday_upload_template.csv");
    toast.success("Holiday template downloaded");
  };

  const handleHolidayFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setHolidayUploadFile(file);
      toast.info(`File selected: ${file.name}`);
    } else {
      toast.error("Please select a valid CSV file.");
      setHolidayUploadFile(null);
    }
  };

  const handleHolidayImport = async () => {
    if (!holidayUploadFile) {
      toast.error("Please select a file to import.");
      return;
    }
    setHolidayImportResult(null);
    setLoading(true);
    const promise = new Promise((resolve, reject) => {
      Papa.parse(holidayUploadFile, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: async (results) => {
          try {
            const rows = results.data;
            if (rows.length === 0) {
              return resolve({ validCount: 0, errorRows: [] });
            }

            // Dynamically get the actual header names from the parsed file
            const headerMap = {};
            const parsedHeaders = Object.keys(rows[0]);
            headerMap.name = parsedHeaders.find((h) =>
              h.toLowerCase().includes("holiday name"),
            );
            headerMap.date = parsedHeaders.find((h) =>
              h.toLowerCase().includes("date"),
            );
            headerMap.description = parsedHeaders.find((h) =>
              h.toLowerCase().includes("description"),
            );

            const validHolidays = [];
            const errorRows = [];

            for (const row of rows) {
              const holidayName = row[headerMap.name]?.toString().trim();
              const holidayDateStr = row[headerMap.date]?.toString().trim();

              if (!holidayName || !holidayDateStr) {
                errorRows.push({
                  ...row,
                  "Error Reason": "Holiday Name and Date are required.",
                });
                continue;
              }

              const parts = holidayDateStr.split(/[-/]/);
              if (parts.length !== 3) {
                errorRows.push({
                  ...row,
                  "Error Reason": `Invalid date format: ${holidayDateStr}. Use DD-MM-YYYY or DD/MM/YYYY.`,
                });
                continue;
              }
              const [day, month, year] = parts;
              const isoDate = `${year}-${month}-${day}`;
              if (isNaN(new Date(isoDate).getTime())) {
                errorRows.push({
                  ...row,
                  "Error Reason": `Invalid date: ${holidayDateStr}.`,
                });
                continue;
              }

              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (new Date(isoDate) < today) {
                errorRows.push({
                  ...row,
                  "Error Reason": `Cannot import a holiday for a past date: ${holidayDateStr}.`,
                });
                continue;
              }

              validHolidays.push({
                name: holidayName,
                date: isoDate,
                description: row.Description?.trim() || "",
              });
            }

            if (validHolidays.length > 0) {
              for (const holidayData of validHolidays) {
                await dispatch(createHoliday(holidayData)).unwrap();
              }
            }
            resolve({ validCount: validHolidays.length, errorRows });
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => reject(err),
      });
    });

    toast.promise(promise, {
      loading: "Importing holidays...",
      success: (result) => {
        setHolidayImportResult(result);
        setLoading(false);
        dispatch(
          fetchHolidays({
            holidayPage,
            holidayLimit,
            holidaySearchTerm: debouncedHolidaySearchTerm,
          }),
        );
        return `${result.validCount} holiday(s) imported.`;
      },
      error: (err) => {
        setLoading(false);
        return `Import failed: ${err.message || "An unknown error occurred."}`;
      },
    });
  };

  const handleWeekChange = (day) => {
    setWorkingWeek((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  const handleSubmitWorkingWeek = async () => {
    try {
      await dispatch(updateWorkingWeek({ workingDays: workingWeek })).unwrap();
      toast.success("Working week updated successfully!");
    } catch (err) {
      // err from unwrap is the rejected value, which might be an object with a message property
      const errorMessage = err.message || "Failed to update working week.";
      toast.error(errorMessage);
    }
  };

  const handleAddClick = () => {
    setEditingDepartment(null);
    setDepartmentName("");
    setIsAddEditDialogOpen(true);
  };

  const handleEditClick = (department) => {
    setEditingDepartment(department);
    setDepartmentName(department.name);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmitDepartment = async () => {
    if (departmentName.trim() === "") {
      toast.error("Department name cannot be empty.");
      return;
    }

    try {
      if (editingDepartment) {
        await dispatch(
          updateDepartment({
            _id: editingDepartment._id,
            name: departmentName,
          }),
        ).unwrap();
        toast.success("Department updated successfully!");
      } else {
        await dispatch(addDepartment({ name: departmentName })).unwrap();
        toast.success("Department added successfully!");
      }
      setDepartmentName("");
      setEditingDepartment(null);
      setIsAddEditDialogOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save department.");
    }
  };

  const handleAddHolidayClick = () => {
    setEditingHoliday(null);
    setHolidayName("");
    setHolidayDate("");
    setHolidayDescription("");
    setIsHolidayDialogOpen(true);
  };

  const handleEditHolidayClick = (holiday) => {
    setEditingHoliday(holiday);
    setHolidayName(holiday.name);
    setHolidayDate(new Date(holiday.date).toISOString().split("T")[0]);
    setHolidayDescription(holiday.description || "");
    setIsHolidayDialogOpen(true);
  };

  const handleSubmitHoliday = async () => {
    if (holidayName.trim() === "") {
      toast.error("Holiday name cannot be empty.");
      return;
    }
    if (!holidayDate) {
      toast.error("Holiday date is required.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of today
    const selectedDate = new Date(holidayDate);
    // Adjust for timezone offset to compare dates correctly
    const localSelectedDate = new Date(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate(),
    );

    if (localSelectedDate < today) {
      toast.error("Cannot add a holiday for a past date.");
      return;
    }

    try {
      const holidayData = {
        name: holidayName,
        date: holidayDate,
        description: holidayDescription,
      };

      if (editingHoliday) {
        await dispatch(
          updateHoliday({ id: editingHoliday._id, holidayData }),
        ).unwrap();
        toast.success("Holiday updated successfully!");
      } else {
        await dispatch(createHoliday(holidayData)).unwrap();
        await dispatch(
          fetchHolidays({
            holidayPage,
            holidayLimit,
            holidaySearchTerm: debouncedHolidaySearchTerm,
          }),
        );
        toast.success("Holiday added successfully!");
      }
      setHolidayName("");
      setHolidayDate("");
      setHolidayDescription("");
      setEditingHoliday(null);
      setIsHolidayDialogOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save holiday.");
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) {
      return;
    }

    try {
      await dispatch(deleteHoliday(id)).unwrap();
      toast.success("Holiday deleted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to delete holiday.");
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }

    try {
      await dispatch(deleteDepartment(id)).unwrap();
      toast.success("Department deleted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to delete department.");
    }
  };

  const handleSaveScheduleHolidayTask = async () => {
    try {
      await dispatch(upsertScheduleHolidayTask({ holidayAction })).unwrap();
      toast.success("Schedule holiday task updated successfully!");
    } catch (err) {
      const errorMessage =
        err.message || "Failed to update schedule holiday task.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6 m-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-semibold">Departments</CardTitle>
            <div className="flex gap-2">
              <Dialog
                open={isAddEditDialogOpen}
                onOpenChange={setIsAddEditDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button onClick={handleAddClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDepartment ? "Edit Department" : "Add Department"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="items-center gap-4">
                      <Label htmlFor="name" className="text-right pb-3">
                        Department Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Department Name"
                        className="col-span-3"
                        value={departmentName}
                        onChange={(e) => setDepartmentName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleSubmitDepartment}
                      disabled={deptStatus === "loading"}
                      className="cursor-pointer"
                    >
                      {deptStatus === "loading" ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportDepartments("csv")}>
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportDepartments("xlsx")}>
                    XLSX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => setIsDeptBulkUploadOpen(true)}
              >
                <UploadCloud className="mr-2 h-4 w-4" /> Bulk Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <Input
              placeholder="Search by department name..."
              value={departmentSearchTerm}
              onChange={(e) => setDepartmentSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {deptStatus === "loading" && departments.length === 0 ? (
            <p>Loading departments...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DEPARTMENT</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept._id}>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(dept)}
                      >
                        <FilePenLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDepartment(dept._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {departments.length > 0 && (
          <CardFooter className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 border-t pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={departmentLimit}
                onChange={(e) => {
                  setDepartmentLimit(Number(e.target.value));
                  setDepartmentPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
                disabled={deptStatus === "loading"}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setDepartmentPage((p) => Math.max(1, p - 1))}
                disabled={departmentPage === 1 || deptStatus === "loading"}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700 font-medium">
                Page <span className="font-bold">{departmentPage}</span> of{" "}
                <span className="font-bold">{totalDepartmentPages || 1}</span>
              </span>
              <Button
                onClick={() =>
                  setDepartmentPage((p) =>
                    Math.min(totalDepartmentPages, p + 1),
                  )
                }
                disabled={
                  departmentPage === totalDepartmentPages ||
                  deptStatus === "loading"
                }
                variant="outline"
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* --- Holidays Card --- */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-semibold">Holidays</CardTitle>
            <div className="flex gap-2">
              <Dialog
                open={isHolidayDialogOpen}
                onOpenChange={setIsHolidayDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button onClick={handleAddHolidayClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Holiday
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingHoliday ? "Edit Holiday" : "Add Holiday"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="items-center gap-4">
                      <Label htmlFor="holiday-name" className="text-right pb-3">
                        Holiday Name
                      </Label>
                      <Input
                        id="holiday-name"
                        placeholder="Holiday Name"
                        className="col-span-3"
                        value={holidayName}
                        onChange={(e) => setHolidayName(e.target.value)}
                      />
                    </div>
                    <div className="items-center gap-4">
                      <Label htmlFor="holiday-date" className="text-right pb-3">
                        Date
                      </Label>
                      <Input
                        id="holiday-date"
                        type="date"
                        className="col-span-3"
                        value={holidayDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setHolidayDate(e.target.value)}
                      />
                    </div>
                    <div className="items-center gap-4">
                      <Label
                        htmlFor="holiday-description"
                        className="text-right pb-3"
                      >
                        Description (Optional)
                      </Label>
                      <Input
                        id="holiday-description"
                        placeholder="Description"
                        className="col-span-3"
                        value={holidayDescription}
                        onChange={(e) => setHolidayDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleSubmitHoliday}
                      disabled={holidayStatus === "loading"}
                      className="cursor-pointer"
                    >
                      {holidayStatus === "loading" ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportHolidays("csv")}>
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportHolidays("xlsx")}>
                    XLSX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => setIsHolidayBulkUploadOpen(true)}
              >
                <UploadCloud className="mr-2 h-4 w-4" /> Bulk Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <Input
              placeholder="Search by holiday name..."
              value={holidaySearchTerm}
              onChange={(e) => setHolidaySearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {holidayStatus === "loading" && holidays.length === 0 ? (
            <p>Loading holidays...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>HOLIDAY NAME</TableHead>
                  <TableHead>DESCRIPTION</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday._id}>
                    <TableCell>{formatDate2_0(holiday.date)}</TableCell>
                    <TableCell>{holiday.name}</TableCell>
                    <TableCell>{holiday.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditHolidayClick(holiday)}
                      >
                        <FilePenLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteHoliday(holiday._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {holidays.length > 0 && (
          <CardFooter className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 border-t pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={holidayLimit}
                onChange={(e) => {
                  setHolidayLimit(Number(e.target.value));
                  setHolidayPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
                disabled={holidayStatus === "loading"}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setHolidayPage((p) => Math.max(1, p - 1))}
                disabled={holidayPage === 1 || holidayStatus === "loading"}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700 font-medium">
                Page <span className="font-bold">{holidayPage}</span> of{" "}
                <span className="font-bold">{totalHolidayPages || 1}</span>
              </span>
              <Button
                onClick={() =>
                  setHolidayPage((p) => Math.min(totalHolidayPages, p + 1))
                }
                disabled={
                  holidayPage === totalHolidayPages ||
                  holidayStatus === "loading"
                }
                variant="outline"
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* --- Department Bulk Upload Dialog --- */}
      <Dialog
        open={isDeptBulkUploadOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeptUploadFile(null);
            setDeptImportResult(null);
          }
          setIsDeptBulkUploadOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-blue-600" />
              Bulk Import Departments
            </DialogTitle>
          </DialogHeader>
          {!deptImportResult ? (
            <div className="grid grid-cols-1 gap-6 py-4">
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-gray-500" />
                  Required Columns
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>
                    <code className="bg-gray-200 px-1 rounded">Name</code>{" "}
                    (Text, must be unique)
                  </li>
                </ul>
                <Button
                  variant="outline"
                  onClick={handleDownloadDeptTemplate}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download CSV Template
                </Button>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <label
                  htmlFor="dept-file-upload"
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                >
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm font-semibold text-blue-600">
                    Click to upload
                  </span>
                  <p className="text-xs text-gray-500 mt-2">CSV files only</p>
                  <Input
                    id="dept-file-upload"
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleDeptFileChange}
                  />
                </label>
                {deptUploadFile && (
                  <p className="mt-2 text-sm text-green-600">
                    Selected: {deptUploadFile.name}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <h3 className="text-lg font-semibold mb-4">Import Complete</h3>
              <div className="flex justify-center gap-8">
                <div className="text-green-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {deptImportResult.validCount}
                  </p>
                  <p>Departments Imported</p>
                </div>
                <div className="text-red-600">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {deptImportResult.errorRows.length}
                  </p>
                  <p>Rows with Errors</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {deptImportResult ? (
              <>
                {deptImportResult.errorRows.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleDownloadDeptErrorFile}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Error Report
                  </Button>
                )}
                <Button onClick={() => setIsDeptBulkUploadOpen(false)}>
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDeptBulkUploadOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeptImport}
                  disabled={!deptUploadFile || loading}
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {loading ? "Importing..." : "Import Departments"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Holiday Bulk Upload Dialog --- */}
      <Dialog
        open={isHolidayBulkUploadOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setHolidayUploadFile(null);
            setHolidayImportResult(null);
          }
          setIsHolidayBulkUploadOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-blue-600" />
              Bulk Import Holidays
            </DialogTitle>
          </DialogHeader>
          {!holidayImportResult ? (
            <div className="grid grid-cols-1 gap-6 py-4">
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-gray-500" />
                  Required Columns
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>
                    <code className="bg-gray-200 px-1 rounded">
                      Date (DD-MM-YYYY or DD/MM/YYYY)
                    </code>
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">
                      Holiday Name
                    </code>
                  </li>
                  <li>
                    <code className="bg-gray-200 px-1 rounded">
                      Description
                    </code>{" "}
                    (Optional)
                  </li>
                </ul>
                <Button
                  variant="outline"
                  onClick={handleDownloadHolidayTemplate}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download CSV Template
                </Button>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <label
                  htmlFor="holiday-file-upload"
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                >
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm font-semibold text-blue-600">
                    Click to upload
                  </span>
                  <p className="text-xs text-gray-500 mt-2">CSV files only</p>
                  <Input
                    id="holiday-file-upload"
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleHolidayFileChange}
                  />
                </label>
                {holidayUploadFile && (
                  <p className="mt-2 text-sm text-green-600">
                    Selected: {holidayUploadFile.name}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <h3 className="text-lg font-semibold mb-4">Import Complete</h3>
              <div className="flex justify-center gap-8">
                <div className="text-green-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {holidayImportResult.validCount}
                  </p>
                  <p>Holidays Imported</p>
                </div>
                <div className="text-red-600">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {holidayImportResult.errorRows.length}
                  </p>
                  <p>Rows with Errors</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {holidayImportResult ? (
              <>
                {holidayImportResult.errorRows.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleDownloadHolidayErrorFile}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Error Report
                  </Button>
                )}
                <Button onClick={() => setIsHolidayBulkUploadOpen(false)}>
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsHolidayBulkUploadOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleHolidayImport}
                  disabled={!holidayUploadFile || loading}
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {loading ? "Importing..." : "Import Holidays"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Working Week Card --- */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Working Week</CardTitle>
          <CardDescription>
            Select the working days in a week for all departments.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.keys(workingWeek).map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={day}
                checked={workingWeek[day]}
                onCheckedChange={() => handleWeekChange(day)}
              />
              <Label htmlFor={day} className="capitalize">
                {day}
              </Label>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmitWorkingWeek}
            disabled={workingWeekStatus === "loading"}
            className="cursor-pointer"
          >
            {workingWeekStatus === "loading" ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>

      {/* --- Schedule Holiday Task Card --- */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Schedule Holiday Task
          </CardTitle>
          <CardDescription>
            Choose whether the holiday task should be scheduled before or after
            the holiday.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={holidayAction} onValueChange={setHolidayAction}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="BEFORE" id="before" />
              <Label htmlFor="before">Before Holiday</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AFTER" id="after" />
              <Label htmlFor="after">After Holiday</Label>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveScheduleHolidayTask}
            disabled={scheduleHolidayTaskStatus === "loading"}
            className="cursor-pointer"
          >
            {scheduleHolidayTaskStatus === "loading" ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DepartmentCalender;
