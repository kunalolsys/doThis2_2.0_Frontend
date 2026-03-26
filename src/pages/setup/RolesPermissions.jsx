import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Shield, ShieldCheck, UserCog, Users, LayoutGrid, FileText, Lock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { fetchRoles, createRole, updateRole, deleteRole } from '../../redux/slices/role/roleSlice';


// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';


const permissionMap = {
  setup: 'Setup',
  fmsEngine: 'FmsEngine',
  reports: 'Reports',
  delegationTask: 'Delegation Task',
};

const transformRoles = (roles) => {
  const nonDeletableRoles = ["Owner", "Sr. Manager", "Member"];
  return roles.map(role => ({
    ...role,
    setup: role.permissions.includes(permissionMap.setup),
    fmsEngine: role.permissions.includes(permissionMap.fmsEngine),
    reports: role.permissions.includes(permissionMap.reports),
    delegationTask: role.permissions.includes(permissionMap.delegationTask),
    isSystem: nonDeletableRoles.includes(role.name) || !role.canDelete,
  }));
};

// --- Helper for Role Icons ---
const RoleIcon = ({ name }) => {
  if (name === 'Owner') return <ShieldCheck className="w-4 h-4 text-purple-600" />;
  if (name === 'Admin') return <Lock className="w-4 h-4 text-slate-600" />;
  if (name.includes('Manager')) return <UserCog className="w-4 h-4 text-blue-600" />;
  return <Users className="w-4 h-4 text-slate-500" />;
};

// --- Main Component ---
const RolesPermissions = () => {
  const dispatch = useDispatch();
  const { roles: rawRoles, status, error } = useSelector((state) => state.roles);
  const roles = useMemo(() => {
    const transformed = transformRoles(rawRoles);
    const desiredOrder = ["Admin", "Owner", "Sr. Manager", "Manager", "Member"];

    return transformed.sort((a, b) => {
      const indexA = desiredOrder.indexOf(a.name);
      const indexB = desiredOrder.indexOf(b.name);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB; // Both are in the desired order list
      }
      if (indexA !== -1) return -1; // a is in the list, b is not
      if (indexB !== -1) return 1;  // b is in the list, a is not
      return a.name.localeCompare(b.name); // Neither are in the list, sort alphabetically
    });
  }, [rawRoles]);
  // Get user data from cookies
  const user = {
    name: Cookies.get('name') || '',
    role: { name: Cookies.get('role') || '' },
    email: Cookies.get('email') || '',
  };
  const permissions = JSON.parse(Cookies.get('permissions') || '{}');

  const hasPermission = (permission) => {
    if (!user) {
      return false;
    }
    if (user.role.name === 'Admin') {
      return true;
    }
    return !!permissions[permission];
  };

  const canViewPage = hasPermission('setup_view');

  useEffect(() => {
    if (canViewPage) dispatch(fetchRoles());
  }, [canViewPage, dispatch]);


  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState({
    setup: false,
    fmsEngine: false,
    reports: false,
    delegationTask: false,
  });

  // We moved this to the useEffect above to only fetch if user has permission
  // useEffect(() => {
  //   if (status === 'idle') {
  //     dispatch(fetchRoles());
  //   }
  // }, [status, dispatch]);

  // Handle toggling a permission
  const handlePermissionChange = (roleId, permissionKey, value) => {
    const roleToUpdate = roles.find(r => r._id === roleId);
    if (!roleToUpdate) return;

    const updatedRole = { ...roleToUpdate, [permissionKey]: value };

    const backendPermissions = Object.keys(permissionMap)
      .filter(key => updatedRole[key])
      .map(key => permissionMap[key]);

    dispatch(updateRole({ id: roleId, permissions: backendPermissions }));
  };

  // Handle deleting a role
  const handleDeleteRole = (roleId) => {
    const roleToDelete = roles.find(r => r._id === roleId);
    if (roleToDelete.isSystem) {
      alert("System roles cannot be deleted.");
      return;
    }
    dispatch(deleteRole(roleId));
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      alert("Role name is required.");
      return;
    }

    const permissions = Object.keys(newRolePermissions)
      .filter(key => newRolePermissions[key])
      .map(key => permissionMap[key]);

    dispatch(createRole({ name: newRoleName, permissions }));
    setNewRoleName('');
    setNewRolePermissions({ setup: false, fmsEngine: false, reports: false, delegationTask: false });
    setIsDialogOpen(false);
  };

  // if (!canViewPage) {
  //   return (
  //     <div className="flex justify-center items-center h-full p-8">
  //       <Card className="w-full max-w-md text-center p-8">
  //         <CardTitle className="text-2xl font-bold text-red-600">Access Denied</CardTitle>
  //         <CardDescription className="mt-2">You do not have permission to view this page.</CardDescription>
  //       </Card>
  //     </div>
  //   );
  // }

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'failed') {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 flex justify-center items-start">
      <Card className="w-full shadow-xl border-slate-200 bg-white">

        {/* --- Header --- */}
        <CardHeader className="border-b border-slate-100 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Roles & Permissions</CardTitle>
              <CardDescription className="mt-1 text-sm text-slate-500">
                Manage access levels and control what users can do within the application.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Role</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="role-name"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., 'Auditor'"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Permissions</Label>
                    <div className="col-span-3 grid grid-cols-2 gap-4">
                      {Object.keys(permissionMap).map(key => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${key}`}
                            checked={newRolePermissions[key]}
                            onCheckedChange={(checked) =>
                              setNewRolePermissions(prev => ({ ...prev, [key]: checked }))
                            }
                          />
                          <label
                            htmlFor={`perm-${key}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permissionMap[key]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateRole}>Create Role</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[300px] py-4 pl-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Role Details</TableHead>
                  <TableHead className="text-center font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="w-4 h-4" />Setup
                    </div>
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <LayoutGrid className="w-4 h-4" /> FMS Engine
                    </div>
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" /> Reports
                    </div>
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" /> Delegation Task
                    </div>
                  </TableHead>
                  <TableHead className="text-right pr-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role._id} className="hover:bg-slate-50/50 transition-colors border-slate-100">

                    {/* Role Name & Description */}
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 bg-slate-100 rounded-lg">
                          <RoleIcon name={role.name} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-base">{role.name}</span>
                            {role.isSystem && (
                              <Badge variant="secondary" className="text-xs px-1.5 h-5 bg-slate-100 text-slate-500 border-slate-200">System</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Manage Users Switch */}
                    <TableCell className="text-center">
                      <Switch
                        checked={role.setup}
                        onCheckedChange={(value) => handlePermissionChange(role._id, 'setup', value)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </TableCell>

                    {/* FMS Design Switch */}
                    <TableCell className="text-center">
                      <Switch
                        checked={role.fmsEngine}
                        onCheckedChange={(value) => handlePermissionChange(role._id, 'fmsEngine', value)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </TableCell>

                    {/* Reporting Switch */}
                    <TableCell className="text-center">
                      <Switch
                        checked={role.reports}
                        onCheckedChange={(value) => handlePermissionChange(role._id, 'reports', value)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </TableCell>

                    {/* Delegation Task Switch */}
                    <TableCell className="text-center">
                      <Switch
                        checked={role.delegationTask}
                        onCheckedChange={(value) => handlePermissionChange(role._id, 'delegationTask', value)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={role.isSystem}
                        onClick={() => handleDeleteRole(role._id)}
                        className={`h-9 w-9 transition-colors ${role.isSystem
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        title={role.isSystem ? "System roles cannot be deleted" : "Delete Role"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPermissions;