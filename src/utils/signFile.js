// utils/signPdf.js
import { getFormattedTimestamp } from './getFormattedTimestamp';
import downloadFile from './downloadFile';
import { v4 as uuidv4 } from 'uuid';
import axiosInstance from './apiClient';

/**
 * Signs a PDF file using the local PKI service[](http://127.0.0.1:1621)
 *
 * @param {File} pdfFile - The input PDF file to sign
 * @param {'submit'|'approve'} requestType - The type of request
 * @param {string|number} portNumber - The port number of the local PKI service
 * @param {string} documentNumber
 * @param {Object} [options] - Optional signing parameters
 * @param {string|number} [aisPerId] - Required only for 'approve'
 * 
 * @returns {Promise<{success: true, signedFile:File}>} Returns on success
 * @throws {Error} - If signing fails
 */
const signPdf = async (
  pdfFile,
  requestType,
  portNumber,
  documentNumber,
  options = {},
  aisPerId
) => {
  if (!(pdfFile instanceof File)) {
    throw new Error("First argument must be a File object");
  }

  if (pdfFile.type !== "application/pdf") {
    throw new Error("File must be a PDF");
  }

  console.log("requestType===",requestType);
  console.log("requestType=approve:",requestType === 'approve');

  if (requestType === 'approve' && !aisPerId) {
    toast.warn('User ID is required for approval.');
    setLoading(false);
    return Promise.reject({
      success: false,
      error: new Error('aisPerId is required for approve')
    });
  }

  // Convert File to base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const base64String = await toBase64(pdfFile);
  const base64Data = base64String.replace(/^data:application\/pdf;base64,/, "");

  const timestamp = getFormattedTimestamp();

  const defaultOptions = {
    page: "last",
    cood: "495,10",
    size: "135,75",
    islock: "yes",
    invisiblesign: "no",
    greentick: "yes",
    enableltv: "yes",
    enabletimestamp: "yes",
    location: "Trivandrum",
    reason: "Officer ER Submit",
    customtext: " "
  };

  const pdfOptions = { ...defaultOptions, ...options };

  const requestBody = {
    request: {
      command: "pkiNetworkSign",
      ts: timestamp,
      txn: uuidv4(),
      certificate: {
        attribute: ["AP=1", "CN=", "SN=", "TC=SG"]
      },
      file: {
        attribute: ["type=pdf"]
      },
      pdf: pdfOptions,
      data: base64Data
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 100 second timeout
  let result;
    console.log("requestBody===",requestBody.request)

    const response = await fetch(`http://127.0.0.1:${portNumber}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal // Pass the abort signal
    });

    clearTimeout(timeoutId); // Clear timeout if request succeeds in time
    result = await response.json();

    if (!response.ok) {
      console.log("step 1")
      throw new Error(result.error || "Network request failed");
    }

    if (result.response.status !== "ok") {
      console.log("step 2")
      console.log("signer response:", result);
      console.log("signer response error text:", result.response.error?.text);
      throw new Error(result.response.error?.text || "Signing failed");
    }
  


  const signedBase64 = result.response.data;
  const signedFileName = pdfFile.name.replace(/\.pdf$/i, "_signed.pdf");

  // Convert base64 back to File
  const signedFile = new File(
    [Uint8Array.from(atob(signedBase64), c => c.charCodeAt(0))],
    signedFileName,
    { type: "application/pdf" }
  );

  try {
    const formData = new FormData();
    formData.append("file", signedFile);
    formData.append("status", requestType)
    formData.append("document_number", documentNumber);
    formData.append("file_name", signedFileName);
    if (requestType === 'approve') {
      formData.append("selected_user_id", aisPerId)
    }
    console.log("formData:",[...formData.entries()]);
    const saveResponse = await axiosInstance.post("file-uploader/signed-pdf-save", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    console.log("Save response:", saveResponse);
    if (!saveResponse.data?.success) {
      console.log("step 5")
      throw new Error(saveResponse.data?.detail || "Internal Server Error on Uploading Signed File");
    }
  } catch (error) {
    console.log("step 6")
    throw new Error(error || "Unexpected Error while Uploading Signed File")
  }

  downloadFile(signedFile, signedFileName);

  return { success: true, signedFile };
};

export default signPdf;