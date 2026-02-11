// src/utils/getFormattedTimestamp.js
export function getFormattedTimestamp() {
  const now = new Date();

  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const DD = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");

  // Convert ms → microseconds (6 digits)
  const micro = (ms + "000").slice(0, 6);

  // Timezone offset
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const tzHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const tzMinutes = String(absOffset % 60).padStart(2, "0");

  const timezone = `${sign}${tzHours}:${tzMinutes}`;

  return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}.${micro}${timezone}`;
}