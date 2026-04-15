import React, { useEffect, useState } from "react";
import {
  FilePenLine,
  Settings,
  Trash2,
  Search,
  EyeIcon,
  PauseCircle,
  PlayCircle,
  StopCircle,
  Eye,
} from "lucide-react";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import api from "../../lib/api";
import { toast } from "sonner";
import { formatDate, formatLabel } from "../../lib/utilFunctions";
import { cn } from "../../lib/utils";
import { useDebounce } from "../../lib/debounce";
import DataPagination from "../../components/ui/commonPagination";
import { useNavigate } from "react-router-dom";
import { Modal,Input as AntdInput } from "antd";
const { TextArea } = AntdInput;

const getStatusBadge = (status) => {
  if (status === "In Progress") {
    return (
      <Badge
        variant="default"
        className="bg-blue-100 text-blue-800 hover:bg-blue-100"
      >
        {status}
      </Badge>
    );
  }
  if (status === "Scheduled") {
    return (
      <Badge
        variant="default"
        className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      >
        {status}
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
};

// Helper for Table Header (to avoid duplication)
const FmsTableHeader = () => (
  <TableHeader>
    <TableRow>
      <TableHead className="whitespace-nowrap">LAUNCH ID</TableHead>
      <TableHead className="whitespace-nowrap">LAUNCH DATE</TableHead>
      <TableHead className="whitespace-nowrap">FMS NAME</TableHead>
      {/* <TableHead className="whitespace-nowrap">DESCRIPTION</TableHead> */}
      {/* <TableHead className="whitespace-nowrap">FMS DURATION</TableHead> */}
      <TableHead className="whitespace-nowrap">SR. MANAGER</TableHead>
      <TableHead className="whitespace-nowrap">MANAGER</TableHead>
      <TableHead className="whitespace-nowrap">START DATE</TableHead>
      <TableHead className="whitespace-nowrap">END DATE</TableHead>
      <TableHead className="whitespace-nowrap">OVERALL STATUS</TableHead>
      {/* <TableHead className="whitespace-nowrap">PROGRESS</TableHead> */}
      <TableHead className="text-right whitespace-nowrap">ACTIONS</TableHead>
    </TableRow>
  </TableHeader>
);

// Helper for Action Icons (to avoid duplication)
const FmsTableActions = ({ id, handleChangeAction, fms }) => (
  <TableCell className="text-right whitespace-nowrap">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* VIEW */}
        <DropdownMenuItem onClick={() => handleChangeAction("Edit", id)}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>

        {/* HOLD */}
        {fms.status !== "Onhold" && fms.status !== "Stopped" && (
          <DropdownMenuItem onClick={() => handleChangeAction("Hold", id)}>
            <PauseCircle className="w-4 h-4 mr-2 text-amber-500" />
            Put on Hold
          </DropdownMenuItem>
        )}

        {/* RESUME */}
        {fms.status === "Onhold" && (
          <DropdownMenuItem onClick={() => handleChangeAction("Resume", id)}>
            <PlayCircle className="w-4 h-4 mr-2 text-green-500" />
            Resume Instance
          </DropdownMenuItem>
        )}

        {/* STOP */}
        {fms.status !== "Stopped" && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleChangeAction("Stop", id)}
          >
            <StopCircle className="w-4 h-4 mr-2" />
            Stop Instance
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  </TableCell>
);

// --- Main Component ---
const UpcomingOngoingFms = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState("");
  const debounceSearch = useDebounce(searchTerm);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTab, setActiveTab] = useState("upcoming");

  const [FMS, setFMS] = useState([]);
  const fetchFMS = async (search, activeTab, page, limit) => {
    try {
      const payload = { search, status: activeTab, page, limit };
      const res = await api.post(`/fms/instances/`, payload);
      const FMSData = res.data.data || [];
      setPagination(res.data.pagination);
      setFMS(FMSData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tasks");
    }
  };

  const upcomingFMS =
    Array.isArray(FMS) && FMS.length > 0
      ? FMS.filter((items) => items.status == "Upcoming")
      : [];
  const onGoingFMS =
    Array.isArray(FMS) && FMS.length > 0
      ? FMS.filter(
          (items) => items.status == "Ongoing" || items.status == "InProcess",
        )
      : [];
  const completedFMS =
    Array.isArray(FMS) && FMS.length > 0
      ? FMS.filter((items) => items.status == "Completed")
      : [];
  const onHoldFMS =
    Array.isArray(FMS) && FMS.length > 0
      ? FMS.filter((items) => items.status == "Onhold")
      : [];
  const stoppedFMS =
    Array.isArray(FMS) && FMS.length > 0
      ? FMS.filter((items) => items.status == "Stopped")
      : [];
  useEffect(() => {
    fetchFMS(debounceSearch, activeTab, page, limit);
  }, [debounceSearch, page, limit, activeTab]);
  const handleTabChange = (value) => {
    setActiveTab(value);
    setPage(1); // reset pagination
    setLimit(10); // reset pagination
  };
  const handleChangeAction = async (val, id) => {
    try {
      // ✅ VIEW
      if (val === "Edit") {
        return navigate(`/fms-engine/instance/${id}`);
      }

      // ✅ HOLD / STOP → SHOW MODAL WITH REMARK
      if (val === "Hold" || val === "Stop") {
        let remark = "";

        Modal.confirm({
          title: val === "Hold" ? "Put Instance on Hold?" : "Stop Instance?",
          content: (
            <div className="space-y-3">
              <p>
                {val === "Hold"
                  ? "⚠️ All running and upcoming tasks will be paused."
                  : "🚨 This will permanently stop the instance and all incomplete tasks."}
              </p>

              <TextArea
                rows={3}
                placeholder="Enter reason (optional)"
                onChange={(e) => (remark = e.target.value)}
              />
            </div>
          ),
          okText: val === "Hold" ? "Yes, Hold" : "Yes, Stop",
          okType: val === "Stop" ? "danger" : "default",
          cancelText: "Cancel",

          onOk: async () => {
            if (val === "Hold") {
              await api.put(`/fms/instances/${id}/hold`, {
                reason: remark || "Manual hold",
              });
              setActiveTab("onhold");
              toast.success("Instance put on hold");
            }

            if (val === "Stop") {
              await api.put(`/fms/instances/${id}/stop`, {
                reason: remark || "Manual stop",
              });
              setActiveTab("stopped");
              toast.success("Instance stopped");
            }

            fetchFMS();
          },
        });

        return;
      }

      // ✅ RESUME (no remark needed)
      if (val === "Resume") {
        await api.put(`/fms/instances/${id}/resume`);
        toast.success("Instance resumed");
        fetchFMS();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };
  return (
    <div className="m-4">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl text-blue-700 font-semibold">
            FMS Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search FMS..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="onhold">On Hold</TabsTrigger>
              <TabsTrigger value="stopped">Stopped</TabsTrigger>
            </TabsList>
            {/* --- Upcoming FMSs Tab --- */}
            <TabsContent value="upcoming" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <FmsTableHeader />
                  <TableBody>
                    {Array.isArray(upcomingFMS) && upcomingFMS.length > 0 ? (
                      upcomingFMS.map((fms) => (
                        <TableRow
                          key={fms.instanceId}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            {fms.instanceId || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.createdAt) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fms.instanceName || "-"}
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap">""</TableCell> */}
                          {/* <TableCell className="whitespace-nowrap">
                          {fms.endDate}
                        </TableCell> */}
                          <TableCell className="whitespace-nowrap">
                            {fms.srManager ? fms.srManager.name : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fms.manager ? fms.manager.name : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.startDate) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.endDate) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {getStatusBadge(formatLabel(fms.status)) || "-"}
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap min-w-[180px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-slate-600">
                                <span>
                                  {fms.progress?.completedTasks || 0}/
                                  {fms.progress?.totalTasks || 0}
                                </span>
                                <span>{fms.progress?.rate || 0}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all",
                                    fms.progress?.rate === 100
                                      ? "bg-green-500"
                                      : fms.progress?.rate > 0
                                        ? "bg-blue-500"
                                        : "bg-gray-400",
                                  )}
                                  style={{
                                    width: `${fms.progress?.rate || 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell> */}
                          <FmsTableActions
                            id={fms._id || fms.id}
                            handleChangeAction={handleChangeAction}
                            fms={fms}
                          />
                        </TableRow>
                      ))
                    ) : (
                      <TableCell
                        colSpan={9}
                        className="p-6 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span>No FMS found</span>
                          {/* <span className="text-xs text-gray-400">
                            Try creating a new template
                          </span> */}
                        </div>
                      </TableCell>
                    )}
                  </TableBody>
                </Table>
                <DataPagination
                  page={page}
                  limit={limit}
                  total={pagination?.total || 0}
                  totalPages={pagination?.pages || 1}
                  onPageChange={(p) => setPage(p)}
                  onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1); // reset page when limit changes
                  }}
                />
              </div>
            </TabsContent>
            {/* --- Ongoing FMSs Tab --- */}
            <TabsContent value="ongoing" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <FmsTableHeader />
                  <TableBody>
                    {Array.isArray(onGoingFMS) && onGoingFMS.length > 0 ? (
                      onGoingFMS.map((fms) => (
                        <TableRow
                          key={fms.instanceId}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            {fms.instanceId || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.createdAt) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fms.instanceName || "-"}
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap">""</TableCell> */}
                          {/* <TableCell className="whitespace-nowrap">
                          {fms.endDate}
                        </TableCell> */}
                          <TableCell className="whitespace-nowrap">
                            {fms.srManager ? fms.srManager.name : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fms.manager ? fms.manager.name : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.startDate) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.endDate) || "-"}
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            {getStatusBadge(formatLabel(fms.status)) || "-"}
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap min-w-[180px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-slate-600">
                                <span>
                                  {fms.progress?.completedTasks || 0}/
                                  {fms.progress?.totalTasks || 0}
                                </span>
                                <span>{fms.progress?.rate || 0}%</span>
                              </div>

                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all",
                                    fms.progress?.rate === 100
                                      ? "bg-green-500"
                                      : fms.progress?.rate > 0
                                        ? "bg-blue-500"
                                        : "bg-gray-400",
                                  )}
                                  style={{
                                    width: `${fms.progress?.rate || 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell> */}
                          <FmsTableActions
                            id={fms._id || fms.id}
                            handleChangeAction={handleChangeAction}
                            fms={fms}
                          />
                        </TableRow>
                      ))
                    ) : (
                      <TableCell
                        colSpan={9}
                        className="p-6 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span>No FMS found</span>
                          {/* <span className="text-xs text-gray-400">
                            Try creating a new template
                          </span> */}
                        </div>
                      </TableCell>
                    )}
                  </TableBody>
                </Table>
                <DataPagination
                  page={page}
                  limit={limit}
                  total={pagination?.total || 0}
                  totalPages={pagination?.pages || 1}
                  onPageChange={(p) => setPage(p)}
                  onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1); // reset page when limit changes
                  }}
                />
              </div>
            </TabsContent>{" "}
            {/* --- Completed FMSs Tab --- */}
            <TabsContent value="completed" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <FmsTableHeader />
                  <TableBody>
                    {Array.isArray(completedFMS) && completedFMS.length > 0 ? (
                      completedFMS.map((fms) => (
                        <TableRow
                          key={fms.instanceId}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            {fms.instanceId || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.createdAt) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fms.instanceName || "-"}
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap">""</TableCell> */}
                          {/* <TableCell className="whitespace-nowrap">
                          {fms.endDate}
                        </TableCell> */}
                          <TableCell className="whitespace-nowrap">
                            {fms.srManager ? fms.srManager.name : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fms.manager ? fms.manager.name : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.startDate) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.endDate) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {getStatusBadge(formatLabel(fms.status)) || "-"}
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap min-w-[180px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-slate-600">
                                <span>
                                  {fms.progress?.completedTasks || 0}/
                                  {fms.progress?.totalTasks || 0}
                                </span>
                                <span>{fms.progress?.rate || 0}%</span>
                              </div>

                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all",
                                    fms.progress?.rate === 100
                                      ? "bg-green-500"
                                      : fms.progress?.rate > 0
                                        ? "bg-blue-500"
                                        : "bg-gray-400",
                                  )}
                                  style={{
                                    width: `${fms.progress?.rate || 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell> */}
                          <FmsTableActions
                            id={fms._id || fms.id}
                            handleChangeAction={handleChangeAction}
                            fms={fms}
                          />
                        </TableRow>
                      ))
                    ) : (
                      <TableCell
                        colSpan={9}
                        className="p-6 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span>No FMS found</span>
                          {/* <span className="text-xs text-gray-400">
                            Try creating a new template
                          </span> */}
                        </div>
                      </TableCell>
                    )}
                  </TableBody>
                </Table>
                <DataPagination
                  page={page}
                  limit={limit}
                  total={pagination?.total || 0}
                  totalPages={pagination?.pages || 1}
                  onPageChange={(p) => setPage(p)}
                  onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1); // reset page when limit changes
                  }}
                />
              </div>
            </TabsContent>
            {/* On Hold FMS's Tab */}
            <TabsContent value="onhold" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <FmsTableHeader />
                  <TableBody>
                    {Array.isArray(onHoldFMS) && onHoldFMS.length > 0 ? (
                      onHoldFMS.map((fms) => (
                        <TableRow
                          key={fms.instanceId}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            {fms.instanceId || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.createdAt) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fms.instanceName || "-"}
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap">""</TableCell> */}
                          {/* <TableCell className="whitespace-nowrap">
                          {fms.endDate}
                        </TableCell> */}
                          <TableCell className="whitespace-nowrap">
                            {fms.srManager ? fms.srManager.name : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fms.manager ? fms.manager.name : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.startDate) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.endDate) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {getStatusBadge(formatLabel(fms.status)) || "-"}
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap min-w-[180px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-slate-600">
                                <span>
                                  {fms.progress?.completedTasks || 0}/
                                  {fms.progress?.totalTasks || 0}
                                </span>
                                <span>{fms.progress?.rate || 0}%</span>
                              </div>

                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all",
                                    fms.progress?.rate === 100
                                      ? "bg-green-500"
                                      : fms.progress?.rate > 0
                                        ? "bg-blue-500"
                                        : "bg-gray-400",
                                  )}
                                  style={{
                                    width: `${fms.progress?.rate || 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell> */}
                          <FmsTableActions
                            id={fms._id || fms.id}
                            handleChangeAction={handleChangeAction}
                            fms={fms}
                          />
                        </TableRow>
                      ))
                    ) : (
                      <TableCell
                        colSpan={9}
                        className="p-6 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span>No FMS found</span>
                          {/* <span className="text-xs text-gray-400">
                            Try creating a new template
                          </span> */}
                        </div>
                      </TableCell>
                    )}
                  </TableBody>
                </Table>
                <DataPagination
                  page={page}
                  limit={limit}
                  total={pagination?.total || 0}
                  totalPages={pagination?.pages || 1}
                  onPageChange={(p) => setPage(p)}
                  onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1); // reset page when limit changes
                  }}
                />
              </div>
            </TabsContent>
            {/* Stopped FMS's Tab */}
            <TabsContent value="stopped" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <FmsTableHeader />
                  <TableBody>
                    {Array.isArray(stoppedFMS) && stoppedFMS.length > 0 ? (
                      stoppedFMS.map((fms) => (
                        <TableRow
                          key={fms.instanceId}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            {fms.instanceId || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.createdAt) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fms.instanceName || "-"}
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap">""</TableCell> */}
                          {/* <TableCell className="whitespace-nowrap">
                          {fms.endDate}
                        </TableCell> */}
                          <TableCell className="whitespace-nowrap">
                            {fms.srManager ? fms.srManager.name : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {fms.manager ? fms.manager.name : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.startDate) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(fms.endDate) || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {getStatusBadge(formatLabel(fms.status)) || "-"}
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap min-w-[180px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-slate-600">
                                <span>
                                  {fms.progress?.completedTasks || 0}/
                                  {fms.progress?.totalTasks || 0}
                                </span>
                                <span>{fms.progress?.rate || 0}%</span>
                              </div>

                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all",
                                    fms.progress?.rate === 100
                                      ? "bg-green-500"
                                      : fms.progress?.rate > 0
                                        ? "bg-blue-500"
                                        : "bg-gray-400",
                                  )}
                                  style={{
                                    width: `${fms.progress?.rate || 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell> */}
                          <FmsTableActions
                            id={fms._id || fms.id}
                            handleChangeAction={handleChangeAction}
                            fms={fms}
                          />
                        </TableRow>
                      ))
                    ) : (
                      <TableCell
                        colSpan={9}
                        className="p-6 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span>No FMS found</span>
                          {/* <span className="text-xs text-gray-400">
                            Try creating a new template
                          </span> */}
                        </div>
                      </TableCell>
                    )}
                  </TableBody>
                </Table>
                <DataPagination
                  page={page}
                  limit={limit}
                  total={pagination?.total || 0}
                  totalPages={pagination?.pages || 1}
                  onPageChange={(p) => setPage(p)}
                  onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1); // reset page when limit changes
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingOngoingFms;
