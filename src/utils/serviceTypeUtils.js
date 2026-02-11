export const SERVICE_TYPE_MAP = {
  "1": "IAS",
  "2": "IPS",
  "3": "IFS",
}

export const GAD_TYPE_MAP = {
  "1": "GAD-A",
  "2": "GAD-B",
  "3": "GAD-C",
};

// Function to get service type name from ID
export const getServiceTypeName = (id) => {
  return SERVICE_TYPE_MAP[id] || "Unknown"
}

// Function to get the service type ID from name
export const getServiceTypeId = (name) => {
  return Object.keys(SERVICE_TYPE_MAP).find(key => SERVICE_TYPE_MAP[key] === name) || ""
}


// Function to get Gad type name from ID
export const getGadTypeName = (id) => {
  return GAD_TYPE_MAP[id] || "unknown"
}

// Function to get the Gad type ID from name
export const getGadTypeId = (name) => {
  return Object.keys(GAD_TYPE_MAP).find(key => GAD_TYPE_MAP[key] === name) || ""
}



export const extractErrorMessage = (error) => {
  const data = error.response?.data;

  if (!data) return null;

  if (Array.isArray(data.detail)) {
    return data.detail.map(d => d.msg).join(', ');
  }

  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;

  return null;
};

// export const getErrorMessage = (status, backendMessage) => {
//   switch (status) {
//     case 400:
//       return backendMessage || 'Bad request. Please check your input.';
//     case 401:
//       return backendMessage || 'Incorrect email or password.';
//     case 403:
//       return backendMessage || 'You do not have permission to access this resource.';
//     case 404:
//       return backendMessage || 'Requested resource not found.';
//     case 422:
//       return backendMessage || 'Invalid input. Please check your email or password.';
//     case 500:
//     case 503:
//       return backendMessage || 'Server is currently unavailable. Please try again later.';
//     default:
//       return backendMessage || 'Something went wrong. Please try again.';
//   }
// };


export const getErrorMessage = (status, backendMessage) => {
  switch (status) {
    case 400:
      return 'Bad request. Please check your input.';
   case 401:
      return backendMessage || 'Incorrect email or password.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'Requested resource not found.';
    case 422:
      return 'Invalid input. Please check your email or password.';
    case 500: 
    case 503:
      return 'Server is currently unavailable. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

  