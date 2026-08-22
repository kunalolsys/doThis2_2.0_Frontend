import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  FileText,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Inbox,
  Edit3,
  RefreshCw,
  User,
  ShieldCheck,
  Building2,
  XCircle,
  Sparkles,
  Zap,
  List,
  Layers,
  Send,
  CheckCircle,
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
  Spin,
  Tag,
  Tooltip,
} from "antd";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

/* ─── Field Response Renderer ─── */
const SubmissionFieldCard = ({ fieldKey, field }) => {
  const labelText = useMemo(() => {
    if (typeof field === "object" && field !== null && field?.label) {
      return field.label;
    }
    return String(fieldKey || "")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  }, [field, fieldKey]);

  const renderedValue = useMemo(() => {
    if (field === null || field === undefined) return "—";
    let val = field;
    if (typeof field === "object" && field !== null && !Array.isArray(field)) {
      if ("value" in field) val = field.value;
      else return "—";
    }
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) {
      return val.length > 0
        ? val
            .map((item) =>
              typeof item === "object" && item !== null
                ? JSON.stringify(item)
                : String(item ?? "")
            )
            .filter(Boolean)
            .join(", ")
        : "—";
    }
    if (typeof val === "object") return "—";
    return String(val);
  }, [field]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 space-y-1">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
        {labelText}
      </span>
      <span className="text-sm font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed block">
        {renderedValue}
      </span>
    </div>
  );
};

