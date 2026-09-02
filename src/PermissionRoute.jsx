import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { getAccessToken } from "./lib/tokenManager";

const PermissionRoute = ({ children, requiredPermission }) => {
  const token = getAccessToken();

  // 🔴 AUTH CHECK
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 🟢 ADMIN / SYSTEM ROLE BYPASS
  const role = (Cookies.get("role") || "").toLowerCase();
  if (
    role.includes("admin") ||
    role.includes("owner") ||
    role.includes("super")
  ) {
    return children;
  }

  // 🟡 READ PERMISSIONS (Cookie or LocalStorage Fallback)
  let permissions = {};
  try {
    const permCookie = Cookies.get("permissions");
    const rawData = permCookie
      ? decodeURIComponent(permCookie)
      : localStorage.getItem("permissions");
    if (rawData) {
      permissions = JSON.parse(rawData);
    }
  } catch (e) {
    console.error("Invalid permissions format", e);
  }

  // 🔴 PERMISSION DENIED CHECK
  const hasAccess =
    permissions[requiredPermission] ||
    permissions[`${requiredPermission}_view`] ||
    permissions[`${requiredPermission}_read`];

  if (!hasAccess) {
    return <Navigate to="/page-restrict-found" replace />;
  }

  return children;
};

export default PermissionRoute;
