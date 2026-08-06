import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  FileText,
  Search,
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import api from "../../lib/api";
import { Select } from "antd";
import { useSelector } from "react-redux";

// --- Helper Component: Renders Each Response Field Safely ---
const SubmissionField = ({ fieldKey, field }) => {
  // 1. Safe Label Extraction
  const labelText = useMemo(() => {
    if (typeof field === "object" && field !== null && field?.label) {
      return field.label;
    }
    return String(fieldKey || "")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  }, [field, fieldKey]);

  // 2. Crash-Proof Value Extractor
  const renderedValue = useMemo(() => {
    if (field === null || field === undefined) return "";

    let val = field;

    // Handle field metadata wrapper objects e.g., { isTableColumn, label, fieldType, value }
    if (typeof field === "object" && field !== null && !Array.isArray(field)) {
      if ("value" in field) {
        val = field.value;
      } else {
        return ""; // Prevent stringifying object metadata if user value is missing
      }
    }

    if (val === null || val === undefined || val === "") return "";

    // Booleans
    if (typeof val === "boolean") return val ? "Yes" : "No";

    // Arrays (Multi-select, Checkboxes, File lists)
    if (Array.isArray(val)) {
      return val.length > 0
        ? val
            .map((item) =>
              typeof item === "object" && item !== null
                ? JSON.stringify(item)
                : String(item ?? ""),
            )
            .filter(Boolean)
            .join(", ")
        : "";
    }

    // Safety check for nested objects to prevent React Child Crash
    if (typeof val === "object") return "";

    return String(val);
  }, [field]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold tracking-tight text-neutral-500">
        {labelText}
      </label>
      <div className="text-sm font-normal text-neutral-800 bg-white border border-neutral-200/70 px-4 py-3 rounded-xl whitespace-pre-wrap leading-relaxed shadow-xs font-sans min-h-[42px]">
        {renderedValue}
      </div>
    </div>
  );
};

