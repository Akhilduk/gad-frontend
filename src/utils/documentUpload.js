// utils/documentUpload.js
import axiosInstance from '@/utils/apiClient'; 
export const uploadDocument = async (file, documentSubType, userId) => {
  try {
    const metadata = {
      document_type: "ER-Profile",
      document_sub_type: documentSubType,
      document_number: `TRN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: file.name,
      issuing_authority: "N/A",
      issue_date: new Date().toISOString().split("T")[0],
      created_by: userId || "unknown",
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(metadata));

    // If backend has magic module issue, try alternative approach
    const blob = new Blob([file], { type: file.type });
    const fileWithType = new File([blob], file.name, { type: file.type });
    formData.set("file", fileWithType);

    const response = await axiosInstance.post("/doc-uploader/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.message === "Uploaded & saved") {
      return response.data.document_id;
    }
    throw new Error(`Document upload failed for ${file.name}`);
  } catch (error) {
    console.error('Document upload error:', error);
    
    // Fallback: Try without magic module detection
    if (error.response?.data?.detail?.includes('magic')) {
      return await uploadDocumentFallback(file, documentSubType, userId);
    }
    
    throw error;
  }
};

// Fallback upload method
const uploadDocumentFallback = async (file, documentSubType, userId) => {
  try {
    const metadata = {
      document_type: "ER-Profile",
      document_sub_type: documentSubType,
      document_number: `TRN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: file.name,
      issuing_authority: "N/A",
      issue_date: new Date().toISOString().split("T")[0],
      created_by: userId || "unknown",
      file_type: file.type || 'application/octet-stream',
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(metadata));

    const response = await axiosInstance.post("/doc-uploader/simple-upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.document_id) {
      return response.data.document_id;
    }
    throw new Error('Upload failed');
  } catch (fallbackError) {
    console.error('Fallback upload failed:', fallbackError);
    throw fallbackError;
  }
};

export const viewDocument = async (documentId) => {
  try {
    const response = await axiosInstance.get(`/doc-uploader/get-document/${documentId}`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    window.open(url, '_blank');
    return url;
  } catch (err) {
    console.error('Error viewing document:', err);
    throw new Error('Failed to view document');
  }
};