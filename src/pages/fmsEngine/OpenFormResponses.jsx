import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Inbox,
  Edit3,
  RefreshCw,
  XCircle,
  Eye,
  Zap,
} from "lucide-react";
import api from "../../lib/api";
import {
  Select as AntdSelect,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Tooltip,
  Spin,
} from "antd";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { getSubmodulePermissions } from "../../utils/permissionUtils";

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
import DataPagination from "../../components/ui/commonPagination";

/* ─── Cell Value Smart Formatter matching FmsTemplates Badge Style ─── */
const SmartTableCell = ({ val }) => {
  if (val === null || val === undefined || val === "") {
    return <span className="text-gray-400 font-mono text-sm">—</span>;
  }

  let actualVal = val;
  if (typeof val === "object" && val !== null && "value" in val) {
    actualVal = val.value;
  }

  if (actualVal === null || actualVal === undefined || actualVal === "") {
    return <span className="text-gray-400 font-mono text-sm">—</span>;
  }

  // Boolean Values
  if (typeof actualVal === "boolean") {
    return (
      <Badge
        variant="default"
        className={
          actualVal
            ? "bg-green-100 text-green-800 hover:bg-green-100 border border-green-200 text-xs px-2 py-0.5"
            : "bg-red-100 text-red-800 hover:bg-red-100 border border-red-200 text-xs px-2 py-0.5"
        }
      >
        {actualVal ? "Yes" : "No"}
      </Badge>
    );
  }

  // Array / Multi-Select Tags
  if (Array.isArray(actualVal)) {
    if (actualVal.length === 0)
      return <span className="text-gray-400 font-mono text-sm">—</span>;
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {actualVal.slice(0, 2).map((item, i) => (
          <Badge
            key={i}
            variant="default"
            className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs px-2 py-0.5 max-w-[120px] truncate"
          >
            {String(item)}
          </Badge>
        ))}
        {actualVal.length > 2 && (
          <Tooltip title={actualVal.join(", ")}>
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0.5 cursor-pointer"
            >
              +{actualVal.length - 2}
            </Badge>
          </Tooltip>
        )}
      </div>
    );
  }

  // Long Text preview
  const strVal = String(actualVal);
  if (strVal.length > 30) {
    return (
      <Tooltip title={strVal} overlayStyle={{ maxWidth: 320 }}>
        <span className="truncate max-w-[180px] block text-gray-700 font-medium cursor-help text-sm">
          {strVal}
        </span>
      </Tooltip>
    );
  }

  return (
    <span className="text-gray-800 font-medium truncate block text-sm">
      {strVal}
    </span>
  );
};

