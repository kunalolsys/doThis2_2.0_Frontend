export const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date)) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", {
    month: "short",
  });
  const year = date.getFullYear();

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${day} ${month} ${year}, ${time}`;
};

export const formatLabel = (text = "") => {
  if (!text || typeof text !== "string") return "";

  // 🔥 0. Normalize known words (important fix)
  const normalizeMap = {
    onhold: "On Hold",
    inprocess: "In Process",
    stopped: "Stopped",
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
  };

  const lower = text.toLowerCase().replace(/[\s_\-.]/g, "");
  if (normalizeMap[lower]) return normalizeMap[lower];

  return (
    text
      // 1. Convert camelCase → camel Case
      .replace(/([a-z])([A-Z])/g, "$1 $2")

      // 2. Replace separators (_ - .)
      .replace(/[_\-.]+/g, " ")

      // 3. Remove extra spaces
      .replace(/\s+/g, " ")
      .trim()

      // 4. Capitalize words properly
      .split(" ")
      .map((word) => {
        if (word.toUpperCase() === word) return word; // keep API, ID

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ")
  );
};
export const getDueStatus = (dueDate) => {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);

  // Old day logic
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((today - dueDay) / (1000 * 60 * 60 * 24));

  // Time difference
  const diffMs = Math.abs(now - due);

  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return {
      type: "overdue",
      text: `${diffDays}d ${hours}h ${minutes}m overdue`,
      className: "bg-red-50 text-red-600 border border-red-200",
    };
  }

  if (diffDays === 0) {
    if (due < now) {
      return {
        type: "overdue-today",
        text: `${hours}h ${minutes}m overdue`,
        className: "bg-red-50 text-red-600 border border-red-200",
      };
    }

    return {
      type: "today",
      text: `Due Today (${hours}h ${minutes}m left)`,
      className: "bg-yellow-50 text-yellow-600 border border-yellow-200",
    };
  }

  return {
    type: "upcoming",
    text: `${Math.abs(diffDays)}d ${hours}h ${minutes}m left`,
    className: "bg-green-50 text-green-600 border border-green-200",
  };
};
