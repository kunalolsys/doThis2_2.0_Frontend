import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Settings2,
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Copy,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  FileText,
  Type,
  Hash,
  Mail,
  Phone,
  Link,
  Calendar,
  List,
  CheckSquare,
  AlignLeft,
  Upload,
  RadioIcon,
  Loader2,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { fetchTemplates } from "../../redux/slices/fms/fmsSlice";
import { useDispatch } from "react-redux";
import api from "../../lib/api";

/* ─── Design tokens — matches established project theme ──────────────────── */
const T = {
  bg: "#F1F5F9",
  card: "#FFFFFF",
  surf: "#F8FAFC",
  border: "#E2E8F0",
  border2: "#CBD5E1",
  accent: "#2563EB",
  accentL: "#EFF6FF",
  accentB: "#BFDBFE",
  green: "#059669",
  greenL: "#ECFDF5",
  greenB: "#A7F3D0",
  amber: "#D97706",
  amberL: "#FFFBEB",
  amberB: "#FDE68A",
  red: "#DC2626",
  redL: "#FEF2F2",
  redB: "#FECACA",
  purple: "#7C3AED",
  purpleL: "#F5F3FF",
  text: "#0F172A",
  text2: "#334155",
  muted: "#64748B",
  muted2: "#94A3B8",
};

/* ─── Field type registry ──────────────────────────────────────────────────── */
const FIELD_TYPES = [
  { type: "text", label: "Short Text", icon: Type, color: T.accent },
  { type: "textarea", label: "Long Text", icon: AlignLeft, color: T.purple },
  { type: "number", label: "Number", icon: Hash, color: T.green },
  { type: "email", label: "Email", icon: Mail, color: T.amber },
  { type: "phone", label: "Phone", icon: Phone, color: T.green },
  { type: "date", label: "Date", icon: Calendar, color: T.red },
  { type: "url", label: "URL", icon: Link, color: T.purple },
  { type: "select", label: "Dropdown", icon: List, color: T.accent },
  { type: "radio", label: "Radio", icon: RadioIcon, color: T.amber },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, color: T.green },
  { type: "file", label: "File Upload", icon: Upload, color: T.muted },
];
const typeInfo = (t) => FIELD_TYPES.find((f) => f.type === t) || FIELD_TYPES[0];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const uid = () => crypto.randomUUID();

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/* ─── Shared UI atoms ──────────────────────────────────────────────────────── */
const Label = ({ children, required }) => (
  <label
    style={{
      display: "block",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      color: T.muted,
      marginBottom: 6,
    }}
  >
    {children}
    {required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}
  </label>
);

const Field = ({
  value,
  onChange,
  placeholder,
  type = "text",
  rows,
  disabled,
  onFocus,
  onBlur,
  focused,
}) => {
  const base = {
    width: "100%",
    border: `1px solid ${focused ? T.accent : T.border2}`,
    borderRadius: 10,
    padding: rows ? "10px 12px" : "9px 12px",
    fontSize: 13,
    color: T.text,
    fontFamily: "inherit",
    outline: "none",
    background: disabled ? T.surf : T.card,
    boxShadow: focused ? `0 0 0 3px ${T.accentB}55` : "none",
    transition: "all 0.15s",
    boxSizing: "border-box",
    resize: rows ? "vertical" : "none",
  };
  if (rows)
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={base}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={base}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
};

const FocusField = (props) => {
  const [focused, setFocused] = useState(false);
  return (
    <Field
      {...props}
      focused={focused}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

const Btn = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  size = "md",
  style: extra,
}) => {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: {
      bg: hov && !disabled ? "#1D4ED8" : T.accent,
      color: "#fff",
      border: "none",
    },
    secondary: {
      bg: hov && !disabled ? T.border : "transparent",
      color: T.muted,
      border: `1px solid ${T.border2}`,
    },
    danger: {
      bg: hov && !disabled ? "rgba(220,38,38,0.15)" : "rgba(220,38,38,0.08)",
      color: T.red,
      border: `1px solid ${T.redB}`,
    },
    ghost: {
      bg: hov && !disabled ? T.surf : "transparent",
      color: T.muted,
      border: `1px solid ${hov ? T.border2 : T.border}`,
    },
    success: {
      bg: hov && !disabled ? "#047857" : T.green,
      color: "#fff",
      border: "none",
    },
  };
  const s = styles[variant] || styles.primary;
  const pad =
    size === "sm" ? "6px 12px" : size === "lg" ? "12px 24px" : "9px 16px";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: pad,
        borderRadius: 10,
        fontSize: size === "lg" ? "14px" : "13px",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        background: s.bg,
        color: s.color,
        border: s.border,
        ...extra,
      }}
    >
      {children}
    </button>
  );
};

