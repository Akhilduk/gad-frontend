// utils/downloadFile.js

/**
 * Triggers a file download from a Blob or File
 * @param {Blob | File} fileData - The file data (Blob or File)
 * @param {string} [overrideFileName] - Optional: override filename
 */
const downloadFile = (fileData, overrideFileName) => {
  // Validate input
  if (!fileData || !(fileData instanceof Blob)) {
    console.error("downloadFile: Invalid input. Must be Blob or File.", fileData);
    return;
  }

  if (fileData.size === 0) {
    console.error("downloadFile: Cannot download empty file.");
    return;
  }

  // Use filename from File if available, otherwise fallback
  let fileName = overrideFileName
    ? overrideFileName
    : (fileData instanceof File)
      ? fileData.name
      : "download";

  if (!fileName.toLowerCase().endsWith(".pdf")) {
    fileName += ".pdf";
  }

  const url = window.URL.createObjectURL(fileData);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); // Cleaner than just .remove()

  // Critical: Revoke URL to prevent memory leak
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 100);
};

export default downloadFile;