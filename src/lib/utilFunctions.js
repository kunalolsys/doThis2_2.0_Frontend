export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", {
    month: "short",
  });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
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
