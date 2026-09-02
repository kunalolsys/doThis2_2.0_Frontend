import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { getAccessToken } from "./lib/tokenManager";

const PermissionRoute = ({
  children,
  requiredPermission,
  isSuperOnly = false,
}) => {
  const token = getAccessToken();

  // 🔴 AUTH CHECK
  if (!token) {
    return <Navigate to="/" replace />;
  }

  const role = (Cookies.get("role") || "").trim().toLowerCase();
  const isSuper = role.includes("super");

  // 🔒 STRICT SUPER USER ONLY ROUTE CHECK
  // (roles_permissions & module_setting are strictly for Super User)
  if (
    isSuperOnly ||
    // requiredPermission === "roles_permissions" ||
    requiredPermission === "module_setting"
  ) {
    if (!isSuper) {
      return <Navigate to="/page-restrict-found" replace />;
    }
    return children;
  }

  // 🟢 ONLY SUPER USER BYPASSES GRANULAR ROUTE CHECKS
  if (isSuper) {
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
    console.error("Invalid permissions format in route check", e);
  }

  // 🔴 STRICT BOOLEAN PERMISSION CHECK (No Role Bypasses)
  const hasAccess =
    permissions[requiredPermission] === true ||
    permissions[`${requiredPermission}_view`] === true ||
    permissions[`${requiredPermission}_read`] === true;

  if (!hasAccess) {
    return <Navigate to="/page-restrict-found" replace />;
  }

  return children;
};

export default PermissionRoute;
