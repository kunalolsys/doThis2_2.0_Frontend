import React, { useState, useEffect } from "react";
import "@radix-ui/themes/styles.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TaskPage from "./pages/TaskPage";
import ProtectedLayout from "./ProtectedLayout";
import Login from "./pages/Login";

// dashboard imports
import AdminDashboard from "./pages/dashboard/AdminDashboard";

// setup imports
import RolesPermissions from "./pages/setup/RolesPermissions";
import Users from "./pages/setup/Users";
import WorkShifts from "./pages/setup/WorkShifts";
import DepartmentCalender from "./pages/setup/DepartmentCalender";
import DataMaster from "./pages/setup/DataMaster";

// my-day imports
import Launchpad from "./pages/myDay/Launchpad";
import ManagerView from "./pages/myDay/ManagerView";
import SrManagerView from "./pages/myDay/SrManagerView";
import OwnerView from "./pages/myDay/OwnerView";
import MyTask from "./pages/myDay/MyTask";

// reports imports
import MisReports from "./pages/reports/MisReports";
import FmsReports from "./pages/reports/FmsReports";
import UpcomingOngoingFms from "./pages/fmsEngine/UpcomingOngoingFms";
import FmsTemplates from "./pages/fmsEngine/FmsTemplates";
import FmsLaunch from "./pages/fmsEngine/FmsLaunch";
import CreateNewFmsTem from "./pages/fmsEngine/CreateNewFmsTem";
import AddUser from "./pages/setup/AddUser";

import { Toaster } from "sonner";
import EditUser from "./pages/setup/EditUser";
import PageNotFound from "./pages/PageNotFound";
import ResetPassword from "./pages/ResetPassword";
import AccessDenied from "./pages/AccessDenied";
import PermissionRoute from "./PermissionRoute";
import ImportTask from "./pages/ImportTask";
import Profile from "./pages/Profile";
import SessionTimeoutDialog from "./components/SessionTimeoutDialog";
import LogsDashboard from "./pages/logs";
import FmsLaunchedView from "./pages/fmsEngine/fmsInstanceView";
import { SocketProvider } from "./context/SocketContext";
import { TaskChatProvider } from "./context/TaskChatContext";

function App() {
  const [isSessionTimeoutModalOpen, setIsSessionTimeoutModalOpen] =
    useState(false);

  const handleSessionTimeout = () => {
    setIsSessionTimeoutModalOpen(true);
  };

  const handleCloseSessionTimeoutModal = () => {
    setIsSessionTimeoutModalOpen(false);
  };

  useEffect(() => {
    const sessionTimeoutListener = () => {
      handleSessionTimeout();
    };

    window.addEventListener("session-timeout", sessionTimeoutListener);

    return () => {
      window.removeEventListener("session-timeout", sessionTimeoutListener);
    };
  }, []);

  return (
    <>
      <Toaster richColors position="top-center" />
      <BrowserRouter>
        <SessionTimeoutDialog
          open={isSessionTimeoutModalOpen}
          onCancel={handleCloseSessionTimeoutModal}
        />
        <SocketProvider>
          <TaskChatProvider>
            <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/page-restrict-found" element={<AccessDenied />} />

            <Route element={<ProtectedLayout />}>

            {/* dashboard routes - assuming all logged-in users can see this */}
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/logs" element={<LogsDashboard />} />
            <Route path="/profile" element={<Profile />} />
            {/* My Day Routes */}
            <Route path="/my-day/launchpad" element={<Launchpad />} />
            <Route path="/my-day/mytasks" element={<MyTask />} />
            <Route path="/my-day/view" element={<ManagerView />} />
            {/* <Route path="/my-day/sr-manager-view" element={<SrManagerView />} />
            <Route path="/my-day/owner-view" element={<OwnerView />} /> */}
            {/* Delegation Task */}
            <Route
              path="/delegation-tasks"
              element={
                <PermissionRoute requiredPermission="delegation_task_view">
                  <TaskPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/import-tasks"
              element={
                <PermissionRoute requiredPermission="delegation_task_view">
                  <ImportTask />
                </PermissionRoute>
              }
            />
            {/* FMS Engine Routes */}
            <Route
              path="/fms-engine/upcoming"
              element={
                <PermissionRoute requiredPermission="fmsengine_view">
                  <UpcomingOngoingFms />
                </PermissionRoute>
              }
            />
            <Route
              path="/fms-engine/templates"
              element={
                <PermissionRoute requiredPermission="fmsengine_view">
                  <FmsTemplates />
                </PermissionRoute>
              }
            />
            <Route
              path="/fms-engine/launch"
              element={
                <PermissionRoute requiredPermission="fmsengine_view">
                  <FmsLaunch />
                </PermissionRoute>
              }
            />
            <Route
              path="/fms-engine/create-template"
              element={
                <PermissionRoute requiredPermission="fmsengine_view">
                  <CreateNewFmsTem />
                </PermissionRoute>
              }
            />
            <Route
              path="/fms-engine/edit-template/:id"
              element={<CreateNewFmsTem />}
            />{" "}
            <Route
              path="/fms-engine/instance/:id"
              element={<FmsLaunchedView />}
            />
            {/* Reports Routes */}
            <Route
              path="/reports/mis"
              element={
                <PermissionRoute requiredPermission="reports_view">
                  <MisReports />
                </PermissionRoute>
              }
            />
            <Route
              path="/reports/fms"
              element={
                <PermissionRoute requiredPermission="reports_view">
                  <FmsReports />
                </PermissionRoute>
              }
            />
            {/* dashboard routes */}
            {/* setup routes */}
            <Route
              path="/setup/roles-permissions"
              element={
                <PermissionRoute requiredPermission="setup_view">
                  <RolesPermissions />
                </PermissionRoute>
              }
            />
            <Route
              path="/setup/departments-calendar"
              element={
                <PermissionRoute requiredPermission="setup_view">
                  <DepartmentCalender />
                </PermissionRoute>
              }
            />
            <Route
              path="/setup/work-shifts"
              element={
                <PermissionRoute requiredPermission="setup_view">
                  <WorkShifts />
                </PermissionRoute>
              }
            />
            <Route
              path="/setup/data-masters"
              element={
                <PermissionRoute requiredPermission="setup_view">
                  <DataMaster />
                </PermissionRoute>
              }
            />
            <Route
              path="/setup/users"
              element={
                <PermissionRoute requiredPermission="setup_view">
                  <Users />
                </PermissionRoute>
              }
            />
            <Route
              path="/setup/add-user"
              element={
                <PermissionRoute requiredPermission="setup_view">
                  <AddUser />
                </PermissionRoute>
              }
            />
            <Route
              path="/setup/edit-user/:id"
              element={
                <PermissionRoute requiredPermission="setup_view">
                  <EditUser />
                </PermissionRoute>
              }
            />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          </TaskChatProvider>
        </SocketProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
