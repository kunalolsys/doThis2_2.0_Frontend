import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Zap,
  LogOut,
} from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_BASE_URL;

const T = {
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  muted2: "#94a3b8",
  border: "#e2e8f0",
  accent: "#2563eb",
  accentL: "#eff6ff",
  accentB: "#bfdbfe",
  green: "#16a34a",
  greenL: "#f0fdf4",
  greenB: "#bbf7d0",
  red: "#dc2626",
  redL: "#fef2f2",
  redB: "#fecaca",
  input: "#ffffff",
};

// Component to handle individual dynamic select/dropdown fields
const DynamicSelectField = ({ field, value, onChange, error, commonStyle }) => {
  const [masterOptions, setMasterOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (field.optionType === "MASTER" && field.masterSource) {
      setLoadingOptions(true);

      // Load API token from environment variable
      const token = import.meta.env.VITE_SUVIDHA_API_TOKEN;

      axios
        .get(`https://mis.suvidhastores.com/api/load-dtenData`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // or use "token": token / "x-api-key": token depending on your server spec
          },
        })
        .then((res) => {
          // Normalize response structure (support array or res.data.data)
          const optionsList = Array.isArray(res.data)
            ? res.data
            : res.data || res.data?.options || [];

          setMasterOptions(optionsList);
        })
        .catch((err) => {
          console.error(`Failed to load options for ${field.label}:`, err);
          toast.error(`Failed to load ${field.label} options`);
        })
        .finally(() => setLoadingOptions(false));
    }
  }, [field.optionType, field.masterSource, field.label]);

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...commonStyle,
        appearance: "none",
        cursor: loadingOptions ? "wait" : "pointer",
      }}
      disabled={loadingOptions}
    >
      <option value="">
        {loadingOptions
          ? `Loading ${field.label}...`
          : field.placeholder || `Select ${field.label}`}
      </option>

      {field.optionType === "MASTER"
        ? masterOptions.map((opt, i) => {
            // Handles string options, object options { label, value }, or { name, _id }
            const optLabel =
              typeof opt === "string"
                ? opt
                : opt.label || opt.name || opt.vendorName || opt.vendor_name;
            const optVal =
              typeof opt === "string"
                ? opt
                : opt.vendor_name || opt._id || opt.id || optLabel;

            return (
              <option key={optVal || i} value={optVal}>
                {optLabel}
              </option>
            );
          })
        : (field.options || [])
            .filter((opt) => opt !== "") // Filter out empty options strings
            .map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
    </select>
  );
};