/* ─── ORIGINAL ADMIN RESPONSE EDIT MODAL ─── */
const EditSubmissionModal = ({ open, submission, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fields = useMemo(() => {
    if (!submission?.submissionData) return [];
    return Object.entries(submission.submissionData).map(([key, item]) => ({
      key,
      label: typeof item === "object" && item?.label ? item.label : key,
      value:
        typeof item === "object" && item !== null && "value" in item
          ? item.value
          : item,
      fieldType:
        typeof item === "object" && item?.fieldType ? item.fieldType : "text",
    }));
  }, [submission]);

  useEffect(() => {
    if (open && fields.length > 0) {
      const initialValues = {};
      fields.forEach((f) => {
        if (f.fieldType === "date" && f.value) {
          initialValues[f.key] = dayjs(f.value);
        } else {
          initialValues[f.key] = f.value;
        }
      });
      form.setFieldsValue(initialValues);
    }
  }, [open, fields, form]);

  const handleSave = async (values) => {
    try {
      setSaving(true);
      const payloadData = {};
      Object.entries(values).forEach(([k, val]) => {
        if (dayjs.isDayjs(val)) {
          payloadData[k] = val.format("YYYY-MM-DD");
        } else {
          payloadData[k] = val;
        }
      });

      const res = await api.put(
        `/open-forms/submission/${submission._id}/edit`,
        { submissionData: payloadData },
      );

      message.success(
        res.data?.message || "Response updated and synced to all tasks!",
      );
      if (onSuccess) await onSuccess(submission._id, payloadData);
      onClose();
    } catch (err) {
      message.error(
        err.response?.data?.message || "Failed to update response.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-gray-900 font-bold text-base pb-2 border-b border-gray-100">
          <Edit3 size={18} className="text-blue-600" />
          Edit Open Form Response
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="Save & Cascade Sync"
      okButtonProps={{
        className:
          "bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm",
      }}
      cancelButtonProps={{ className: "rounded-lg text-sm font-medium" }}
      destroyOnClose
      width={540}
      closeIcon={
        <XCircle size={18} className="text-gray-400 hover:text-gray-600" />
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1"
      >
        {fields.map((f) => (
          <Form.Item
            key={f.key}
            name={f.key}
            label={
              <span className="font-semibold text-xs text-gray-700">
                {f.label}
              </span>
            }
            className="mb-0"
          >
            {f.fieldType === "number" ? (
              <InputNumber
                style={{ width: "100%" }}
                className="rounded-md text-sm"
              />
            ) : f.fieldType === "textarea" ? (
              <Input.TextArea rows={2} className="rounded-md text-sm" />
            ) : f.fieldType === "date" ? (
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                className="rounded-md text-sm"
              />
            ) : (
              <Input className="rounded-md text-sm" />
            )}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
};

/* ─── Main Open Form Responses Dashboard ─── */
export default function OpenFormResponses() {
  const [templates, setTemplates] = useState([]);
  const [forms, setForms] = useState([]);

  // Active Sequential Filters
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedFormId, setSelectedFormId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Submissions Data
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { permissions, isSuper } = useSelector((state) => state.permissions);
  const currentUser = useSelector((state) => state.users?.currentUser);

  const { canUpdate } = getSubmodulePermissions(
    permissions,
    "responses",
    isSuper,
  );

  const isAdmin = useMemo(() => {
    const roleName = currentUser?.role?.name || currentUser?.role;
    return ["Admin", "Owner", "SuperAdmin"].includes(roleName);
  }, [currentUser]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // 🚀 STEP 1: Fetch FMS Templates & Auto-select First Template
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.post(`/fms/templates-list-drop`, {
        role: currentUser?.role?.name,
        includeLinked: true,
      });
      const list = res.data?.data || res.data || [];
      setTemplates(list);

      if (list.length > 0) {
        setSelectedTemplateId(list[0]._id);
      } else {
        setSelectedTemplateId("");
      }
    } catch (err) {
      console.error("Failed to load template options:", err);
    }
  }, [currentUser?.role?.name]);

  // 🚀 STEP 2: Fetch Forms linked to the selected Template & Auto-select First Form
  const fetchLinkedForms = useCallback(async () => {
    if (!selectedTemplateId) {
      setForms([]);
      setSelectedFormId("");
      return;
    }

    try {
      const body = {
        role: currentUser?.role?.name,
        templateId: selectedTemplateId,
      };
      const res = await api.post(`/open-forms/get-forms`, body);
      const list = res.data?.data || [];
      setForms(list);

      if (list.length > 0) {
        setSelectedFormId(list[0]._id);
      } else {
        setSelectedFormId("");
      }
    } catch (err) {
      console.error("Failed to load forms linked with template:", err);
    }
  }, [selectedTemplateId, currentUser?.role?.name]);

  // 🚀 STEP 3: Fetch Submissions with pure Backend Parameter Delegation
  const fetchSubmissionsFromBackend = useCallback(async () => {
    if (!selectedTemplateId || !selectedFormId) {
      setSubmissions([]);
      return;
    }

    try {
      setLoading(true);

      const params = {
        templateId: selectedTemplateId,
        formId: selectedFormId,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get(`/open-forms/submissions`, { params });
      setSubmissions(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch backend filtered submissions:", err);
      message.error("Failed to fetch form responses.");
    } finally {
      setLoading(false);
    }
  }, [selectedTemplateId, selectedFormId, searchQuery]);

  // Run Flow Execution
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (selectedTemplateId) {
      fetchLinkedForms();
    }
  }, [selectedTemplateId, fetchLinkedForms]);

  useEffect(() => {
    if (selectedTemplateId && selectedFormId) {
      fetchSubmissionsFromBackend();
    }
  }, [selectedTemplateId, selectedFormId, fetchSubmissionsFromBackend]);

  // Dynamic Column Keys Extractor from Field Payloads
  const dynamicFieldMap = useMemo(() => {
    const fieldMap = new Map();

    submissions.forEach((sub) => {
      if (sub.submissionData && typeof sub.submissionData === "object") {
        Object.entries(sub.submissionData).forEach(([key, val]) => {
          let label = key;
          if (typeof val === "object" && val !== null && val.label) {
            label = val.label;
          } else {
            label = String(key)
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());
          }
          if (!fieldMap.has(key)) {
            fieldMap.set(key, label);
          }
        });
      }
    });

    return Array.from(fieldMap.entries());
  }, [submissions]);

  const paginatedSubmissions = useMemo(() => {
    const start = (page - 1) * limit;
    return submissions.slice(start, start + limit);
  }, [submissions, page, limit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
      {/* Animated Background Elements matching FmsTemplates */}
      <div className="fixed top-0 left-0 w-72 h-72 bg-blue-200/10 rounded-full blur-3xl animate-pulse -z-10"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-1000 -z-10"></div>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
        {/* Header Bar */}
        <CardHeader className="border-b border-gray-200/50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Open Form Responses
              </CardTitle>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
              <Button
                variant="outline"
                onClick={fetchSubmissionsFromBackend}
                className="flex items-center gap-2 text-sm h-[38px]"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : "text-gray-500"}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sequential Workflow Filter Toolbar with Matched Height */}
          <div className="flex flex-wrap items-end justify-between gap-3 bg-gray-50/70 p-3 rounded-lg border border-gray-200/60">
            <div className="flex flex-wrap items-end gap-3 flex-1">
              {/* STEP 1: Select FMS Template */}
              <div className="w-64">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">
                  1. Select FMS Template
                </span>
                <AntdSelect
                  size="middle"
                  value={selectedTemplateId || undefined}
                  onChange={(v) => {
                    setSelectedTemplateId(v);
                    setSelectedFormId(""); // Reset dependent form on template change
                    setPage(1);
                  }}
                  className="w-full text-xs"
                  popupClassName="rounded-lg"
                  placeholder="Select Template"
                  options={templates.map((t) => ({
                    value: t._id,
                    label: t.templateName || t.fmsId || "Untitled Template",
                  }))}
                />
              </div>

              {/* STEP 2: Select Linked Open Form */}
              <div className="w-60">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">
                  2. Select Linked Form
                </span>
                <AntdSelect
                  size="middle"
                  value={selectedFormId || undefined}
                  onChange={(v) => {
                    setSelectedFormId(v);
                    setPage(1);
                  }}
                  className="w-full text-xs"
                  popupClassName="rounded-lg"
                  placeholder={
                    forms.length === 0 ? "No linked forms" : "Select Form"
                  }
                  notFoundContent={
                    <div className="text-center py-2 text-xs text-gray-400">
                      No linked forms found
                    </div>
                  }
                  options={forms.map((f) => ({
                    value: f._id,
                    label: f.formName || "Untitled Form",
                  }))}
                />
              </div>

              {/* Search Submitter Input matching exact height */}
              <div className="w-56">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">
                  Search Submitter
                </span>
                <div className="flex items-center gap-2 bg-white border border-gray-300 px-3 h-[32px] rounded-md focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search name/code..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent border-none outline-none flex-1 text-xs text-gray-800 font-medium placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* High-Density Table matching FmsTemplates */}
          <div className="overflow-x-auto">
            <div className="rounded-lg border border-gray-200/50 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-sm p-3 w-12">
                      #
                    </TableHead>
                    <TableHead className="font-semibold text-sm p-3 min-w-[170px]">
                      SUBMITTER
                    </TableHead>
                    <TableHead className="font-semibold text-sm p-3 min-w-[150px]">
                      FORM NAME
                    </TableHead>
                    <TableHead className="font-semibold text-sm p-3 min-w-[140px]">
                      SUBMITTED AT
                    </TableHead>

                    {/* Dynamic Payload Field Headers */}
                    {dynamicFieldMap.map(([key, label]) => (
                      <TableHead
                        key={key}
                        className="font-semibold text-sm p-3 min-w-[180px]"
                      >
                        {label.toUpperCase()}
                      </TableHead>
                    ))}

                    <TableHead className="font-semibold text-sm p-3 text-center min-w-[100px] sticky right-0 bg-gray-50">
                      ACTIONS
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5 + dynamicFieldMap.length}
                        className="p-8 text-center"
                      >
                        <Spin />
                      </TableCell>
                    </TableRow>
                  ) : paginatedSubmissions.length > 0 ? (
                    paginatedSubmissions.map((item, idx) => (
                      <TableRow
                        key={item._id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <TableCell className="font-medium p-3 text-sm text-gray-400 font-mono">
                          {(page - 1) * limit + idx + 1}
                        </TableCell>

                        <TableCell className="p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {item?.submittedBy?.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 text-sm">
                                {item?.submittedBy?.name || "Anonymous User"}
                              </span>
                              <span className="text-xs text-gray-400 font-mono">
                                Code: {item?.submittedBy?.employeeCode || "—"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="p-3 text-sm font-semibold text-gray-800">
                          {item?.formId?.formName ||
                            item?.parentFormName ||
                            "Form"}
                        </TableCell>

                        <TableCell className="p-3 text-sm font-mono text-gray-500">
                          {formatDate(item.createdAt)}
                        </TableCell>

                        {/* Dynamic Payload Cells */}
                        {dynamicFieldMap.map(([key]) => (
                          <TableCell key={key} className="p-3 text-sm">
                            <SmartTableCell val={item.submissionData?.[key]} />
                          </TableCell>
                        ))}

                        {/* Action Icon Buttons */}
                        <TableCell className="p-3 text-center sticky right-0 bg-white">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSubmission(item);
                                setInspectorModalOpen(true);
                              }}
                              className="h-8 w-8 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {canUpdate && isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedSubmission(item);
                                  setEditModalOpen(true);
                                }}
                                className="h-8 w-8 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors duration-200"
                                title="Edit Payload"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-gray-50 transition-colors duration-200">
                      <TableCell
                        colSpan={5 + dynamicFieldMap.length}
                        className="p-8 text-center text-sm text-gray-500"
                      >
                        <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        No submission logs found for the selected template &
                        form combination.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Common Pagination */}
          <DataPagination
            page={page}
            limit={limit}
            total={submissions.length}
            totalPages={Math.ceil(submissions.length / limit) || 1}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />

          {/* Full Payload Inspector Modal */}
          <Modal
            title="Submission Response Payload"
            open={inspectorModalOpen}
            onCancel={() => setInspectorModalOpen(false)}
            footer={null}
            width={700}
          >
            {selectedSubmission ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase block">
                      Submitter
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {selectedSubmission.submittedBy?.name || "Anonymous User"}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      Employee Code:{" "}
                      {selectedSubmission.submittedBy?.employeeCode || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    {/* <Badge
                      variant="default"
                      className={
                        selectedSubmission.status === "Triggered"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {selectedSubmission.status || "Triggered"}
                    </Badge> */}
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      {formatDate(selectedSubmission.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {Object.entries(selectedSubmission?.submissionData || {}).map(
                    ([key, field]) => {
                      let labelText = key;
                      let renderedValue = "—";

                      if (typeof field === "object" && field !== null) {
                        if (field.label) labelText = field.label;
                        if ("value" in field)
                          renderedValue = String(field.value ?? "—");
                      } else if (field !== null && field !== undefined) {
                        renderedValue = String(field);
                      }

                      return (
                        <div
                          key={key}
                          className="flex items-start gap-3 p-3 border rounded-md hover:shadow-xs transition bg-white"
                        >
                          <div className="w-1.5 h-full bg-blue-500 rounded-full mt-1" />
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-gray-800 uppercase block">
                              {labelText}
                            </span>
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                              {renderedValue}
                            </p>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            ) : null}
          </Modal>

          {/* Admin Payload Edit Modal */}
          <EditSubmissionModal
            open={editModalOpen}
            submission={selectedSubmission}
            onClose={() => setEditModalOpen(false)}
            onSuccess={fetchSubmissionsFromBackend}
          />
        </CardContent>
      </Card>
    </div>
  );
}
