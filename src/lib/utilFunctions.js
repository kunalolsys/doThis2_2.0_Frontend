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

//** format label */
export const formatLabel = (text = "") => {
  return text
    .replace(/_/g, " ") // replace underscores with space
    .split(" ") // split words
    .filter(Boolean) // remove empty
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
};