/* ─── Admin Response Edit Modal ─── */
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
        { submissionData: payloadData }
      );

      message.success(
        res.data?.message || "Response updated and synced to all FMS tasks!"
      );
      if (onSuccess) await onSuccess(submission._id, payloadData);
      onClose();
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          "Failed to update response. Admin authorization required."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Edit3 size={16} className="text-blue-600" />
          Edit Open Form Response & Sync Tasks
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="Save & Cascade Sync"
      destroyOnClose
      width={540}
    >
      <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
        {fields.map((f) => (
          <Form.Item
            key={f.key}
            name={f.key}
            label={
              <span className="font-semibold text-xs text-slate-600">
                {f.label}
              </span>
            }
          >
            {f.fieldType === "number" ? (
              <InputNumber style={{ width: "100%" }} className="rounded-lg" />
            ) : f.fieldType === "textarea" ? (
              <Input.TextArea rows={3} className="rounded-lg" />
            ) : f.fieldType === "date" ? (
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                className="rounded-lg"
              />
            ) : (
              <Input className="rounded-lg" />
            )}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
};

/* ─── Main Open Form Responses Dashboard ─── */
export default function OpenFormResponses() {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("all");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;

  const currentUser = useSelector((state) => state.users?.currentUser);

  const isAdmin = useMemo(() => {
    const roleName = currentUser?.role?.name || currentUser?.role;
    return ["Admin", "Owner", "SuperAdmin"].includes(roleName);
  }, [currentUser]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const formsRes = await api.post(`/open-forms/get-forms`, {
        role: currentUser?.role?.name,
      });
      const formsList = formsRes.data?.data || [];
      setForms(formsList);

      if (formsList.length > 0) {
        const results = await Promise.allSettled(
          formsList.map((form) =>
            api.get(`/open-forms/${form._id}/submissions`)
          )
        );

        const combined = results.flatMap((result, index) => {
          if (result.status === "fulfilled") {
            const data = result.value.data?.data || [];
            return data.map((item) => ({
              ...item,
              parentFormName: formsList[index]?.formName || "Unnamed Form",
              parentFormId: formsList[index]?._id,
            }));
          }
          return [];
        });

        combined.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        setSubmissions(combined);
      }
    } catch (err) {
      console.error("Failed to load submission logs:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Filter Pipeline
  const filteredSubmissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return submissions.filter((item) => {
      const matchesForm =
        selectedFormId === "all" || item.parentFormId === selectedFormId;

      const name = item?.submittedBy?.name?.toLowerCase() || "";
      const code = item?.submittedBy?.employeeCode?.toLowerCase() || "";
      const matchesSearch =
        !query || name.includes(query) || code.includes(query);

      const isTriggered = item.status === "Triggered";
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "success" && isTriggered) ||
        (statusFilter === "failed" && !isTriggered);

      return matchesForm && matchesSearch && matchesStatus;
    });
  }, [submissions, selectedFormId, searchQuery, statusFilter]);

  // Auto-Select First Entry
  useEffect(() => {
    if (filteredSubmissions.length > 0) {
      const exists = filteredSubmissions.some(
        (s) => s._id === selectedSubmission?._id
      );
      if (!exists) setSelectedSubmission(filteredSubmissions[0]);
    } else {
      setSelectedSubmission(null);
    }
  }, [filteredSubmissions, selectedFormId]);

  // Metric Stats
  const stats = useMemo(() => {
    const total = filteredSubmissions.length;
    const triggered = filteredSubmissions.filter(
      (s) => s.status === "Triggered"
    ).length;
    const failed = total - triggered;
    return { total, triggered, failed };
  }, [filteredSubmissions]);

  // Paginated List
  const paginatedSubmissions = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredSubmissions.slice(start, start + limit);
  }, [filteredSubmissions, page, limit]);

  const totalPages = Math.ceil(filteredSubmissions.length / limit) || 1;

  const formOptions = useMemo(
    () => [
      { value: "all", label: "All Form Registries Combined" },
      ...forms.map((f) => ({
        value: f._id,
        label: f.formName || "Untitled Form",
      })),
    ],
    [forms]
  );

  // Auto Refresh Callback
  const handleEditSuccess = async (subId, updatedData) => {
    await fetchInitialData();
    if (selectedSubmission?._id === subId) {
      setSelectedSubmission((prev) => {
        if (!prev) return null;
        const newSubmissionData = { ...prev.submissionData };
        Object.entries(updatedData).forEach(([k, val]) => {
          if (
            typeof newSubmissionData[k] === "object" &&
            newSubmissionData[k] !== null
          ) {
            newSubmissionData[k].value = val;
          } else {
            newSubmissionData[k] = val;
          }
        });
        return { ...prev, submissionData: newSubmissionData };
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-6 space-y-6">
      {/* ── GRADIENT HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-8 shadow-2xl">
        <div className="absolute right-[-50px] top-[-50px] opacity-10">
          <Sparkles className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="bg-white/20 backdrop-blur-xl p-4 rounded-3xl border border-white/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>

            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Open Form Submissions
              </h1>
              <p className="text-blue-100 mt-2 text-base max-w-2xl leading-relaxed">
                Monitor live form response ingress, pipeline execution statuses, and cascade-synced FMS tasks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-white text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Triggered: <b>{stats.triggered}</b></span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-white text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-300" />
              <span>Failed: <b>{stats.failed}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER & CONTROL BAR CARD ── */}
      <div className="bg-white rounded-[30px] p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="w-64">
              <AntdSelect
                size="large"
                value={selectedFormId}
                onChange={(v) => {
                  setSelectedFormId(v);
                  setPage(1);
                }}
                className="w-full"
                options={formOptions}
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              {[
                { id: "all", label: "All Items" },
                { id: "success", label: "Triggered" },
                { id: "failed", label: "Failed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-4 py-2 rounded-2xl w-64 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <Search size={15} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search submitter or code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-none outline-none flex-1 text-xs text-slate-800 font-medium"
              />
            </div>
          </div>

          <button
            onClick={fetchInitialData}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 cursor-pointer transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync Records
          </button>
        </div>
      </div>

      {/* ── 4-COLUMN WORKSPACE GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* 3-COLUMN MASTER LEDGER */}
        <div className="xl:col-span-3 bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Submission Ingress Audit Ledger
            </h3>
            <span className="text-xs font-bold text-slate-400">
              Showing {filteredSubmissions.length} Total Submissions
            </span>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Spin size="large" />
              <span>Fetching submission records...</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
              <Inbox size={32} className="mb-2 text-slate-300" />
              <span>No submissions located</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">#</th>
                    <th className="py-3.5 px-6">Submitted By</th>
                    <th className="py-3.5 px-6">Form Name</th>
                    <th className="py-3.5 px-6">Submitted At</th>
                    <th className="py-3.5 px-6 text-right">Pipeline Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSubmissions.map((item, idx) => {
                    const isSelected = selectedSubmission?._id === item._id;
                    const isTriggered = item.status === "Triggered";

                    return (
                      <tr
                        key={item._id}
                        onClick={() => setSelectedSubmission(item)}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? "bg-blue-50/70 border-l-4 border-l-blue-600"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td className="py-4 px-6 text-slate-400 font-mono">
                          {(page - 1) * limit + idx + 1}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">
                              {item?.submittedBy?.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-xs">
                                {item?.submittedBy?.name || "Anonymous User"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item?.submittedBy?.employeeCode || "—"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700">
                          {item.parentFormName}
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-mono">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Tag
                            color={isTriggered ? "success" : "error"}
                            className="rounded-full px-3 py-0.5 font-bold text-[10px] m-0"
                          >
                            {isTriggered ? "Triggered" : "Failed"}
                          </Tag>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="p-4 border-t bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Showing {((page - 1) * limit) + 1} –{" "}
              {Math.min(page * limit, filteredSubmissions.length)} of{" "}
              {filteredSubmissions.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs font-bold text-slate-600 px-2">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-xs"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 1-COLUMN STICKY DETAIL INSPECTION SIDEBAR */}
        <div className="space-y-6">
          <div className="bg-white rounded-[30px] border-0 shadow-xl sticky top-6 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />

            <div className="p-6 border-b bg-slate-50/80 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Submitter Inspector
              </h3>
              {isAdmin && selectedSubmission && (
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Edit3 size={13} /> Edit Payload
                </button>
              )}
            </div>

            <div className="p-6">
              {selectedSubmission ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      User Profile
                    </span>
                    <h3 className="font-semibold text-slate-800 text-base mt-0.5">
                      {selectedSubmission.submittedBy?.name || "Anonymous User"}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Code: {selectedSubmission.submittedBy?.employeeCode || "—"}
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block border-b border-slate-200/80 pb-1.5">
                      Form Payload Fields
                    </span>

                    {Object.entries(selectedSubmission?.submissionData || {}).map(
                      ([key, field]) => (
                        <SubmissionFieldCard
                          key={key}
                          fieldKey={key}
                          field={field}
                        />
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Select a submission row from the left ledger to inspect form field details.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Edit Modal */}
      <EditSubmissionModal
        open={editModalOpen}
        submission={selectedSubmission}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}