import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { getAccessToken } from "./lib/tokenManager";

const PermissionRoute = ({ children, requiredPermission }) => {
  const token = getAccessToken();
  // 🔴 AUTH CHECK
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 🟡 PERMISSION CHECK
  const permissionsCookie = Cookies.get("permissions");

  if (!permissionsCookie) {
    return <Navigate to="/page-restrict-found" replace />;
  }

  let permissions = {};

  try {
    permissions = JSON.parse(permissionsCookie);
  } catch (e) {
    console.error("Invalid permissions cookie");
    return <Navigate to="/" replace />;
  }

  // 🟢 ADMIN BYPASS
  const role = Cookies.get("role");
  if (role === "Admin") {
    return children;
  }

  // 🔴 PERMISSION DENIED
  if (!permissions[requiredPermission]) {
    return <Navigate to="/page-restrict-found" replace />;
  }

  return children;
};

export default PermissionRoute;