export default function PublicOpenForm() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);

  const [employeeCode, setEmployeeCode] = useState("");
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const [submissionData, setSubmissionData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [errors, setErrors] = useState({});

  // FETCH FORM
  useEffect(() => {
    fetchForm();
  }, []);

  const fetchForm = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/open-forms/${slug}`);

      setForm(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // VERIFY EMPLOYEE
  const verifyEmployee = async (code = employeeCode) => {
    try {
      setVerifying(true);

      const res = await axios.post(`${API}/open-forms/verify-user`, {
        employeeCode: code,
      });

      setVerifiedUser(res.data.data);
      localStorage.setItem(`verifiedEmployee_${slug}`, code);
      toast.success("Employee verified successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid employee code");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const savedCode = localStorage.getItem(`verifiedEmployee_${slug}`);

    if (savedCode) {
      setEmployeeCode(savedCode);
      verifyEmployee(savedCode);
    }
  }, [slug]);

  // VALIDATION
  const validateField = (field, value) => {
    if (field.isRequired) {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return `${field.label} is required`;
      }
    }

    if (field.fieldType === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Invalid email address";
    }

    if (field.fieldType === "phone" && value) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(value)) return "Invalid mobile number";
    }

    if (field.fieldType === "url" && value) {
      try {
        new URL(value);
      } catch {
        return "Invalid URL";
      }
    }

    if (field.fieldType === "number" && value) {
      if (isNaN(value)) return `${field.label} must be a number`;
    }

    return null;
  };

  const validateForm = () => {
    const newErrors = {};

    form.fields.forEach((field) => {
      const value = submissionData[field.fieldId];
      const error = validateField(field, value);

      if (error) {
        newErrors[field.fieldId] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    toast.custom((t) => (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: 18,
          width: 360,
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 6,
          }}
        >
          Confirm Submission
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            marginBottom: 18,
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to submit this form and trigger the workflow?
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={() => toast.dismiss(t)}
            style={{
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#0f172a",
              padding: "10px 14px",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              try {
                toast.dismiss(t);

                if (!validateForm()) return;

                setSubmitting(true);

                const res = await axios.post(
                  `${API}/open-forms/${slug}/submit`,
                  {
                    employeeCode,
                    submissionData,
                  },
                );

                setSubmitSuccess(
                  res?.data?.data?.triggeredInstance?.instanceId || "Submitted",
                );
                setSubmissionData({});
                toast.success("Form submitted successfully");
              } catch (err) {
                toast.error(
                  err?.response?.data?.message || "Failed to submit form",
                );
              } finally {
                setSubmitting(false);
              }
            }}
            style={{
              border: "none",
              background: "#2563eb",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Yes, Submit
          </button>
        </div>
      </div>
    ));
  };

  // FIELD RENDERER
  const renderField = (field) => {
    const commonStyle = {
      width: "100%",
      padding: "13px 14px",
      borderRadius: 14,
      border: `1px solid ${errors[field.fieldId] ? T.red : T.border}`,
      outline: "none",
      background: T.input,
      fontSize: 14,
      transition: "0.2s",
    };

    switch (field.fieldType) {
      case "textarea":
        return (
          <textarea
            rows={4}
            placeholder={field.placeholder}
            value={submissionData[field.fieldId] || ""}
            onChange={(e) =>
              setSubmissionData((p) => ({
                ...p,
                [field.fieldId]: e.target.value,
              }))
            }
            style={commonStyle}
          />
        );

      case "select":
        return (
          <DynamicSelectField
            field={field}
            value={submissionData[field.fieldId]}
            onChange={(val) =>
              setSubmissionData((p) => ({
                ...p,
                [field.fieldId]: val,
              }))
            }
            error={errors[field.fieldId]}
            commonStyle={commonStyle}
          />
        );

      case "radio":
        return (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {field.options?.map((opt, i) => (
              <label
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: T.text,
                }}
              >
                <input
                  type="radio"
                  name={field.fieldId}
                  checked={submissionData[field.fieldId] === opt}
                  onChange={() =>
                    setSubmissionData((p) => ({
                      ...p,
                      [field.fieldId]: opt,
                    }))
                  }
                />
                {opt}
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
              fontSize: 14,
              color: T.text,
            }}
          >
            <input
              type="checkbox"
              checked={submissionData[field.fieldId] || false}
              onChange={(e) =>
                setSubmissionData((p) => ({
                  ...p,
                  [field.fieldId]: e.target.checked,
                }))
              }
            />
            {field.label}
          </label>
        );

      case "date":
        return (
          <input
            type="date"
            value={submissionData[field.fieldId] || ""}
            onChange={(e) =>
              setSubmissionData((p) => ({
                ...p,
                [field.fieldId]: e.target.value,
              }))
            }
            style={commonStyle}
          />
        );

      case "number":
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            value={submissionData[field.fieldId] || ""}
            onChange={(e) =>
              setSubmissionData((p) => ({
                ...p,
                [field.fieldId]: e.target.value,
              }))
            }
            style={commonStyle}
          />
        );

      case "email":
        return (
          <input
            type="email"
            placeholder={field.placeholder}
            value={submissionData[field.fieldId] || ""}
            onChange={(e) =>
              setSubmissionData((p) => ({
                ...p,
                [field.fieldId]: e.target.value,
              }))
            }
            style={commonStyle}
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            placeholder={field.placeholder}
            value={submissionData[field.fieldId] || ""}
            onChange={(e) =>
              setSubmissionData((p) => ({
                ...p,
                [field.fieldId]: e.target.value,
              }))
            }
            style={commonStyle}
          />
        );

      case "url":
        return (
          <input
            type="url"
            placeholder={field.placeholder}
            value={submissionData[field.fieldId] || ""}
            onChange={(e) =>
              setSubmissionData((p) => ({
                ...p,
                [field.fieldId]: e.target.value,
              }))
            }
            style={commonStyle}
          />
        );

      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            value={submissionData[field.fieldId] || ""}
            onChange={(e) =>
              setSubmissionData((p) => ({
                ...p,
                [field.fieldId]: e.target.value,
              }))
            }
            style={commonStyle}
          />
        );
    }
  };

  // LOADING
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: T.bg,
        }}
      >
        <Loader2
          size={34}
          color={T.accent}
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  // NOT FOUND
  if (!form) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: T.card,
            padding: 40,
            borderRadius: 24,
            border: `1px solid ${T.border}`,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: T.text,
            }}
          >
            Form Not Found
          </h2>

          <p style={{ color: T.muted, marginTop: 8 }}>
            This form may be inactive or removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        padding: "40px 16px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background: "linear-gradient(135deg,#2563eb,#4f46e5)",
              padding: "36px",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              {verifiedUser && (
                <button
                  onClick={() => {
                    localStorage.removeItem(`verifiedEmployee_${slug}`);
                    setVerifiedUser(null);
                    setEmployeeCode("");
                    setSubmissionData({});
                    setErrors({});
                    toast.success("Logged out successfully");
                  }}
                  title="Change Employee"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.25)",
                    background: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all .2s ease",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                  }}
                >
                  <LogOut size={18} />
                </button>
              )}

              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={26} color="#fff" />
              </div>

              <div style={{ flex: 1, paddingRight: 60 }}>
                <h1
                  style={{
                    color: "#fff",
                    fontSize: 24,
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  {form.formName}
                </h1>

                <p
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    marginTop: 4,
                    fontSize: 13,
                  }}
                >
                  {form.description}
                </p>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div style={{ padding: "32px" }}>
            {!verifiedUser ? (
              <div style={{ maxWidth: 420, margin: "0 auto" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: T.accentL,
                    border: `1px solid ${T.accentB}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <ShieldCheck size={30} color={T.accent} />
                </div>

                <h2
                  style={{
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: 800,
                    marginBottom: 8,
                    color: T.text,
                  }}
                >
                  Employee Verification
                </h2>

                <p
                  style={{
                    textAlign: "center",
                    color: T.muted,
                    fontSize: 13,
                    marginBottom: 24,
                  }}
                >
                  Enter your employee code to continue
                </p>

                <input
                  placeholder="Enter employee code"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: `1px solid ${T.border}`,
                    outline: "none",
                    fontSize: 14,
                    marginBottom: 18,
                  }}
                />

                <button
                  onClick={() => verifyEmployee(employeeCode)}
                  disabled={verifying}
                  style={{
                    width: "100%",
                    border: "none",
                    background: T.accent,
                    color: "#fff",
                    padding: "14px 16px",
                    borderRadius: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {verifying ? "Verifying..." : "Verify & Continue"}
                </button>
              </div>
            ) : (
              <>
                {/* VERIFIED USER */}
                <div
                  style={{
                    padding: 20,
                    borderRadius: 22,
                    background:
                      "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06))",
                    border: `1px solid ${T.greenB}`,
                    marginBottom: 30,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: T.green,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      {verifiedUser?.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: T.green,
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Verified Employee
                      </div>

                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: T.text,
                        }}
                      >
                        {verifiedUser?.name}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: T.muted,
                          marginTop: 4,
                        }}
                      >
                        EMP: {verifiedUser?.employeeCode}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FORM FIELDS */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 22,
                  }}
                >
                  {form.fields.map((field) => (
                    <div key={field.fieldId}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 700,
                          color: T.text,
                          marginBottom: 8,
                        }}
                      >
                        {field.label}

                        {field.isRequired && (
                          <span
                            style={{
                              color: T.red,
                              marginLeft: 4,
                            }}
                          >
                            *
                          </span>
                        )}
                      </label>

                      {renderField(field)}

                      {errors[field.fieldId] && (
                        <div
                          style={{
                            color: T.red,
                            fontSize: 12,
                            marginTop: 6,
                          }}
                        >
                          {errors[field.fieldId]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* SUBMIT BUTTON */}
                <div
                  style={{
                    marginTop: 36,
                    paddingTop: 24,
                    borderTop: `1px solid ${T.border}`,
                  }}
                >
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      width: "100%",
                      border: "none",
                      background: T.accent,
                      color: "#fff",
                      padding: "16px",
                      borderRadius: 16,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 14,
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          size={17}
                          style={{
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        Triggering Workflow...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Submit & Trigger Workflow
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        *{
          box-sizing:border-box;
        }

        body{
          margin:0;
          font-family: Inter, sans-serif;
          background:${T.bg};
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
