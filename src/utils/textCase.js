// Convert to PascalCase (e.g., "john doe" → "John Doe")
toPascalCase = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Convert to Uppercase (e.g., "john doe" → "JOHN DOE")
export const toUpperCase = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.toUpperCase();
};