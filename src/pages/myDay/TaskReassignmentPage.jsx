import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Select,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  message,
  Progress,
  Badge,
  Tooltip,
  theme,
  Row,
  Col,
  Statistic,
  List,
  Checkbox,
  Divider,
  Segmented,
} from "antd";
import {
  UserOutlined,
  SwapOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  ReloadOutlined,
  DeploymentUnitOutlined,
  CheckSquareOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import api from "../../lib/api";
import { formatLabel } from "../../lib/utilFunctions";

const { Title, Text, Paragraph } = Typography;

export default function TaskReassignmentPage() {
  const { token } = theme.useToken();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [fromUserId, setFromUserId] = useState(null);
  const [toUserId, setToUserId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskFrequency, setTaskFrequency] = useState("one-time");
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/filter-allUsers");
      const data = res.data.data || [];
      setUsers(data);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchTask = async () => {
    try {
      const res = await api.post("/tasks/filter", {
        userId: fromUserId,
        filters: {
          taskType: taskFrequency == "recurring" ? "recurring" : "All",
        },
        limit: 100000,
        page: 1,
      });
      const task = res.data.data;
      setTasks(task);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (!fromUserId) return;
    fetchTask();
  }, [fromUserId, taskFrequency]);

  // Derive execution contexts
  const filteredTasks = tasks.filter(
    (task) => task.assignedTo?._id === fromUserId,
  );
  const finalTasks = useMemo(
    () => filteredTasks.filter((item) => item.status != "Completed"),
    [filteredTasks],
  );
  const activeUserProfile = users.find((u) => u.oid === fromUserId);
  const totalTasksCount = finalTasks.length;
  const delayedTasksCount = finalTasks.filter(
    (t) => t.status === "Delayed",
  ).length;

  const handleFromUserChange = (value) => {
    setFromUserId(value);
    setSelectedRowKeys([]);
    if (value === toUserId) setToUserId(null);
  };

  const handleReassignmentSave = async () => {
    if (!toUserId) {
      message.error("Please select a target destination user.");
      return;
    }
    if (selectedRowKeys.length === 0) {
      message.error("Please select at least one task to reassign.");
      return;
    }

    // 1. Locate the complete user record of our target to fetch their department OID
    const targetUserObj = users.find((u) => u._id === toUserId);

    // Construct the payload structure your backend expects from your curl log
    const payload = {
      assignedTo: toUserId,
      //   departmentOfAssignToUser: targetUserObj?.departmentId || null, // Fallback fallback dept OID
    };

    setIsSubmitting(true);

    try {
      // 2. Fire concurrent API requests for all selected task IDs
      const updatePromises = selectedRowKeys.map((taskId) =>
        api.put(`/tasks/${taskId}`, payload),
      );

      // 3. Await for all network responses to finish successfully
      await Promise.all(updatePromises);

      message.success(
        `Tasks were successfully reassigned to ${targetUserObj?.name}.`,
      );
      fetchTask();
      // 5. Tear down tracking configurations
      setSelectedRowKeys([]);
    } catch (error) {
      console.error("Reassignment batch execution error:", error);
      message.error(
        error.response?.data?.message ||
          "Database rejected batch assignment stream.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Task Tracking ID",
      dataIndex: "TaskId",
      key: "TaskId",
      width: "150px",
      render: (text) => (
        <Text
          strong
          style={{
            fontFamily: "var(--ant-font-family-code, monospace)",
            color: token.colorTextSecondary,
          }}
        >
          {text}
        </Text>
      ),
    },
    {
      title: "Task Details / Context",
      dataIndex: "title",
      key: "title",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space size={8}>
            <Text style={{ fontWeight: 600, fontSize: "14px" }}>
              {record.title}
            </Text>
            {record.isReopen && (
              <Tooltip title={`Reason: ${record.reopenedReason}`}>
                <Tag
                  color="volcano"
                  style={{
                    border: "none",
                    borderRadius: "2px",
                    fontWeight: 500,
                    fontSize: "11px",
                  }}
                >
                  Reopened
                </Tag>
              </Tooltip>
            )}
          </Space>
          <Paragraph
            type="secondary"
            style={{ margin: 0, fontSize: "12px", maxWidth: "500px" }}
            ellipsis={{ rows: 1 }}
          >
            {record.description}
          </Paragraph>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "taskType",
      key: "taskType",
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontWeight: 600, fontSize: "14px" }}>
            {formatLabel(record.taskType)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "160px",
      render: (status) => {
        const statusConfig = {
          Pending: {
            color: "warning",
            textColor: "#d97706",
          },

          "In Progress": {
            color: "processing",
            textColor: "#1677ff",
          },

          Completed: {
            color: "success",
            textColor: "#16a34a",
          },

          Delayed: {
            color: "error",
            textColor: "#dc2626",
          },

          Overdue: {
            color: "error",
            textColor: "#b91c1c",
          },

          Upcoming: {
            color: "default",
            textColor: "#52b1ff",
          },

          Delegated: {
            color: "processing",
            textColor: "#7c3aed",
          },

          Cancelled: {
            color: "default",
            textColor: "#6b7280",
          },

          Rejected: {
            color: "error",
            textColor: "#ef4444",
          },

          Approved: {
            color: "success",
            textColor: "#22c55e",
          },

          Review: {
            color: "warning",
            textColor: "#f59e0b",
          },

          Hold: {
            color: "warning",
            textColor: "#ca8a04",
          },
        };

        const currentStatus = statusConfig[status] || {
          color: "default",
          textColor: "#6b7280",
        };

        return (
          <Badge
            status={currentStatus.color}
            text={
              <Text
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: currentStatus.textColor,
                }}
              >
                {status || "-"}
              </Text>
            }
          />
        );
      },
    },
    {
      title: "Subtask Checklist Met",
      key: "checklist",
      width: "200px",
      render: (_, record) => {
        const total = record.checklist?.length || 0;
        const complete =
          record.checklist?.filter((i) => i.isCompleted).length || 0;
        const progressPercent =
          total > 0 ? Math.round((complete / total) * 100) : 0;
        return (
          <div style={{ paddingRight: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
                fontSize: "11px",
              }}
            >
              <Text type="secondary">Progress</Text>
              <Text type="secondary" strong>
                {complete}/{total}
              </Text>
            </div>
            <Progress
              percent={progressPercent}
              size="small"
              showInfo={false}
              strokeWidth={4}
              strokeColor={token.colorInfo}
            />
          </div>
        );
      },
    },
    {
      title: "Target Due Date",
      key: "dueDate",
      width: "160px",
      render: (_, record) => {
        if (!record.dueDate) return <Text type="secondary">—</Text>;
        const rawDate = new Date(record.dueDate);
        const formatted = rawDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return (
          <Space size={6} style={{ color: token.colorTextDescription }}>
            <CalendarOutlined style={{ fontSize: "12px" }} />
            <span style={{ fontSize: "13px" }}>{formatted}</span>
          </Space>
        );
      },
    },
  ];
  return (
    <div
      style={{
        backgroundColor: "#fcfdfe",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      {/* 1. Header Area with Inline Status Summary Counters */}
      <div
        style={{
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          paddingBottom: "20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div className="flex" style={{ flexDirection: "column" }}>
          <div>
            <Title
              level={3}
              style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.3px" }}
            >
              Task Allocation & Transfer Management{" "}
            </Title>
            <Text type="secondary" style={{ fontSize: "13px" }}>
              Smart administrative workspace for bulk task reassignment,
              workload balancing, and operational continuity management.
            </Text>
          </div>
          <div
            style={{
              marginTop: "5px",
              //   padding: "4px",
              borderRadius: "8px",
            }}
          >
            <Segmented
              size="large"
              value={taskFrequency}
              onChange={(value) => {
                setTaskFrequency(value);
                setSelectedRowKeys([]); // Flush memory array references
              }}
              options={[
                {
                  label: "One-Time Tasks",
                  value: "one-time",
                  icon: <ThunderboltOutlined />,
                },
                {
                  label: "Repeated Tasks",
                  value: "recurring",
                  icon: <ClockCircleOutlined />,
                },
              ]}
            />
          </div>
        </div>
        {fromUserId && (
          <Space size={16} wrap>
            {/* Total Tasks Metric Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                borderRadius: "12px",
                padding: "12px 20px",
                minWidth: "200px",
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.02), 0 8px 16px -4px rgba(148, 163, 184, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Space direction="vertical" size={2}>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.3px",
                    uppercase: true,
                  }}
                >
                  Workload Balance
                </Text>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: token.colorTextHeading,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {totalTasksCount}{" "}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 400,
                      color: token.colorTextDescription,
                    }}
                  >
                    tasks loaded
                  </span>
                </span>
              </Space>
              <div
                style={{
                  background: token.colorInfoBg,
                  padding: "10px",
                  borderRadius: "10px",
                  display: "flex",
                  color: token.colorInfo,
                }}
              >
                <DeploymentUnitOutlined style={{ fontSize: "18px" }} />
              </div>
            </div>

            {/* Delayed Flags Metric Card */}
            <div
              style={{
                background: delayedTasksCount > 0 ? "#fff1f0" : "#ffffff",
                border: `1px solid ${delayedTasksCount > 0 ? "#ffccc7" : "#f1f5f9"}`,
                borderRadius: "12px",
                padding: "12px 20px",
                minWidth: "200px",
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.02), 0 8px 16px -4px rgba(148, 163, 184, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
              }}
            >
              <Space direction="vertical" size={2}>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.3px",
                    color:
                      delayedTasksCount > 0
                        ? "#a8071a"
                        : token.colorTextDescription,
                  }}
                >
                  Risk Assessment
                </Text>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color:
                      delayedTasksCount > 0
                        ? token.colorError
                        : token.colorTextHeading,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {delayedTasksCount}{" "}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 400,
                      color:
                        delayedTasksCount > 0
                          ? "#cf1322"
                          : token.colorTextDescription,
                    }}
                  >
                    delayed
                  </span>
                </span>
              </Space>
              <div
                style={{
                  background:
                    delayedTasksCount > 0
                      ? "#ff383815"
                      : token.colorBgContainerDisabled,
                  padding: "10px",
                  borderRadius: "10px",
                  display: "flex",
                  color:
                    delayedTasksCount > 0
                      ? token.colorError
                      : token.colorTextDisabled,
                }}
              >
                <AlertOutlined style={{ fontSize: "18px" }} />
              </div>
            </div>
          </Space>
        )}
      </div>

      {/* 2. TOP FILTER CONTROLS BAR */}
      <Card
        bordered={false}
        style={{
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          borderRadius: "8px",
          marginBottom: "16px",
          background: "#fff",
          border: "1px solid #f0f0f0",
        }}
        bodyStyle={{ padding: "16px 24px" }}
      >
        <Row gutter={24} align="middle">
          <Col xs={24} md={10}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Text
                strong
                style={{ color: token.colorTextHeading, fontSize: "13px" }}
              >
                1. Filter Source Account Assignee
              </Text>
              <Select
                showSearch
                allowClear
                size="large"
                placeholder="Search employee by name or role..."
                style={{ width: "100%" }}
                value={fromUserId}
                onChange={handleFromUserChange}
                suffixIcon={<UserOutlined />}
                optionFilterProp="searchLabel"
                popupMatchSelectWidth={false}
                // FIXED SEARCH ISSUE
                autoClearSearchValue
                filterOption={(input, option) =>
                  option?.searchLabel
                    ?.toLowerCase()
                    ?.includes(input.toLowerCase())
                }
                options={users
                  .filter((item) => item?.role?.name !== "Owner")
                  .map((u) => ({
                    value: u?._id || u?.id,

                    // IMPORTANT
                    label: `${u?.name}`,

                    searchLabel: `
        ${u?.name || ""}
        ${u?.email || ""}
        ${u?.role?.name || ""}
      `,

                    // CUSTOM DROPDOWN UI
                    customLabel: (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            {u?.name}
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginTop: "2px",
                            }}
                          >
                            {u?.email}
                          </div>
                        </div>

                        <Tag color="blue">{u?.role?.name}</Tag>
                      </div>
                    ),
                  }))}
                optionRender={(option) => option.data.customLabel}
              />
            </Space>
          </Col>

          <Col
            xs={24}
            md={4}
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                background: "#f1f5f9",
                borderRadius: "20px",
              }}
            >
              <SwapOutlined style={{ color: token.colorTextDescription }} />
              <Text
                type="secondary"
                style={{ fontSize: "11px", fontWeight: 600, uppercase: true }}
              >
                Routing Link
              </Text>
            </div>
          </Col>

          <Col xs={24} md={10}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Text
                strong
                style={{ color: token.colorTextHeading, fontSize: "13px" }}
              >
                2. Specify Destination Target Account
              </Text>
              <Select
                showSearch
                allowClear
                size="large"
                placeholder={
                  fromUserId
                    ? "Select recipient user profile..."
                    : "Awaiting step 1 parameters..."
                }
                style={{ width: "100%" }}
                value={toUserId}
                onChange={(v) => setToUserId(v)}
                disabled={!fromUserId}
                suffixIcon={<UserOutlined />}
                optionFilterProp="searchLabel"
                popupMatchSelectWidth={false}
                autoClearSearchValue
                filterOption={(input, option) =>
                  option?.searchLabel
                    ?.toLowerCase()
                    ?.includes(input.toLowerCase())
                }
                options={users
                  .filter((item) => item?.role?.name !== "Owner")
                  .map((u) => ({
                    value: u?._id || u?.id,

                    // clean selected label
                    label: `${u?.name}`,

                    disabled: (u?._id || u?.id) === fromUserId,

                    // searchable text
                    searchLabel: `
        ${u?.name || ""}
        ${u?.email || ""}
        ${u?.role?.name || ""}
      `,

                    // custom dropdown design
                    customLabel: (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          opacity: (u?._id || u?.id) === fromUserId ? 0.5 : 1,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            {u?.name}
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginTop: "2px",
                            }}
                          >
                            {u?.email}
                          </div>
                        </div>

                        <Tag
                          color={
                            (u?._id || u?.id) === fromUserId
                              ? "default"
                              : "blue"
                          }
                          style={{
                            borderRadius: "20px",
                            paddingInline: "10px",
                            fontWeight: 500,
                          }}
                        >
                          {u?.role?.name}
                        </Tag>
                      </div>
                    ),
                  }))}
                optionRender={(option) => option.data.customLabel}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 3. CONTEXTUAL ACTION NOTIFICATION STRIP */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            padding: "14px 24px",
            borderRadius: "6px",
            marginBottom: "16px",
            boxShadow: "0 4px 6px -1px rgba(240, 253, 244, 0.5)",
          }}
        >
          <Space size={12}>
            <div
              style={{
                background: "#dcfce7",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertOutlined style={{ color: "#16a34a" }} />
            </div>
            <div>
              <Text strong style={{ color: "#14532d", fontSize: "14px" }}>
                Staged Transaction Verified
              </Text>
              <Text
                style={{
                  color: "#166534",
                  fontSize: "13px",
                  marginLeft: "8px",
                }}
              >
                You have staged <b>{selectedRowKeys.length}</b> work item
                targets to transfer over to your selected destination pipeline.
              </Text>
            </div>
          </Space>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleReassignmentSave}
            loading={isSubmitting}
            disabled={!toUserId}
            style={{
              background: "#16a34a",
              borderColor: "#16a34a",
              boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
              borderRadius: "4px",
              fontWeight: 600,
            }}
          >
            Authorize Reassignment Update
          </Button>
        </div>
      )}

      {/* 4. BOTTOM WORKLOAD LEDGER TABLE AREA */}
      <Card
        bordered={false}
        style={{
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          borderRadius: "8px",
          background: "#fff",
          border: "1px solid #f0f0f0",
        }}
        bodyStyle={{ padding: "0px" }}
      >
        {fromUserId ? (
          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: (k) => setSelectedRowKeys(k),
            }}
            columns={columns}
            dataSource={finalTasks}
            rowKey={(record) => record._id}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              hideOnSinglePage: true,
            }}
            expandable={{
              expandedRowRender: (record) => {
                const createdDate = record?.createdAt
                  ? new Date(record.createdAt).toLocaleString("en-IN")
                  : "-";

                const startDate = record?.startDate
                  ? new Date(record.startDate).toLocaleString("en-IN")
                  : "-";

                const dueDate = record?.dueDate
                  ? new Date(record.dueDate).toLocaleString("en-IN")
                  : "-";

                const completedDate = record?.completedAt
                  ? new Date(record.completedAt).toLocaleString("en-IN")
                  : "-";

                const completedChecklist =
                  record?.checklist?.filter((i) => i.isCompleted)?.length || 0;

                const totalChecklist = record?.checklist?.length || 0;

                return (
                  <div
                    style={{
                      background: "#fafbfd",
                      borderRadius: "16px",
                      padding: "24px",
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Row gutter={[24, 24]}>
                      {/* LEFT SECTION */}
                      <Col xs={24} lg={15}>
                        <Space
                          direction="vertical"
                          size={20}
                          style={{ width: "100%" }}
                        >
                          {/* Task Header */}
                          <div>
                            <Space align="center" wrap>
                              <Text
                                strong
                                style={{
                                  fontSize: "18px",
                                }}
                              >
                                {record?.title}
                              </Text>

                              <Tag color="blue">{record?.taskType}</Tag>

                              <Tag
                                color={
                                  record?.status === "Completed"
                                    ? "success"
                                    : record?.status === "Pending"
                                      ? "warning"
                                      : "processing"
                                }
                              >
                                {record?.status}
                              </Tag>

                              {record?.isReopen && (
                                <Tag color="volcano">Reopened</Tag>
                              )}
                            </Space>

                            <Paragraph
                              style={{
                                marginTop: 10,
                                marginBottom: 0,
                                fontSize: "13px",
                                lineHeight: "24px",
                                color: token.colorTextSecondary,
                              }}
                            >
                              {record?.description ||
                                "No description available"}
                            </Paragraph>
                          </div>

                          {/* Checklist Section */}
                          <div
                            style={{
                              background: "#fff",
                              borderRadius: "12px",
                              padding: "18px",
                              border: `1px solid ${token.colorBorderSecondary}`,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "14px",
                              }}
                            >
                              <Text strong>
                                <CheckSquareOutlined /> Task Checklist
                              </Text>

                              <Tag color="processing">
                                {completedChecklist}/{totalChecklist} Completed
                              </Tag>
                            </div>

                            <Progress
                              percent={
                                totalChecklist > 0
                                  ? Math.round(
                                      (completedChecklist / totalChecklist) *
                                        100,
                                    )
                                  : 0
                              }
                              showInfo={false}
                              strokeWidth={7}
                            />

                            <List
                              style={{ marginTop: "14px" }}
                              dataSource={record?.checklist || []}
                              renderItem={(item, index) => (
                                <List.Item
                                  style={{
                                    border: "none",
                                    padding: "8px 0",
                                  }}
                                >
                                  <Checkbox
                                    checked={item?.isCompleted}
                                    disabled
                                  >
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        textDecoration: item?.isCompleted
                                          ? "line-through"
                                          : "none",
                                        color: item?.isCompleted
                                          ? token.colorTextDisabled
                                          : token.colorText,
                                      }}
                                    >
                                      {index + 1}. {item?.text}
                                    </span>
                                  </Checkbox>
                                </List.Item>
                              )}
                            />
                          </div>

                          {/* Reopened Reason */}
                          {record?.isReopen && record?.reopenedReason && (
                            <Alert
                              type="warning"
                              showIcon
                              message="Task Reopened"
                              description={record?.reopenedReason}
                            />
                          )}
                        </Space>
                      </Col>

                      {/* RIGHT SIDEBAR */}
                      <Col xs={24} lg={9}>
                        <div
                          style={{
                            background: "#fff",
                            borderRadius: "16px",
                            padding: "22px",
                            border: `1px solid ${token.colorBorderSecondary}`,
                            height: "100%",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                          }}
                        >
                          <Space
                            direction="vertical"
                            size={20}
                            style={{ width: "100%" }}
                          >
                            {/* Header */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                strong
                                style={{
                                  fontSize: "15px",
                                }}
                              >
                                Task Information
                              </Text>

                              <Tag color="blue">
                                {record?.taskType || "General"}
                              </Tag>
                            </div>

                            {/* Task Tracking */}
                            <div
                              style={{
                                background: "#fafafa",
                                borderRadius: "12px",
                                padding: "14px",
                                border: `1px solid ${token.colorBorderSecondary}`,
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "11px",
                                  display: "block",
                                  marginBottom: "6px",
                                }}
                              >
                                Task Tracking ID
                              </Text>

                              <Text
                                strong
                                copyable
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: "14px",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {record?.TaskId}
                              </Text>
                            </div>

                            {/* Assigned To */}
                            <div
                              style={{
                                background: "#fafafa",
                                borderRadius: "12px",
                                padding: "14px",
                                border: `1px solid ${token.colorBorderSecondary}`,
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "11px",
                                  display: "block",
                                  marginBottom: "6px",
                                }}
                              >
                                Assigned To
                              </Text>

                              <Text strong style={{ fontSize: "14px" }}>
                                {record?.assignedTo?.name || "-"}
                              </Text>

                              <div
                                style={{
                                  marginTop: "4px",
                                  fontSize: "12px",
                                  color: token.colorTextSecondary,
                                }}
                              >
                                {record?.assignedTo?.email}
                              </div>
                            </div>

                            {/* Assigned By */}
                            <div
                              style={{
                                background: "#fafafa",
                                borderRadius: "12px",
                                padding: "14px",
                                border: `1px solid ${token.colorBorderSecondary}`,
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "11px",
                                  display: "block",
                                  marginBottom: "6px",
                                }}
                              >
                                Assigned By
                              </Text>

                              <Text strong style={{ fontSize: "14px" }}>
                                {record?.assignedBy?.name || "-"}
                              </Text>

                              <div
                                style={{
                                  marginTop: "4px",
                                  fontSize: "12px",
                                  color: token.colorTextSecondary,
                                }}
                              >
                                {record?.assignedBy?.email}
                              </div>
                            </div>

                            {/* Department & Duration */}
                            <Row gutter={[12, 12]}>
                              <Col span={12}>
                                <div
                                  style={{
                                    background: "#fafafa",
                                    borderRadius: "12px",
                                    padding: "14px",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    height: "100%",
                                  }}
                                >
                                  <Text
                                    type="secondary"
                                    style={{
                                      fontSize: "11px",
                                      display: "block",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Department
                                  </Text>

                                  <Tag color="geekblue">
                                    {record?.departmentOfAssignToUser?.name ||
                                      "-"}
                                  </Tag>
                                </div>
                              </Col>

                              <Col span={12}>
                                <div
                                  style={{
                                    background: "#fafafa",
                                    borderRadius: "12px",
                                    padding: "14px",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    height: "100%",
                                  }}
                                >
                                  <Text
                                    type="secondary"
                                    style={{
                                      fontSize: "11px",
                                      display: "block",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Duration
                                  </Text>

                                  <Text strong style={{ fontSize: "14px" }}>
                                    {record?.taskEndDays || 0} Days
                                  </Text>
                                </div>
                              </Col>
                            </Row>

                            {/* Dates */}
                            <div>
                              <Text
                                strong
                                style={{
                                  fontSize: "13px",
                                  marginBottom: "12px",
                                  display: "block",
                                }}
                              >
                                Timeline
                              </Text>

                              <Row gutter={[12, 12]}>
                                <Col span={12}>
                                  <div
                                    style={{
                                      background: "#fafafa",
                                      borderRadius: "12px",
                                      padding: "14px",
                                      border: `1px solid ${token.colorBorderSecondary}`,
                                    }}
                                  >
                                    <Text
                                      type="secondary"
                                      style={{
                                        fontSize: "11px",
                                        display: "block",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Start Date
                                    </Text>

                                    <Text strong style={{ fontSize: "13px" }}>
                                      {startDate}
                                    </Text>
                                  </div>
                                </Col>

                                <Col span={12}>
                                  <div
                                    style={{
                                      background: "#fff7e6",
                                      borderRadius: "12px",
                                      padding: "14px",
                                      border: "1px solid #ffd591",
                                    }}
                                  >
                                    <Text
                                      type="secondary"
                                      style={{
                                        fontSize: "11px",
                                        display: "block",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Due Date
                                    </Text>

                                    <Text
                                      strong
                                      style={{
                                        fontSize: "13px",
                                        color: "#d46b08",
                                      }}
                                    >
                                      {dueDate}
                                    </Text>
                                  </div>
                                </Col>

                                <Col span={12}>
                                  <div
                                    style={{
                                      background: "#fafafa",
                                      borderRadius: "12px",
                                      padding: "14px",
                                      border: `1px solid ${token.colorBorderSecondary}`,
                                    }}
                                  >
                                    <Text
                                      type="secondary"
                                      style={{
                                        fontSize: "11px",
                                        display: "block",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      Created At
                                    </Text>

                                    <Text strong style={{ fontSize: "13px" }}>
                                      {createdDate}
                                    </Text>
                                  </div>
                                </Col>

                                {record?.completedAt && (
                                  <Col span={12}>
                                    <div
                                      style={{
                                        background: "#f6ffed",
                                        borderRadius: "12px",
                                        padding: "14px",
                                        border: "1px solid #b7eb8f",
                                      }}
                                    >
                                      <Text
                                        type="secondary"
                                        style={{
                                          fontSize: "11px",
                                          display: "block",
                                          marginBottom: "6px",
                                        }}
                                      >
                                        Completed At
                                      </Text>

                                      <Text
                                        strong
                                        style={{
                                          fontSize: "13px",
                                          color: "#389e0d",
                                        }}
                                      >
                                        {completedDate}
                                      </Text>
                                    </div>
                                  </Col>
                                )}
                              </Row>
                            </div>
                          </Space>
                        </div>
                      </Col>
                    </Row>
                  </div>
                );
              },

              rowExpandable: () => true,
            }}
          />
        ) : (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <InboxOutlined
              style={{
                fontSize: "40px",
                color: token.colorTextDisabled,
                marginBottom: "12px",
              }}
            />
            <Title
              level={5}
              style={{
                margin: 0,
                fontWeight: 600,
                color: token.colorTextDescription,
              }}
            >
              No Active Task Data Available
            </Title>
            <Text
              type="secondary"
              style={{ fontSize: "13px", marginTop: "4px", display: "block" }}
            >
              Use the employee selector above to retrieve assigned workloads and
              begin task transfer management.
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
}