export default function OpenFormResponses() {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("all");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const currentUser = useSelector((state) => state.users.currentUser);

  // Safe Date Formatter Helper
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

  // Fetch initial registries and submission data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const formsRes = await api.post(`/open-forms/get-forms`, {
        role: currentUser?.role?.name,
      });
      const formsList = formsRes.data?.data || [];
      setForms(formsList);

      if (formsList.length > 0) {
        // Aggregate submissions across all registries
        const results = await Promise.allSettled(
          formsList.map((form) =>
            api.get(`/open-forms/${form._id}/submissions`),
          ),
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

        // Chronological descending sort safely
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

  // Memoized filter pipeline
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

  // 🟢 FIX: Reset preview selection safely when dropdown or filter changes
  useEffect(() => {
    if (filteredSubmissions.length > 0) {
      const existsInFiltered = filteredSubmissions.some(
        (sub) => sub?._id === selectedSubmission?._id,
      );

      if (!existsInFiltered) {
        setSelectedSubmission(filteredSubmissions[0]);
      }
    } else {
      setSelectedSubmission(null);
    }
  }, [filteredSubmissions, selectedFormId]);

  // Select Options Memoization
  const formOptions = useMemo(
    () => [
      { value: "all", label: "All Registries Combined" },
      ...forms.map((f) => ({
        value: f._id,
        label: f.formName || "Untitled Form",
      })),
    ],
    [forms],
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] font-sans antialiased flex flex-col h-screen overflow-hidden selection:bg-neutral-200">
      {/* NAVBAR HEADER */}
      <header className="h-16 bg-white border-b border-neutral-200/80 px-8 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center text-white">
              <FileText size={13} strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm tracking-tight text-neutral-900">
              Console Ingress Logs
            </span>
          </div>
          <div className="h-4 w-px bg-neutral-200" />

          <Select
            value={selectedFormId}
            onChange={setSelectedFormId}
            popupMatchSelectWidth={false}
            className="text-neutral-800 font-medium text-xs ant-custom-select"
            options={formOptions}
          />
        </div>

        {/* UTILITY CONTROLS */}
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200/40">
            {[
              { id: "all", label: "All Items" },
              { id: "success", label: "Success" },
              { id: "failed", label: "Failed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-neutral-900 shadow-xs border border-neutral-200/10"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border border-neutral-200 bg-neutral-50 px-3 py-1.5 rounded-lg w-64 focus-within:bg-white focus-within:ring-1 focus-within:ring-neutral-900 focus-within:border-neutral-900 transition-all">
            <Search size={13} className="text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Quick search parameters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-xs text-neutral-800 placeholder-neutral-400"
            />
          </div>
        </div>
      </header>

      {/* CORE DUAL-PANEL LAYOUT */}
      <div className="flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto bg-white border-x border-neutral-200/40">
        {/* PANEL A: LOGS LIST */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-neutral-200/60 bg-white h-full overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-neutral-400 text-xs font-medium">
              <span className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              <span>Fetching dynamic schema tables...</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAFAFA]">
              <div className="w-9 h-9 rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-300 mb-3 shadow-xs">
                <Inbox size={16} />
              </div>
              <h4 className="text-sm font-semibold text-neutral-800 tracking-tight">
                No records located
              </h4>
              <p className="text-xs text-neutral-400 max-w-[260px] mt-1 leading-relaxed">
                Adjust or reset your lookup constraints or chosen category
                registry schemas.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
              <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200/60 flex items-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wider sticky top-0 z-10 select-none">
                <div className="w-[45%]">Ingress Profile Identity</div>
                <div className="w-[30%]">Source Form Identity</div>
                <div className="flex-1 text-right">Registered Ingress</div>
              </div>

              {filteredSubmissions.map((item) => {
                const isSelected = selectedSubmission?._id === item._id;
                const isSuccess = item.status === "Triggered";

                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedSubmission(item)}
                    className={`px-6 py-5 flex items-center cursor-pointer transition-all ${
                      isSelected
                        ? "bg-neutral-50/80 relative after:absolute after:left-0 after:top-0 after:bottom-0 after:w-[3px] after:bg-neutral-900"
                        : "hover:bg-neutral-50/30"
                    }`}
                  >
                    <div className="w-[45%] flex items-center gap-3.5 min-w-0 pr-4">
                      <div
                        className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? "bg-white border-neutral-300 text-neutral-800 shadow-2xs"
                            : "bg-neutral-100/80 border-neutral-200/40 text-neutral-600"
                        }`}
                      >
                        {item?.submittedBy?.name
                          ? item.submittedBy.name.substring(0, 2).toUpperCase()
                          : "AN"}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-neutral-900 truncate tracking-tight">
                            {item?.submittedBy?.name || "Anonymous Thread"}
                          </span>
                          {!isSuccess && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 shrink-0">
                              <AlertTriangle size={10} />
                              Fail
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-400 block mt-0.5 font-mono tracking-tight">
                          {item?.submittedBy?.employeeCode || "NODE_SYS_EMPTY"}
                        </span>
                      </div>
                    </div>

                    <div className="w-[30%] truncate pr-4 text-xs font-medium text-neutral-500 tracking-tight">
                      {item.parentFormName || "Active Registry Profile"}
                    </div>

                    <div className="flex-1 text-right flex items-center justify-end gap-2 text-neutral-400 font-mono text-xs">
                      <Calendar
                        size={12}
                        className="text-neutral-300 shrink-0"
                      />
                      <span>{formatDate(item.createdAt)}</span>
                      <ChevronRight
                        size={14}
                        className={`text-neutral-300 transition-transform ${
                          isSelected ? "translate-x-0.5 text-neutral-500" : ""
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* PANEL B: DETAILS SIDEBAR */}
        <aside className="w-[480px] bg-[#FAFAFA] flex flex-col shrink-0 h-full overflow-hidden border-l border-neutral-200/60">
          {selectedSubmission ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-6 bg-white border-b border-neutral-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-bold">
                    Metadata Registry Log
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight mt-0.5 truncate max-w-[320px]">
                    {selectedSubmission?.submittedBy?.name ||
                      "Anonymous Ingress"}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-neutral-200 shadow-2xs px-3 py-1.5 rounded-lg">
                  {selectedSubmission.status === "Triggered" ? (
                    <>
                      <CheckCircle2 size={13} className="text-neutral-900" />
                      <span className="text-neutral-900">Success Pipe</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} className="text-red-500" />
                      <span className="text-red-600">Failed Node</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-neutral-200/80 bg-white shadow-2xs text-xs">
                  <div>
                    <span className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider block">
                      Registry Source Target
                    </span>
                    <span className="text-neutral-700 mt-1 block font-semibold truncate">
                      {selectedSubmission.parentFormName || "Config Core Link"}
                    </span>
                  </div>
                </div>

                {/* RESPONSES SECTION */}
                <div className="space-y-5">
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-200 pb-1.5">
                    Response Payload
                  </div>

                  {Object.entries(selectedSubmission?.submissionData || {}).map(
                    ([key, field]) => (
                      <SubmissionField key={key} fieldKey={key} field={field} />
                    ),
                  )}
                </div>
              </div>

              <div className="p-4 bg-white border-t border-neutral-200/80 flex items-center justify-between text-[10px] text-neutral-400 px-6 font-mono tracking-tight select-none shrink-0">
                <span>Secure SSL Node Link Verified</span>
                <span>PRODUCTION_ENV_2026</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 text-xs font-medium">
              <span>
                Select an entry row log to inspect payload response details.
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
