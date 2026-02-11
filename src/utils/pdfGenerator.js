// utils/pdfGenerator.js
import axiosInstance from './apiClient';
import { toast } from 'react-toastify';
import downloadFile from './downloadFile';
import { buildUserDetailsForDisplay } from './userDetailsBuilder';

/**
 * Unified PDF generator for preview, submit, and approve
 *
 * @param {Object} options
 * @param {'preview'|'submit'|'approve'} options.requestType
 * @param {Object} options.userDetails
 * @param {Function} options.setIsDownloading   // React useState setter
 * @param {string} [options.documentNumber]     // Required for 'approve' and 'resubmit'
 * @param {string|number} [options.aisPerId]    // Required only for 'approve'
 *
 *
 * @returns {Promise<{success: true, file: File, docNum: string}>}
 *          rejects with {success: false, error: any}
 */
const pdfGenerator = async ({
  requestType,
  userDetails,
  setIsDownloading,
  documentNumber,
  aisPerId
}) => {
  const setLoading = typeof setIsDownloading === 'function' ? setIsDownloading : () => { };
  setLoading(true);

  // --- 1. Validate required data ---
  if (!userDetails) {
    toast.warn('No user details available for PDF generation.');
    setLoading(false);
    return Promise.reject({
      success: false,
      error: new Error('userDetails is missing')
    });
  }


  if (requestType === 'approve') {
    if (!documentNumber) {
      toast.warn('Document number is required for approval.');
      setLoading(false);
      return Promise.reject({
        success: false,
        error: new Error('documentNumber is required for approve')
      });
    }
    if (!aisPerId) {
      toast.warn('User ID is required for approval.');
      setLoading(false);
      return Promise.reject({
        success: false,
        error: new Error('aisPerId is required for approve')
      });
    }
  }
  console.log("documentNumber:", documentNumber);
  const honorifics = /^(mr|mrs|ms|miss|dr|prof)\.?\s+/i;
  const safeFullName = userDetails.full_name
    .replace(honorifics, '')   // remove honorific if present at start
    .trim()
    .replace(/\s+/g, '_');
  const fileName = `${userDetails.personal_details.PEN}_${safeFullName}_${requestType}.pdf`;
  const docNum = documentNumber ? documentNumber : `TRN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    let response;
    console.log('Full User Details:', JSON.stringify(userDetails));
    const renderedData = buildUserDetailsForDisplay(userDetails);
    console.log("Rendered Data for PDF:", JSON.stringify(renderedData));
    let payload = {
      pen_number: userDetails.personal_details.PEN,
      full_name: safeFullName,
      user_data_json: renderedData
    };

    // --- 2. Build endpoint & payload per type ---
    if (requestType === 'preview') {
      response = await axiosInstance.post(
        "/file-uploader/generate-pdf-preview-profile",
        payload,
        { headers: { "Content-Type": "application/json" }, responseType: "blob" }
      );

    }
    else if (requestType === 'submit' || requestType === 'approve') {
      const endpoint = "/file-uploader/generate-pdf-profile-save";

      if (requestType === 'submit') {
        payload.status = 'submit';
        payload.document_number = docNum;
      } else {
        payload.status = 'approve';
        payload.document_number = docNum;
        payload.selected_user_id = String(aisPerId);
      }

      response = await axiosInstance.post(endpoint, payload, {
        headers: { "Content-Type": "application/json" },
        responseType: "blob"
      });
    }
    else {
      throw new Error("Invalid requestType. Use 'preview', 'submit', or 'approve'");
    }

    // --- 3. Validate response ---
    if (!response.data || response.data.size === 0) {
      throw new Error("Empty PDF received from server");
    }

    // --- 4. Trigger download ---
    // const url = window.URL.createObjectURL(new Blob([response.data]));
    // const fileName = (userDetails.full_name || "document").replace(/ /g, "_") + ".pdf";
    console.log("file name:", fileName);
    const file = new File([response.data], fileName, { type: 'application/pdf' });
    if (requestType === 'preview') {
      downloadFile(file);
    }
    // --- 5. Success ---
    // toast.success("PDF downloaded successfully!");
    setLoading(false);

    return { success: true, file, docNum, base64: response.data };

  } catch (error) {
    console.error("PDF generation failed:", error);

    const msg = error.response
      ? `Server error: ${error.response.status}`
      : error.message || "Failed to generate PDF";

    toast.error(msg);
    setLoading(false);

    return Promise.reject({
      success: false,
      error
    });
  }
};

export default pdfGenerator;