const SelectField = ({ value, onChange, children, placeholder }) => {
  const [f, setF] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        width: "100%",
        border: `1px solid ${f ? T.accent : T.border2}`,
        borderRadius: 10,
        padding: "9px 12px",
        fontSize: 13,
        color: T.text,
        fontFamily: "inherit",
        outline: "none",
        background: T.card,
        boxShadow: f ? `0 0 0 3px ${T.accentB}55` : "none",
        transition: "all 0.15s",
        appearance: "none",
        cursor: "pointer",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
};

const Toggle = ({ checked, onChange, label, sub }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 14px",
      background: checked ? T.accentL : T.surf,
      border: `1px solid ${checked ? T.accentB : T.border}`,
      borderRadius: 12,
      cursor: "pointer",
      transition: "all 0.2s",
    }}
  >
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>
      )}
    </div>
    <div
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        flexShrink: 0,
        background: checked ? T.accent : T.border2,
        position: "relative",
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          borderRadius: "50%",
          left: checked ? 19 : 3,
          width: 14,
          height: 14,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }}
      />
    </div>
  </div>
);

const Pill = ({
  children,
  color = T.accent,
  bg = T.accentL,
  border = T.accentB,
  dot,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 9px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      color,
      background: bg,
      border: `1px solid ${border}`,
    }}
  >
    {dot && (
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
        }}
      />
    )}
    {children}
  </span>
);

const SectionCard = ({
  title,
  subtitle,
  icon: Icon,
  color = T.accent,
  children,
  action,
}) => (
  <div
    style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      marginBottom: 16,
    }}
  >
    <div
      style={{
        padding: "16px 22px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {Icon && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: `${color}12`,
              border: `1px solid ${color}25`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={15} color={color} />
          </div>
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: T.muted }}>{subtitle}</div>
          )}
        </div>
      </div>
      {action}
    </div>
    <div style={{ padding: "18px 22px" }}>{children}</div>
  </div>
);

