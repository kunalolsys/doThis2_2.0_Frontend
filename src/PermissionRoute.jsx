import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const PermissionRoute = ({ children, requiredPermission }) => {
    const isLoggedIn = Cookies.get('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        // If not logged in, redirect to the login page
        return <Navigate to="/" replace />;
    }

    const role = Cookies.get('role');
    // The 'Admin' role has all permissions.
    if (role === 'Admin') {
        return children;
    }

    const permissionsCookie = Cookies.get('permissions');
    if (!permissionsCookie) {
        // If permissions are not found, deny access as a safeguard
        return <Navigate to="/page-restrict-found" replace />;
    }

    const permissions = JSON.parse(permissionsCookie);

    if (permissions[requiredPermission]) {
        return children;
    }

    // If permission is not found, redirect to the access denied page
    return <Navigate to="/page-restrict-found" replace />;
};

export default PermissionRoute;