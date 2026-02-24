// utils/fileValidator.js

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const DOC_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain', // .txt
];

// Size limits in bytes
const SIZE_LIMITS = {
  image: 1 * 1024 * 1024, // 1MB
  document: 2 * 1024 * 1024, // 2MB
};
export const fileTypes = {
  'profile': 1,
  'award': 2,
  'disability_officer': 3, 
  'training_info': 4,
  'remove_dependents': 5,
};



/**
 * Common file validation function.
 *
 * @param {File} file - The file to validate.
 * @param {'image' | 'document' | 'both'} mode - Type of files to allow.
 * @returns {{ valid: boolean, error?: string }} - Validation result.
 */
export function validateFile(file, mode = 'both') {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const fileType = file.type;
  const fileSize = file.size;

  const isImage = IMAGE_TYPES.includes(fileType);
  const isDocument = DOC_TYPES.includes(fileType);

  // Allowed by mode
  if (mode === 'image' && !isImage) {
    return { valid: false, error: 'Only image files are allowed.' };
  }

  if (mode === 'document' && !isDocument) {
    return { valid: false, error: 'Only document files are allowed.' };
  }

  if (mode === 'both' && !(isImage || isDocument)) {
    return {
      valid: false,
      error: 'Only images or supported document files are allowed.',
    };
  }

  // Size validation
  if (isImage && fileSize > SIZE_LIMITS.image) {
    return { valid: false, error: 'Image size should not exceed 1 MB.' };
  }

  if (isDocument && fileSize > SIZE_LIMITS.document) {
    return { valid: false, error: 'Document size should not exceed 2 MB.' };
  }

  return { valid: true };
}


 