/* ─── Field card in builder ────────────────────────────────────────────────── */
const FieldCard = ({
  field,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) => {
  const [expanded, setExpanded] = useState(true);
  const info = typeInfo(field.fieldType);
  const Icon = info.icon;

  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "box-shadow 0.15s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: T.surf,
          borderBottom: expanded ? `1px solid ${T.border}` : "none",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Drag handle */}
        <GripVertical
          size={15}
          color={T.muted2}
          style={{ flexShrink: 0, cursor: "grab" }}
        />

        {/* Type icon */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            flexShrink: 0,
            background: `${info.color}12`,
            border: `1px solid ${info.color}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={13} color={info.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {field.label || (
              <span style={{ color: T.muted2 }}>Untitled field</span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: T.muted,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 1,
            }}
          >
            <span>{info.label}</span>
            {field.isRequired && (
              <Pill color={T.red} bg={T.redL} border={T.redB}>
                Required
              </Pill>
            )}
          </div>
        </div>

        <div
          style={{ display: "flex", alignItems: "center", gap: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Btn
            variant="ghost"
            size="sm"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            style={{ padding: "4px 6px" }}
          >
            ↑
          </Btn>
          <Btn
            variant="ghost"
            size="sm"
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            style={{ padding: "4px 6px" }}
          >
            ↓
          </Btn>
          <Btn
            variant="danger"
            size="sm"
            onClick={() => onRemove(index)}
            style={{ padding: "4px 8px" }}
          >
            <Trash2 size={12} />
          </Btn>
          <div style={{ color: T.muted2, fontSize: 16 }}>
            {expanded ? "∧" : "∨"}
          </div>
        </div>
      </div>

      {/* Card body */}
      {expanded && (
        <div
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div>
              <Label>
                Label <span style={{ color: T.red }}>*</span>
              </Label>
              <FocusField
                value={field.label}
                onChange={(e) => onChange(index, "label", e.target.value)}
                placeholder="e.g. Full Name"
              />
            </div>
            <div>
              <Label>Placeholder</Label>
              <FocusField
                value={field.placeholder || ""}
                onChange={(e) => onChange(index, "placeholder", e.target.value)}
                placeholder="Hint text for the user"
              />
            </div>
          </div>

          {/* Options for select / radio */}
          {(field.fieldType === "select" || field.fieldType === "radio") && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Label>Options</Label>
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const opts = [...(field.options || []), ""];
                    onChange(index, "options", opts);
                  }}
                >
                  <Plus size={12} /> Add option
                </Btn>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(field.options || []).map((opt, oi) => (
                  <div
                    key={oi}
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius:
                          field.fieldType === "radio" ? "50%" : "5px",
                        border: `2px solid ${T.border2}`,
                        flexShrink: 0,
                      }}
                    />
                    <FocusField
                      value={opt}
                      onChange={(e) => {
                        const opts = [...(field.options || [])];
                        opts[oi] = e.target.value;
                        onChange(index, "options", opts);
                      }}
                      placeholder={`Option ${oi + 1}`}
                    />
                    <button
                      onClick={() => {
                        const opts = (field.options || []).filter(
                          (_, i) => i !== oi,
                        );
                        onChange(index, "options", opts);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: T.muted2,
                        padding: 4,
                        display: "flex",
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required toggle */}
          <Toggle
            checked={!!field.isRequired}
            onChange={(v) => onChange(index, "isRequired", v)}
            label="Required field"
            sub="Form cannot be submitted without this field"
          />
        </div>
      )}
    </div>
  );
};

/* ─── Public form preview renderer ────────────────────────────────────────── */
const PublicFormField = ({ field, value, onChange }) => {
  const [f, setF] = useState(false);
  const info = typeInfo(field.fieldType);
  const Icon = info.icon;
  const inputStyle = {
    width: "100%",
    border: `1px solid ${f ? T.accent : T.border2}`,
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: T.text,
    fontFamily: "inherit",
    outline: "none",
    background: T.card,
    boxShadow: f ? `0 0 0 3px ${T.accentB}55` : "none",
    transition: "all 0.15s",
    boxSizing: "border-box",
  };

  const inner = () => {
    switch (field.fieldType) {
      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
            onFocus={() => setF(true)}
            onBlur={() => setF(false)}
          />
        );
      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
            onFocus={() => setF(true)}
            onBlur={() => setF(false)}
          >
            <option value="">— Select an option —</option>
            {(field.options || []).map((o, i) => (
              <option key={i} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(field.options || []).map((o, i) => (
              <label
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1px solid ${value === o ? T.accentB : T.border}`,
                  background: value === o ? T.accentL : T.surf,
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name={field.fieldId}
                  value={o}
                  checked={value === o}
                  onChange={() => onChange(o)}
                  style={{ accentColor: T.accent }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: T.text,
                    fontWeight: value === o ? 600 : 400,
                  }}
                >
                  {o}
                </span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              style={{ accentColor: T.accent, width: 16, height: 16 }}
            />
            <span style={{ fontSize: 13, color: T.text }}>
              {field.placeholder || "Check this option"}
            </span>
          </label>
        );
      default:
        return (
          <input
            type={field.fieldType === "phone" ? "text" : field.fieldType}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            style={inputStyle}
            onFocus={() => setF(true)}
            onBlur={() => setF(false)}
          />
        );
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: `${info.color}12`,
            border: `1px solid ${info.color}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={12} color={info.color} />
        </div>
        <label style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
          {field.label}
          {field.isRequired && (
            <span style={{ color: T.red, marginLeft: 3 }}>*</span>
          )}
        </label>
      </div>
      {inner()}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function OpenFormBuilder() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState("builder"); // builder | preview | forms
  const [templates, setTemplates] = useState([]);
  const [forms, setForms] = useState([]);
  const [loadingTpl, setLoadingTpl] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type }

  // Form config
  const [config, setConfig] = useState({
    formName: "",
    description: "",
    linkedTemplate: "",
    allowMultipleSubmissions: true,
    isActive: true,
  });
  const setConf = (k, v) => setConfig((p) => ({ ...p, [k]: v }));

  // Fields
  const [fields, setFields] = useState([
    {
      fieldId: "fullName",
      label: "Full Name",
      fieldType: "text",
      placeholder: "Enter your full name",
      isRequired: true,
      options: [],
      order: 1,
    },
  ]);

  // Public form
  const [selectedForm, setSelectedForm] = useState(null);
  const [submissionData, setSubmissionData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    Promise.all([fetchTempl(), fetchForms()]);
  }, []);

  const fetchTempl = async () => {
    try {
      setLoadingTpl(true);
      const res = await dispatch(
        fetchTemplates({ page: 1, limit: 100000 }),
      ).unwrap();
      setTemplates(res.data || []);
    } catch {
      showToast("Failed to load templates", "error");
    } finally {
      setLoadingTpl(false);
    }
  };

  const fetchForms = async () => {
    try {
      const res = await api.get("/open-forms");
      setForms(res.data?.data || []);
    } catch {
      /* silent */
    }
  };

  // ── Field operations ──────────────────────────────────────────────────────
  const addField = (type) =>
    setFields((prev) => [
      ...prev,
      {
        fieldId: "",
        label: "",
        fieldType: type,
        placeholder: "",
        isRequired: false,
        options: type === "select" || type === "radio" ? [""] : [],
        order: prev.length + 1,
      },
    ]);
  const generateFieldId = (label = "") => {
    return label
      .trim()
      .replace(/[^\w\s]/g, "") // remove special chars
      .split(/\s+/)
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join("");
  };
  const updateField = (idx, key, val) => {
    setFields((prev) => {
      const updated = [...prev];

      updated[idx] = {
        ...updated[idx],
        [key]: val,
      };

      // Auto-generate fieldId from label
      if (key === "label") {
        updated[idx].fieldId = generateFieldId(val);
      }

      return updated;
    });
  };

  const removeField = (idx) =>
    setFields((prev) => prev.filter((_, i) => i !== idx));

  const moveField = (idx, dir) => {
    setFields((prev) => {
      const c = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= c.length) return c;
      [c[idx], c[target]] = [c[target], c[idx]];
      return c;
    });
  };

  // ── Save form ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!config.formName.trim()) {
      showToast("Form name is required", "error");
      return;
    }
    if (!config.linkedTemplate) {
      showToast("Please link an FMS template", "error");
      return;
    }
    if (fields.length === 0) {
      showToast("Add at least one field", "error");
      return;
    }
    try {
      setSaving(true);
      await api.post("/open-forms", {
        ...config,
        fields: fields.map((f, i) => ({ ...f, order: i + 1 })),
      });
      showToast("Open form published successfully");
      setConfig({
        formName: "",
        description: "",
        linkedTemplate: "",
        allowMultipleSubmissions: true,
        isActive: true,
      });
      setFields([
        {
          fieldId: "",
          label: "Full Name",
          fieldType: "text",
          placeholder: "Enter your full name",
          isRequired: true,
          options: [],
          order: 1,
        },
      ]);
      await fetchForms();
      setTab("forms");
    } catch (e) {
      showToast(
        e?.response?.data?.message || "Failed to publish form",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Submit public form ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedForm) return;
    const missing = selectedForm.fields.filter(
      (f) => f.isRequired && !submissionData[f.fieldId],
    );
    if (missing.length) {
      showToast(
        `Please fill: ${missing.map((f) => f.label).join(", ")}`,
        "error",
      );
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.post(
        `/open-forms/${selectedForm._id}/submit`,
        submissionData,
      );
      setSubmitSuccess(res.data?.instance?.instanceId || "triggered");
      setSubmissionData({});
    } catch (e) {
      showToast(e?.response?.data?.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const selectedTemplate = useMemo(
    () => templates.find((t) => t._id === config.linkedTemplate),
    [templates, config.linkedTemplate],
  );

  const TABS = [
    { id: "builder", label: "Form Builder", icon: Settings2 },
    { id: "preview", label: "Preview Form", icon: Eye },
    {
      id: "forms",
      label: "Published Forms",
      icon: FileText,
      badge: forms.length,
    },
  ];

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        padding: "28px 24px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        input::placeholder,textarea::placeholder{color:${T.muted2};font-size:13px}
        select option{background:#fff;color:${T.text}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .field-card-enter{animation:fadeUp 0.25s ease}
        button:disabled{opacity:0.5;cursor:not-allowed}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:2px}
      `}</style>

      <div style={{ margin: "0 auto" }}>
        {/* ── Toast ───────────────────────────────────────────────────────── */}
        {toast && (
          <div
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 9999,
              background: toast.type === "error" ? T.redL : T.greenL,
              border: `1px solid ${toast.type === "error" ? T.redB : T.greenB}`,
              borderRadius: 12,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              fontWeight: 600,
              color: toast.type === "error" ? T.red : T.green,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              animation: "slideDown 0.25s ease",
            }}
          >
            {toast.type === "error" ? (
              <AlertCircle size={15} />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {toast.msg}
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `linear-gradient(135deg,${T.accent},#4F46E5)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Zap size={20} color="#fff" />
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: T.text,
                      margin: 0,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Open Form Builder
                  </h1>
                  <p
                    style={{
                      fontSize: 12,
                      color: T.muted,
                      margin: 0,
                      marginTop: 2,
                    }}
                  >
                    Build dynamic public forms that auto-launch FMS workflows on
                    submission
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                variant="secondary"
                size="sm"
                onClick={() => Promise.all([fetchTempl(), fetchForms()])}
              >
                <RefreshCw size={13} /> Refresh
              </Btn>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: T.card,
              padding: 5,
              borderRadius: 14,
              border: `1px solid ${T.border}`,
              width: "fit-content",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            {TABS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: tab === id ? T.accent : "transparent",
                  color: tab === id ? "#fff" : T.muted,
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                <Icon size={14} />
                {label}
                {badge > 0 && (
                  <span
                    style={{
                      background:
                        tab === id ? "rgba(255,255,255,0.25)" : T.accentL,
                      color: tab === id ? "#fff" : T.accent,
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: 20,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB: BUILDER
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "builder" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "340px 1fr",
              gap: 16,
              animation: "fadeUp 0.3s ease",
            }}
          >
            {/* ── Left: Config panel ───────────────────────────────────── */}
            <div>
              <SectionCard
                title="Form Settings"
                subtitle="Configure the form properties"
                icon={Settings2}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  <div>
                    <Label required>Form Name</Label>
                    <FocusField
                      value={config.formName}
                      onChange={(e) => setConf("formName", e.target.value)}
                      placeholder="e.g. Vendor Onboarding Request"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <FocusField
                      value={config.description}
                      onChange={(e) => setConf("description", e.target.value)}
                      placeholder="Brief description for form submitters…"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label required>Link FMS Template</Label>
                    <SelectField
                      value={config.linkedTemplate}
                      onChange={(e) =>
                        setConf("linkedTemplate", e.target.value)
                      }
                      placeholder={
                        loadingTpl
                          ? "Loading templates…"
                          : "— Select FMS Template —"
                      }
                    >
                      {templates.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.templateName}
                        </option>
                      ))}
                    </SelectField>
                    {selectedTemplate && (
                      <div
                        style={{
                          marginTop: 8,
                          background: T.accentL,
                          border: `1px solid ${T.accentB}`,
                          borderRadius: 9,
                          padding: "9px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: T.accent,
                            letterSpacing: "0.6px",
                            textTransform: "uppercase",
                            marginBottom: 3,
                          }}
                        >
                          Linked Template
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: T.text,
                          }}
                        >
                          {selectedTemplate.templateName}
                        </div>
                        {selectedTemplate.description && (
                          <div
                            style={{
                              fontSize: 11,
                              color: T.muted,
                              marginTop: 2,
                            }}
                          >
                            {selectedTemplate.description}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <Toggle
                      checked={config.isActive}
                      onChange={(v) => setConf("isActive", v)}
                      label="Form Active"
                      sub="Makes this form publicly accessible"
                    />
                    <Toggle
                      checked={config.allowMultipleSubmissions}
                      onChange={(v) => setConf("allowMultipleSubmissions", v)}
                      label="Multiple Submissions"
                      sub="Each submission triggers a new FMS instance"
                    />
                  </div>

                  <Btn
                    size="lg"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={15}
                          style={{ animation: "spin 0.8s linear infinite" }}
                        />{" "}
                        Publishing…
                      </>
                    ) : (
                      <>
                        <Zap size={15} /> Publish Open Form
                      </>
                    )}
                  </Btn>
                </div>
              </SectionCard>

              {/* Field type palette */}
              <SectionCard
                title="Add Fields"
                subtitle="Click to add to your form"
                icon={Plus}
                color={T.green}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {FIELD_TYPES.map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      onClick={() => addField(type)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 12px",
                        borderRadius: 10,
                        cursor: "pointer",
                        border: `1px solid ${T.border}`,
                        background: T.surf,
                        fontSize: 12,
                        fontWeight: 600,
                        color: T.text2,
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.background = `${color}08`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.background = T.surf;
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: `${color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={12} color={color} />
                      </div>
                      {label}
                    </button>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* ── Right: Field builder ─────────────────────────────────── */}
            <div>
              <SectionCard
                title="Form Fields"
                subtitle={`${fields.length} field${fields.length !== 1 ? "s" : ""} configured`}
                icon={FileText}
                action={
                  fields.length > 0 && (
                    <Pill
                      color={T.green}
                      bg={T.greenL}
                      border={T.greenB}
                      dot={T.green}
                    >
                      {fields.filter((f) => f.isRequired).length} required
                    </Pill>
                  )
                }
              >
                {fields.length === 0 ? (
                  <div
                    style={{
                      padding: "60px 24px",
                      textAlign: "center",
                      border: `2px dashed ${T.border}`,
                      borderRadius: 14,
                    }}
                  >
                    <Plus
                      size={28}
                      color={T.muted2}
                      style={{ marginBottom: 10 }}
                    />
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: T.muted,
                        marginBottom: 4,
                      }}
                    >
                      No fields yet
                    </div>
                    <div style={{ fontSize: 12, color: T.muted2 }}>
                      Click a field type on the left to add it
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {fields.map((field, idx) => (
                      <div kkey={field.fieldId || idx} className="field-card-enter">
                        <FieldCard
                          field={field}
                          index={idx}
                          total={fields.length}
                          onChange={updateField}
                          onRemove={removeField}
                          onMoveUp={(i) => moveField(i, -1)}
                          onMoveDown={(i) => moveField(i, 1)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: PREVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "preview" && (
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              animation: "fadeUp 0.3s ease",
            }}
          >
            {submitSuccess ? (
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 20,
                  padding: "60px 40px",
                  textAlign: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: T.greenL,
                    border: `1px solid ${T.greenB}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <CheckCircle2 size={28} color={T.green} />
                </div>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: T.text,
                    margin: "0 0 8px",
                  }}
                >
                  Form Submitted!
                </h2>
                <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
                  FMS workflow triggered successfully.
                </p>
                <div
                  style={{
                    background: T.accentL,
                    border: `1px solid ${T.accentB}`,
                    borderRadius: 10,
                    padding: "10px 16px",
                    display: "inline-block",
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: T.accent,
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      marginBottom: 3,
                    }}
                  >
                    Instance ID
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      color: T.text,
                    }}
                  >
                    {submitSuccess}
                  </div>
                </div>
                <br />
                <Btn onClick={() => setSubmitSuccess(null)}>
                  Submit another response
                </Btn>
              </div>
            ) : !selectedForm ? (
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 20,
                  padding: "60px 40px",
                  textAlign: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <Eye size={32} color={T.muted2} style={{ marginBottom: 12 }} />
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.muted,
                    marginBottom: 6,
                  }}
                >
                  No form selected
                </h3>
                <p style={{ fontSize: 13, color: T.muted2, marginBottom: 20 }}>
                  Go to Published Forms and click Open to preview a form
                </p>
                <Btn variant="secondary" onClick={() => setTab("forms")}>
                  View Published Forms
                </Btn>
              </div>
            ) : (
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                }}
              >
                {/* Form header */}
                <div
                  style={{
                    background: `linear-gradient(135deg,${T.accent},#4F46E5)`,
                    padding: "32px 36px",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileText size={22} color="#fff" />
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: "#fff",
                          margin: 0,
                        }}
                      >
                        {selectedForm.formName}
                      </h2>
                      {selectedForm.description && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.75)",
                            margin: "4px 0 0",
                          }}
                        >
                          {selectedForm.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div
                  style={{
                    padding: "28px 36px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                  }}
                >
                  {selectedForm.fields.map((field) => (
                    <PublicFormField
                      key={field.fieldId}
                      field={field}
                      value={submissionData[field.fieldId]}
                      onChange={(v) =>
                        setSubmissionData((p) => ({ ...p, [field.fieldId]: v }))
                      }
                    />
                  ))}

                  <div
                    style={{
                      paddingTop: 12,
                      borderTop: `1px solid ${T.border}`,
                    }}
                  >
                    <Btn
                      size="lg"
                      onClick={handleSubmit}
                      disabled={submitting}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      {submitting ? (
                        <>
                          <Loader2
                            size={15}
                            style={{ animation: "spin 0.8s linear infinite" }}
                          />{" "}
                          Triggering FMS…
                        </>
                      ) : (
                        <>
                          <Zap size={15} /> Submit &amp; Trigger FMS Workflow
                        </>
                      )}
                    </Btn>
                    <div
                      style={{
                        fontSize: 11,
                        color: T.muted2,
                        textAlign: "center",
                        marginTop: 8,
                      }}
                    >
                      Submitting this form will automatically launch the linked
                      FMS workflow
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: PUBLISHED FORMS
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "forms" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {forms.length === 0 ? (
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 20,
                  padding: "80px 40px",
                  textAlign: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <FileText
                  size={36}
                  color={T.muted2}
                  style={{ marginBottom: 14, opacity: 0.4 }}
                />
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.muted,
                    marginBottom: 6,
                  }}
                >
                  No forms published yet
                </h3>
                <p style={{ fontSize: 13, color: T.muted2, marginBottom: 20 }}>
                  Create your first form in the Form Builder tab
                </p>
                <Btn onClick={() => setTab("builder")}>
                  <Plus size={14} /> Create Form
                </Btn>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))",
                  gap: 14,
                }}
              >
                {forms.map((form) => {
                  const tpl = templates.find(
                    (t) => t._id === form.linkedTemplate,
                  );
                  return (
                    <div
                      key={form._id}
                      style={{
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        borderRadius: 16,
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        transition: "box-shadow 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 6px 24px rgba(0,0,0,0.08)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 1px 4px rgba(0,0,0,0.05)")
                      }
                    >
                      {/* Color bar */}
                      <div
                        style={{
                          height: 4,
                          background: `linear-gradient(90deg,${T.accent},#4F46E5)`,
                        }}
                      />

                      <div style={{ padding: "18px 20px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 10,
                            marginBottom: 12,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: T.text,
                                marginBottom: 3,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {form.formName}
                            </div>
                            {form.description && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: T.muted,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {form.description}
                              </div>
                            )}
                          </div>
                          <Pill
                            color={form.isActive ? T.green : T.muted}
                            bg={form.isActive ? T.greenL : T.surf}
                            border={form.isActive ? T.greenB : T.border}
                            dot={form.isActive ? T.green : T.muted2}
                          >
                            {form.isActive ? "Active" : "Inactive"}
                          </Pill>
                        </div>

                        {/* Meta chips */}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginBottom: 14,
                          }}
                        >
                          <Pill color={T.muted} bg={T.surf} border={T.border}>
                            {form.fields?.length || 0} fields
                          </Pill>
                          {tpl && (
                            <Pill
                              color={T.accent}
                              bg={T.accentL}
                              border={T.accentB}
                            >
                              ⚡ {tpl.templateName}
                            </Pill>
                          )}
                          {form.allowMultipleSubmissions && (
                            <Pill
                              color={T.purple}
                              bg={T.purpleL}
                              border="#DDD6FE"
                            >
                              Multi-submit
                            </Pill>
                          )}
                          <Pill color={T.muted} bg={T.surf} border={T.border}>
                            {fmtDate(form.createdAt)}
                          </Pill>
                        </div>

                        {/* Public URL */}
                        <div
                          style={{
                            background: T.surf,
                            border: `1px solid ${T.border}`,
                            borderRadius: 9,
                            padding: "8px 12px",
                            marginBottom: 14,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: T.muted2,
                                textTransform: "uppercase",
                                letterSpacing: "0.6px",
                                marginBottom: 2,
                              }}
                            >
                              Public URL
                            </div>
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: 11,
                                color: T.accent,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              /open-form/{form._id}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `/open-form/${form._id}`,
                              )
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: T.muted2,
                              padding: 4,
                              display: "flex",
                            }}
                          >
                            <Copy size={13} />
                          </button>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <Btn
                            size="sm"
                            style={{ flex: 1, justifyContent: "center" }}
                            onClick={() => {
                              setSelectedForm(form);
                              setSubmissionData({});
                              setTab("preview");
                            }}
                          >
                            <Eye size={13} /> Preview
                          </Btn>
                          <Btn
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedForm(form);
                              setSubmissionData({});
                              setTab("preview");
                            }}
                          >
                            <ExternalLink size={13} />
                          </Btn>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
