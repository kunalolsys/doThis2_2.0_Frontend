import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

export default function PermissionRoute({ children, required }) {
    const permissionsCookie = Cookies.get("permissions");

    if (!permissionsCookie) {
        return <Navigate to="/" replace />;
    }

    try {
        const permissions = JSON.parse(permissionsCookie);

        if (typeof permissions !== 'object' || permissions === null) {
            console.error("Permissions cookie is not a valid object:", permissions);
            return <Navigate to="/" replace />;
        }

        if (!permissions[required]) {
            return <Navigate to="/page-restrict-found" replace />;
        }
    } catch (error) {
        console.error("Failed to parse permissions from cookie:", error);
        return <Navigate to="/" replace />;
    }

    return children;
} 