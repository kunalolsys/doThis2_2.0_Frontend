import React, { useEffect, useState } from "react";
import { Timeline, Tag, Select, Avatar, Card, Button, Spin, Table } from "antd";
import axios from "axios";

const { Option } = Select;

const LogsTimeline = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (reset = false) => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/logs`, {
        params: {
          page: reset ? 1 : page,
          limit: 10,
          ...filters,
        },
      });

      const newLogs = res.data.data;

      if (reset) {
        setLogs(newLogs);
        setPage(2);
        setHasMore(true);
      } else {
        setLogs((prev) => [...prev, ...newLogs]);
        setPage((prev) => prev + 1);
      }

      if (newLogs.length < 10) setHasMore(false);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs(true);
  }, [filters]);

  // 🎨 Action Colors
  const getColor = (action) => {
    if (action === "CREATE") return "green";
    if (action === "UPDATE") return "blue";
    if (action === "DELETE") return "red";
    return "gray";
  };

  // 🧠 Convert camelCase → Normal Label
  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  // 📅 Format Date
  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // 🔥 enables AM/PM
    });
  };
  const isEqual = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
  };
  // 🔥 Table for Changes
  const getChangeTable = (oldData, newData) => {
    if (!newData) return null;

    const keys = Object.keys(newData);

    const changes = keys
      .map((key, index) => {
        const oldVal = oldData ? oldData[key] : undefined;
        const newVal = newData[key];

        const isChanged = !isEqual(oldVal, newVal);

        return {
          key: index,
          field: formatKey(key),
          oldValue: isChanged ? formatValue(oldVal) : "-",
          newValue: formatValue(newVal),
          show: isChanged || !oldData, // 🔥 important
        };
      })
      .filter((item) => item.show);

    if (changes.length === 0) {
      return <p>No changes found</p>;
    }
    return (
      <Table
        size="small"
        pagination={false}
        columns={[
          { title: "Field", dataIndex: "field" },
          { title: "Old", dataIndex: "oldValue" },
          { title: "New", dataIndex: "newValue" },
        ]}
        dataSource={changes}
      />
    );
  };
  const isValidDateString = (val) => {
    // ✅ only allow ISO-like date strings
    return typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val);
  };

  // 🧾 Format Values (array/object support)
  const formatValue = (val) => {
    if (val === null || val === undefined) return "-";

    // ✅ BOOLEAN
    if (typeof val === "boolean") {
      return val ? "Yes" : "No";
    }

    // ✅ ARRAY
    if (Array.isArray(val)) {
      return val.map((v) => v?.name || formatValue(v)).join(", ");
    }

    // ✅ OBJECT
    if (typeof val === "object") {
      return val.name || JSON.stringify(val);
    }

    // ✅ STRING → DATE CHECK
    if (isValidDateString(val)) {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(date);
      }
    }

    return String(val);
  };

  return (
    <div style={{ padding: 20, margin: "auto" }}>
      {/* 🔍 FILTERS */}
      <Card
        style={{
          marginBottom: 20,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {/* ACTION FILTER */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label
              style={{
                fontSize: 12,
                marginBottom: 4,
                fontWeight: 500,
              }}
            >
              Action
            </label>
            <Select
              placeholder="Select action"
              style={{ width: 180 }}
              allowClear
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, action: value }))
              }
            >
              <Option value="CREATE">Create</Option>
              <Option value="UPDATE">Update</Option>
              <Option value="DELETE">Delete</Option>
            </Select>
          </div>

          {/* MODULE FILTER */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label
              style={{
                fontSize: 12,
                marginBottom: 4,
                fontWeight: 500,
              }}
            >
              Module
            </label>
            <Select
              placeholder="Select module"
              style={{ width: 180 }}
              allowClear
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, module: value }))
              }
            >
              <Option value="USER">User</Option>
              <Option value="TASK">Task</Option>
            </Select>
          </div>
        </div>
      </Card>

      {/* 🧾 TIMELINE */}
      <Spin spinning={loading && logs.length === 0}>
        <Timeline mode="left">
          {logs.map((log) => {
            const isRight = log.action === "CREATE" || log.action === "DELETE";

            return (
              <Timeline.Item
                key={log._id}
                color={getColor(log.action)}
                placement={isRight ? "end" : "start"}
                label={
                  <span style={{ fontSize: 12, color: "#999" }}>
                    {formatDate(log.createdAt)}
                  </span>
                }
              >
                {/* 🔥 ALIGNMENT WRAPPER */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: isRight ? "flex-end" : "flex-start",
                  }}
                >
                  <Card
                    size="small"
                    style={{
                      width: "80%",
                      borderRadius: 16,
                      border: "1px solid #f0f0f0",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                      padding: 12,
                    }}
                    bodyStyle={{ padding: 12 }}
                    hoverable
                  >
                    {/* 👤 USER + ACTION */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <Avatar style={{ background: "#1677ff" }}>
                          {log.performedBy?.name?.charAt(0)?.toUpperCase()}
                        </Avatar>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            {log.performedBy?.name || "System"}
                          </div>
                          <div style={{ fontSize: 11, color: "#999" }}>
                            {log.performedBy?.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Tag
                          color={getColor(log.action)}
                          style={{ borderRadius: 20 }}
                        >
                          {log.action}
                        </Tag>
                        <Tag
                          color={getColor(log.module)}
                          style={{ borderRadius: 20 }}
                        >
                          {log.module}
                        </Tag>
                      </div>
                    </div>

                    {/* 📝 MESSAGE */}
                    <div
                      style={{
                        fontSize: 14,
                        color: "#333",
                        marginBottom: 10,
                        lineHeight: 1.5,
                        background: "#fafafa",
                        padding: "8px 12px",
                        borderRadius: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        // textAlign: isRight ? "right" : "left", // 🔥 align text also
                      }}
                    >
                      {log.message || "No message"}
                    </div>

                    {/* 🏷 MODULE */}
                    {/* <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        marginBottom: 10,
                      }}
                    >
                      <Tag>{log.module}</Tag>
                    </div> */}

                    {/* 🔥 CHANGE TABLE */}
                    {log.action === "UPDATE" &&
                      getChangeTable(log.oldData, log.newData)}
                  </Card>
                </div>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </Spin>

      {/* 🔽 LOAD MORE */}
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Button loading={loading} onClick={() => fetchLogs()}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default LogsTimeline;
