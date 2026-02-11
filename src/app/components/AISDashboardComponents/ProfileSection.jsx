// components/ExecutiveDashboard/ProfileSection.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { 
  CameraIcon,
  CheckBadgeIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { EnvelopeIcon, IdentificationIcon, PhoneIcon, EyeIcon, CalendarIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import axiosInstance from "@/utils/apiClient";
import { fileTypes } from "@/utils/fileValidator";
import { useRouter } from "next/navigation";
import { useProfileCompletion } from "@/contexts/Profile-completion-context";
import { getServiceTypeName } from "@/utils/serviceTypeUtils";

// React Image Crop component
import ReactCrop from 'react-image-crop';
import { createPortal } from "react-dom";
import 'react-image-crop/dist/ReactCrop.css';

export const ProfileSection = ({ compactMode = false }) => {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();  
  const { overallProgress, updateSectionProgress, markSectionLoaded, markInitialLoadComplete } = useProfileCompletion();
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(true);
  const [isProgressCalculating, setIsProgressCalculating] = useState(false);
  
  const profileProgress = overallProgress ? overallProgress() : 0;
  
  const [profileImage, setProfileImage] = useState("/api/placeholder/120/120");
  const [isUploading, setIsUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [userDetails, setUserDetails] = useState(null);
  const [officerData, setOfficerData] = useState(null);
  const [sparkData, setSparkData] = useState(null);
  const [profileStatus, setProfileStatus] = useState('1');
  
  const baseURL = process.env.NEXT_PUBLIC_API_URL;

  // Check if profile is complete for preview
  const isProfileComplete = profileProgress >= 0;

  // Fetch user details and profile image on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setIsDataLoading(true);
      
      try {
        const storedUserDetails = sessionStorage.getItem("user_details");
        console.log("Stored User Details:", storedUserDetails);
        if (storedUserDetails) {
          try {
            setUserDetails(JSON.parse(storedUserDetails));
          } catch (error) {
            console.error("Error parsing user details:", error);
          }
        }
        const storedProfileStatus = sessionStorage.getItem('profile_status') || '1';
        setProfileStatus(storedProfileStatus);
        
        await fetchOfficerData();
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsLoading(false);
        setIsDataLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Monitor progress calculation
  useEffect(() => {
    if (typeof profileProgress === 'number') {
      setIsProgressCalculating(true);
      // Simulate calculation delay for better UX
      const timer = setTimeout(() => {
        setIsProgressCalculating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [profileProgress]);

  // Fetch officer data from API
 const fetchOfficerData = async () => {
  setIsDataLoading(true);
  setIsProfileImageLoading(true);
  
  try {
    const response = await axiosInstance.get("/officer/officer");
    const data = response.data.data;
    
    // Set officer data and spark data
    setOfficerData(data.officer_data);
    setSparkData(data.spark_data);
    
    // Fetch profile image
    await fetchProfileImage(data.officer_data);
    
    // Mark initial load as complete after all data is fetched
    markInitialLoadComplete();
    
  } catch (error) {
    console.error("Error fetching officer data:", error);
    // Use default avatar if API fails
    setProfileImage("/images/avatar.jpg");
    // Still mark as loaded
    updateSectionProgress('profile_photo', 0, 1);
    markSectionLoaded('profile_photo');
    markInitialLoadComplete();
  } finally {
    setIsDataLoading(false);
    setIsProfileImageLoading(false);
  }
};

  // Fetch profile image from officer data
const fetchProfileImage = async (officerDataParam = null) => {
  setIsProfileImageLoading(true);
  
  try {
    const data = officerDataParam || officerData;
    if (!data) {
      setProfileImage("/images/avatar.jpg");
      // Update profile completion: profile photo section has 0 completed fields
      updateSectionProgress('profile_photo', 0, 1);
      markSectionLoaded('profile_photo');
      return;
    }

    const officerInfo = data.get_all_officer_info_by_user_id?.officer_info?.[0];
    if (!officerInfo) {
      setProfileImage("/images/avatar.jpg");
      updateSectionProgress('profile_photo', 0, 1);
      markSectionLoaded('profile_photo');
      return;
    }

    // Look for profile image in different field sources
    const fields = officerInfo.fields;
    let profileImageName = null;

    // Check AIS_OFFICER first, then other sources
    if (fields?.AIS_OFFICER?.profile_image) {
      profileImageName = fields.AIS_OFFICER.profile_image;
    } else if (fields?.GAD_OFFICER?.profile_image) {
      profileImageName = fields.GAD_OFFICER.profile_image;
    } else if (fields?.SPARK?.profile_image) {
      profileImageName = fields.SPARK.profile_image;
    }

    if (profileImageName) {
      const imageSrc = `${baseURL}/officer/get-image/${profileImageName}`;
      // Add timestamp to prevent caching
      setProfileImage(`${imageSrc}?t=${new Date().getTime()}`);
      
      // Profile photo exists - mark as completed
      updateSectionProgress('profile_photo', 1, 1); // 1 completed out of 1 field
      console.log('✅ Profile photo found and marked as complete (1/1)');
    } else {
      setProfileImage("/images/avatar.jpg");
      // No profile photo - mark as incomplete
      updateSectionProgress('profile_photo', 0, 1); // 0 completed out of 1 field
      console.log('⚠️ No profile photo found, marked as incomplete (0/1)');
    }
    
    // Mark section as loaded regardless
    markSectionLoaded('profile_photo');
    
  } catch (error) {
    console.error("Error fetching profile image:", error);
    // Use default avatar if API fails
    setProfileImage("/images/avatar.jpg");
    // Mark as incomplete on error
    updateSectionProgress('profile_photo', 0, 1);
    markSectionLoaded('profile_photo');
  } finally {
    setIsProfileImageLoading(false);
  }
};

  // Helper function to extract field from multiple sources
  const getFieldValue = (fieldName, defaultValue = "") => {
    // First check user_details from sessionStorage
    if (userDetails && userDetails[fieldName]) {
      return userDetails[fieldName];
    }

    // Then check officer_data fields
    if (officerData) {
      const officerInfo = officerData.get_all_officer_info_by_user_id?.officer_info?.[0];
      if (officerInfo?.fields) {
        const fields = officerInfo.fields;
        
        // Check all possible field sources in priority order
        if (fields?.GAD_OFFICER?.[fieldName]) {
          return fields.GAD_OFFICER[fieldName];
        }
        if (fields?.AIS_OFFICER?.[fieldName]) {
          return fields.AIS_OFFICER[fieldName];
        }
        if (fields?.SPARK?.[fieldName]) {
          return fields.SPARK[fieldName];
        }
        if (fields?.UNKNOWN?.[fieldName]) {
          return fields.UNKNOWN[fieldName];
        }
      }
    }

    // Finally check spark_data
    if (sparkData) {
      const sparkPersonal = sparkData.data?.personal_details;
      if (sparkPersonal?.[fieldName]) {
        return sparkPersonal[fieldName];
      }
    }

    return defaultValue;
  };

  // Helper function to get name from multiple sources with combined honorifics
  const getUserName = () => {
    // Show loading state if data is still loading
    if (isDataLoading) return "Loading...";
    
    let honorifics = '';
    let name = '';

    // Get honorifics from multiple sources (priority order)
    if (userDetails?.honorifics) {
      honorifics = userDetails.honorifics;
    } else if (officerData) {
      const officerInfo = officerData.get_all_officer_info_by_user_id?.officer_info?.[0];
      if (officerInfo?.honorifics) {
        honorifics = officerInfo.honorifics;
      }
    }

    // Get name from multiple sources (priority order)
    // First priority: user_details
    if (userDetails) {
      const firstName = userDetails.first_name || '';
      const lastName = userDetails.last_name || '';
      name = `${firstName} ${lastName}`.trim();
    }

    // Second priority: SPARK data personal details
    if (!name && sparkData?.data?.personal_details?.name) {
      name = sparkData.data.personal_details.name;
    }

    // Third priority: officer_data first_name + last_name
    if (!name && officerData) {
      const officerInfo = officerData.get_all_officer_info_by_user_id?.officer_info?.[0];
      if (officerInfo) {
        const firstName = officerInfo.first_name || '';
        const lastName = officerInfo.last_name || '';
        name = `${firstName} ${lastName}`.trim();
      }
    }

    // Fourth priority: SPARK data from personal_details first_name + last_name (if separate fields exist)
    if (!name && sparkData?.data?.personal_details) {
      const sparkPersonal = sparkData.data.personal_details;
      const firstName = sparkPersonal.first_name || '';
      const lastName = sparkPersonal.last_name || '';
      if (firstName || lastName) {
        name = `${firstName} ${lastName}`.trim();
      }
    }

    // Combine honorifics with name if both exist
    if (honorifics && name) {
      return `${honorifics} ${name}`.trim();
    }
    
    // Return just name if no honorifics
    return name || 'Not Available';
  };

  // Helper function to get service type
  const getServiceType = () => {
    if (isDataLoading) return "Loading...";
    
    // First check user_details
    if (userDetails?.service_type_id) {
      return getServiceTypeName(userDetails.service_type_id.toString());
    }

    // Then check officer_data fields
    const serviceTypeId = getFieldValue('service_type_id');
    if (serviceTypeId) {
      return getServiceTypeName(serviceTypeId.toString());
    }

    return "Not Available";
  };

  // Helper function to get allotment year (batch)
  const getAllotmentYear = () => {
    if (isDataLoading) return "Loading...";
    
    // First check user_details
    if (userDetails?.allotment_year) {
      return userDetails.allotment_year;
    }

    // Then check officer_data fields
    const allotmentYear = getFieldValue('allotment_year');
    if (allotmentYear) {
      return allotmentYear;
    }

    return "Not Available";
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showCropModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCropModal]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Basic file type validation
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      
      // File size validation (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setShowCropModal(true);
        setZoom(1);
      };
      reader.onerror = () => {
        toast.error("Error reading image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfile = () => {
    fileInputRef.current?.click();
  };

  const handlePreviewProfile = () => {
    if (isProfileComplete) {
      sessionStorage.setItem('profileProgress', profileProgress);
      router.push("/er-profile/preview-profile");
    } else {
      toast.info("Complete your profile to preview it");
    }
  };

  const handlePreviewSparkProfile = () => {
    if (isProfileComplete) {
      sessionStorage.setItem('profileProgress', profileProgress);
      router.push("/er-profile/spark-preview");
    } else {
      toast.info("Complete your profile to preview it");
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const cropSize = Math.min(width, height) * 0.8;
    const x = (width - cropSize) / 2;
    const y = (height - cropSize) / 2;
    
    setCrop({
      unit: 'px',
      width: cropSize,
      height: cropSize,
      x: x,
      y: y,
      aspect: 1
    });
  };

  const getCroppedImg = (image, crop, zoom = 1) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.95);
    });
  };

  const handleCropComplete = async () => {
  if (!completedCrop || !imgRef.current) return;

  setIsCropping(true);
  setIsUploading(true);
  
  try {
    const croppedImgFile = await getCroppedImg(imgRef.current, completedCrop, zoom);
    
    // Upload the cropped image
    const formData = new FormData();
    formData.append("file", croppedImgFile);
    formData.append("type", fileTypes.profile);

    const response = await axiosInstance.post("/file-uploader/img", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    // Update profile completion and refresh image
    setIsDataLoading(true);
    await fetchOfficerData(); // This will call fetchProfileImage which updates the progress
    
    toast.success("Profile picture updated successfully!");
    
    // Also explicitly update the profile completion after successful upload
    updateSectionProgress('profile_photo', 1, 1);
    
    // Close modal and reset states
    setShowCropModal(false);
    setSelectedImage(null);
    setCrop({
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5
    });
    setZoom(1);
    
  } catch (error) {
    console.error("Error uploading image:", error);
    toast.error("Failed to update profile picture");
  } finally {
    setIsCropping(false);
    setIsUploading(false);
    setIsDataLoading(false);
  }
};

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setSelectedImage(null);
    setCrop({
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5
    });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetCrop = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const cropSize = Math.min(width, height) * 0.8;
      const x = (width - cropSize) / 2;
      const y = (height - cropSize) / 2;
      
      setCrop({
        unit: 'px',
        width: cropSize,
        height: cropSize,
        x: x,
        y: y,
        aspect: 1
      });
      setZoom(1);
    }
  };

  // User data with dynamic values from multiple sources
  const userData = {
    name: getUserName(),
    serviceType: getServiceType(),
    email: userDetails?.email || officerData?.get_all_officer_info_by_user_id?.officer_info?.[0]?.email || "Loading...",
    mobileNo: getFieldValue('mobile_no') || "Loading...",
    penNumber: getFieldValue('pen_number') || officerData?.get_all_officer_info_by_user_id?.officer_info?.[0]?.pen_number || "Loading...",
    karmasriID: getFieldValue('identity_number') || "Loading...",
    department: "Indian Administrative Service",
  };
  
  // Calculate name length and adjust font size
  const getNameFontSize = (name) => {
    if (!name || name === "Loading...") return 'text-lg';
    
    const nameLength = name.length;
    if (nameLength > 25) return 'text-sm';
    if (nameLength > 15) return 'text-base';
    return 'text-lg';
  };

  // Adjust layout based on compactMode
  const getProfileImageSize = () => compactMode ? "w-16 h-16" : "w-20 h-20";
  const getNameFontSizeClass = (name) => {
    const baseSize = getNameFontSize(name);
    if (compactMode && baseSize === 'text-lg') return 'text-base';
    if (compactMode && baseSize === 'text-base') return 'text-sm';
    if (compactMode && baseSize === 'text-sm') return 'text-xs';
    return baseSize;
  };

  // Main loading state
  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-indigo-900 via-indigo-500 to-indigo-900 rounded-2xl p-5 shadow-2xl text-white relative overflow-hidden flex flex-col justify-center items-center ${compactMode ? 'h-48' : 'h-64'} dark:from-gray-600 dark:via-gray-900 dark:to-gray-600`}>
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/30 border-t-white mb-4"></div>
        <p className="text-sm text-white/80">Loading profile...</p>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className={`bg-gradient-to-br from-indigo-900 via-indigo-500 to-indigo-900 rounded-2xl p-5 shadow-2xl text-white relative overflow-hidden dark:from-gray-950 dark:via-gray-800 dark:to-gray-950 dark:border border-gray-600 ${
          compactMode ? 'max-w-full' : ''
        }`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-8 -mt-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-8 -mb-8"></div>
        </div>

        <div className="relative z-10">
          {/* Profile Header */}
          <div className={`flex items-start justify-between ${compactMode ? 'mb-2' : 'mb-3'}`}>
            <div className="flex items-start space-x-3">
              <div 
                className="relative group cursor-pointer flex-shrink-0"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleEditProfile}
              >
                <div className={`${getProfileImageSize()} rounded-2xl border-4 border-white/30 bg-gray-200 overflow-hidden shadow-lg dark:bg-gray-600 dark:border-white/20 relative`}>
                  {isProfileImageLoading && (
                    <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
                    </div>
                  )}
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onLoad={() => setIsProfileImageLoading(false)}
                    onError={(e) => {
                      e.target.src = "/images/avatar.jpg";
                      setIsProfileImageLoading(false);
                    }}
                  />
                </div>
                
                {/* Upload Overlay */}
                <AnimatePresence>
                  {isHovered && !isProfileImageLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center"
                    >
                      <CameraIcon className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Uploading Indicator */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
                  </div>
                )}
                              
               {/* Verified Badge */}
                {profileStatus === '3' && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center dark:bg-green-600">
                    <CheckBadgeIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                {/* Name with loading state */}
                <div className={`${getNameFontSizeClass(userData.name)} font-bold leading-tight break-words overflow-wrap-anywhere hyphens-auto line-clamp-5 max-h-[6rem] overflow-hidden`}>
                  {isDataLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3/4 h-4 bg-white/20 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    userData.name
                  )}
                </div>
                
                <p className={`text-cyan-400 ${compactMode ? 'text-xs' : 'text-sm'} font-bold truncate mt-1 dark:text-cyan-300`}>
                  {isDataLoading ? (
                    <div className="w-24 h-3 bg-white/20 rounded animate-pulse"></div>
                  ) : (
                    userData.serviceType
                  )}
                </p>
                
                <p className={`text-indigo-100 ${compactMode ? 'text-xs' : 'text-xs'} truncate mt-1 dark:text-indigo-200`}>
                  Karmasri ID: {isDataLoading ? (
                    <span className="inline-block w-20 h-3 bg-white/20 rounded animate-pulse"></span>
                  ) : (
                    userData.karmasriID
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Hidden file input */} 
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Profile Stats - Single Card */}
          <div className={`bg-white/10 rounded-xl backdrop-blur-sm p-1 ${compactMode ? 'mb-2' : 'mb-3'} dark:bg-white/5`}>
            <div className="grid grid-cols-1 gap-1">
              {/* Email */}
              <div className="flex items-center justify-between p-1 border-b border-white/20 dark:border-white/10">
                <div className="flex items-center space-x-1">
                  <EnvelopeIcon className="w-3 h-3 text-cyan-400 dark:text-cyan-300" />
                  <span className={`text-indigo-100 pr-3 dark:text-indigo-200 ${compactMode ? 'text-xs' : 'text-xs'}`}>Email</span>
                </div>
                <span className={`break-all ${compactMode ? 'text-xs' : 'text-xs'} min-w-0 ${isDataLoading ? 'opacity-50' : ''}`}>
                  {isDataLoading ? (
                    <div className="w-32 h-3 bg-white/20 rounded animate-pulse"></div>
                  ) : (
                    userData.email
                  )}
                </span>
              </div>
              
              {/* PEN Number */}
              <div className="flex items-center justify-between p-1 border-b border-white/20 dark:border-white/10">
                <div className="flex items-center space-x-1">
                  <IdentificationIcon className="w-3 h-3 text-cyan-400 dark:text-cyan-300" />
                  <span className={`text-indigo-100 pr-3 dark:text-indigo-200 ${compactMode ? 'text-xs' : 'text-xs'}`}>PEN Number</span>
                </div>
                <span className={`${compactMode ? 'text-xs' : 'text-xs'} ${isDataLoading ? 'opacity-50' : ''}`}>
                  {isDataLoading ? (
                    <div className="w-20 h-3 bg-white/20 rounded animate-pulse"></div>
                  ) : (
                    userData.penNumber
                  )}
                </span>
              </div>
              
              {/* Mobile */}
              <div className="flex items-center justify-between border-b border-white/20 p-1 dark:border-white/10">
                <div className="flex items-center space-x-1">
                  <PhoneIcon className="w-3 h-3 text-cyan-400 dark:text-cyan-300" />
                  <span className={`text-indigo-100 pr-3 dark:text-indigo-200 ${compactMode ? 'text-xs' : 'text-xs'}`}>Mobile</span>
                </div>
                <span className={`${compactMode ? 'text-xs' : 'text-xs'} ${isDataLoading ? 'opacity-50' : ''}`}>
                  {isDataLoading ? (
                    <div className="w-24 h-3 bg-white/20 rounded animate-pulse"></div>
                  ) : (
                    userData.mobileNo
                  )}
                </span>
              </div>
              
              {/* Batch */}
              {/* <div className="flex items-center justify-between p-1">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="w-3 h-3 text-cyan-400 dark:text-cyan-300" />
                  <span className={`text-indigo-100 pr-3 dark:text-indigo-200 ${compactMode ? 'text-xs' : 'text-xs'}`}>Batch</span>
                </div>
                <span className={`${compactMode ? 'text-xs' : 'text-xs'} ${isDataLoading ? 'opacity-50' : ''}`}>
                  {isDataLoading ? (
                    <div className="w-16 h-3 bg-white/20 rounded animate-pulse"></div>
                  ) : (
                    userData.batch
                  )}
                </span>
              </div> */}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-indigo-100 dark:text-indigo-200 ${compactMode ? 'text-xs' : 'text-sm'}">Profile Completion</span>
              <div className="flex items-center space-x-2">
                {isProgressCalculating && (
                  <div className="animate-spin rounded-full h-3 w-3 border border-white/30 border-t-white"></div>
                )}
                <span className="font-semibold ${compactMode ? 'text-xs' : 'text-sm'}">
                  {isProgressCalculating ? "Calculating..." : `${profileProgress}%`}
                </span>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 dark:bg-white/10 relative overflow-hidden">
              {isProgressCalculating ? (
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-cyan-400/30 h-2 rounded-full animate-pulse"></div>
              ) : (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${profileProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-gradient-to-r from-green-400 to-cyan-400 h-2 rounded-full shadow-lg dark:from-green-500 dark:to-cyan-500"
                />
              )}
            </div>
          </div>
          
          {/* Preview Buttons */}
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Profile Preview Button */}
              <div className="relative">
                <motion.button
                  whileHover={isProfileComplete && !isDataLoading ? { scale: 1.02 } : {}}
                  whileTap={isProfileComplete && !isDataLoading ? { scale: 0.98 } : {}}
                  onClick={handlePreviewProfile}
                  disabled={!isProfileComplete || isDataLoading}
                  title={isDataLoading ? "Loading data..." : "Preview your profile"}
                  className={`w-full py-2 px-2 rounded-xl transition-all font-medium flex items-center justify-center space-x-1 group ${
                    isProfileComplete && !isDataLoading
                      ? "bg-white/20 hover:bg-white/30 text-white shadow-lg backdrop-blur-sm dark:bg-white/10 dark:hover:bg-white/20"
                      : "bg-white/10 text-white/50 cursor-not-allowed dark:bg-white/5"
                  }`}
                >
                  {isDataLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border border-white/30 border-t-white"></div>
                  ) : (
                    <EyeIcon className="w-3 h-3 text-cyan-400 dark:text-cyan-300 flex-shrink-0" />
                  )}
                  <span className="text-xs truncate">
                    {isDataLoading ? "Loading..." : "Profile"}
                  </span>
                </motion.button>
                
                {/* Desktop Tooltip */}
                <div className="hidden sm:block absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                  <div className="relative">
                    <div className="bg-gray-900 text-white text-xs font-medium rounded-lg py-1.5 px-3 whitespace-nowrap shadow-xl">
                      {isDataLoading ? "Loading data..." : "Preview your profile"}
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Spark Preview Button */}
              <div className="relative">
                <motion.button
                  whileHover={isProfileComplete && !isDataLoading ? { scale: 1.02 } : {}}
                  whileTap={isProfileComplete && !isDataLoading ? { scale: 0.98 } : {}}
                  onClick={handlePreviewSparkProfile}
                  disabled={!isProfileComplete || isDataLoading}
                  title={isDataLoading ? "Loading data..." : "Preview your SPARK profile"}
                  className={`w-full py-2 px-2 rounded-xl transition-all font-medium flex items-center justify-center space-x-1 group ${
                    isProfileComplete && !isDataLoading
                      ? "bg-white/20 hover:bg-white/30 text-white shadow-lg backdrop-blur-sm dark:bg-white/10 dark:hover:bg-white/20"
                      : "bg-white/10 text-white/50 cursor-not-allowed dark:bg-white/5"
                  }`}
                >
                  {isDataLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border border-white/30 border-t-white"></div>
                  ) : (
                    <EyeIcon className="w-3 h-3 text-cyan-400 dark:text-cyan-300 flex-shrink-0" />
                  )}
                  <span className="text-xs truncate">
                    {isDataLoading ? "Loading..." : "Spark Profile"}
                  </span>
                </motion.button>
                
                {/* Desktop Tooltip */}
                <div className="hidden sm:block absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                  <div className="relative">
                    <div className="bg-gray-900 text-white text-xs font-medium rounded-lg py-1.5 px-3 whitespace-nowrap shadow-xl">
                      {isDataLoading ? "Loading data..." : "Preview your SPARK profile"}
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Single message for both buttons */}
            {!isProfileComplete && (
              <p className="text-xs text-yellow-200 text-center mt-2 dark:text-yellow-300">
                Complete your profile to enable preview
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Responsive Crop Modal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showCropModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-2 dark:bg-black/80"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25 }}
                  className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl"
                >
              {/* Modal Header - Fixed */}
              <div className="relative p-4 bg-gradient-to-r from-indigo-700 to-indigo-500 flex-shrink-0 dark:from-indigo-800 dark:to-indigo-600">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-3 mb-1">
                    <PhotoIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2} />
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Crop Profile Picture
                    </h3>
                  </div>
                  <p className="text-indigo-100 text-sm sm:text-xs dark:text-indigo-200">
                    Adjust the circle to frame your perfect profile picture
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCancelCrop}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-xl dark:bg-white/5 dark:hover:bg-white/10"
                  disabled={isCropping}
                >
                  {isCropping ? (
                    <div className="animate-spin rounded-full h-4 w-4 border border-white/30 border-t-white"></div>
                  ) : (
                    <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </motion.button>
              </div>

              {/* Main Content - Scrollable on small screens */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden p-2">
                {/* Crop Area - Scrollable container for mobile */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="bg-gray-100 dark:bg-gray-800 w-full flex flex-col min-h-0">
                    {/* Loading overlay for crop area */}
                    {isCropping && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mb-4 mx-auto"></div>
                          <p className="text-white text-sm font-medium">Processing image...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Scrollable Image Container */}
                    <div className="flex-1 min-h-0 overflow-auto">
                      <div className="relative flex items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
                        {selectedImage && (
                          <div className="w-full h-full flex items-center justify-center">
                            <ReactCrop
                              crop={crop}
                              onChange={(newCrop) => setCrop(newCrop)}
                              onComplete={(c) => setCompletedCrop(c)}
                              aspect={1}
                              circularCrop
                              keepSelection
                              minWidth={60}
                              minHeight={60}
                              className="max-w-full max-h-full"
                              disabled={isCropping}
                            >
                              <img
                                ref={imgRef}
                                src={selectedImage}
                                alt="Crop preview"
                                onLoad={onImageLoad}
                                style={{ 
                                  transform: `scale(${zoom})`,
                                  transition: 'transform 0.2s ease',
                                  maxWidth: '100%',
                                  maxHeight: '60vh',
                                  height: 'auto',
                                  objectFit: 'contain',
                                  touchAction: 'none'
                                }}
                                className="select-none"
                              />
                            </ReactCrop>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Zoom Controls */}
                    <div className="sm:hidden mt-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 flex-shrink-0">
                      <div className="flex items-center justify-between space-x-3">
                        <span className="text-gray-700 dark:text-gray-300 text-sm font-medium flex-shrink-0">Zoom:</span>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={zoom}
                          onChange={(e) => setZoom(parseFloat(e.target.value))}
                          className="flex-1 accent-indigo-600 dark:accent-indigo-500"
                          disabled={isCropping}
                        />
                        <span className="text-gray-700 dark:text-gray-300 text-sm w-12 text-right font-medium flex-shrink-0">
                          {(zoom * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Desktop Zoom Controls */}
                    <div className="hidden sm:flex absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-xl p-4 max-w-xs w-full mx-auto dark:bg-black/60">
                      <div className="flex items-center space-x-3 w-full">
                        <span className="text-white text-sm flex-shrink-0">Zoom:</span>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={zoom}
                          onChange={(e) => setZoom(parseFloat(e.target.value))}
                          className="flex-1 accent-white"
                          disabled={isCropping}
                        />
                        <span className="text-white text-sm w-10 text-center flex-shrink-0">
                          {(zoom * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col flex-shrink-0">
                  <div className="flex-1 min-h-0 overflow-auto">
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      {/* Instructions */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center text-sm sm:text-base">
                          <ArrowsPointingOutIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                          How to Crop
                        </h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex items-start space-x-2">
                            <div className="w-4 h-4 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <div className="w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 flex-1">
                              <span className="font-medium text-gray-900 dark:text-white">Drag</span> circle to reposition
                            </p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-4 h-4 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <div className="w-2 h-2 border border-indigo-600 dark:border-indigo-400 rounded-full"></div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 flex-1">
                              <span className="font-medium text-gray-900 dark:text-white">Pinch/drag</span> to resize
                            </p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="w-4 h-4 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <ArrowPathIcon className="w-2 h-2 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 flex-1">
                              Use <span className="font-medium text-gray-900 dark:text-white">zoom</span> slider
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={resetCrop}
                          disabled={isCropping}
                          className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all font-medium flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCropping ? (
                            <div className="animate-spin rounded-full h-4 w-4 border border-gray-400/30 border-t-gray-400"></div>
                          ) : (
                            <ArrowPathIcon className="w-4 h-4" />
                          )}
                          <span>Reset Crop</span>
                        </motion.button>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCancelCrop}
                            disabled={isCropping}
                            className="px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
                          >
                            {isCropping ? (
                              <div className="animate-spin rounded-full h-4 w-4 border border-gray-400/30 border-t-gray-400"></div>
                            ) : (
                              <XMarkIcon className="w-4 h-4" />
                            )}
                            <span>Cancel</span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCropComplete}
                            disabled={isCropping || !completedCrop}
                            className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2 text-sm relative overflow-hidden dark:from-indigo-700 dark:to-indigo-600 dark:hover:from-indigo-800 dark:hover:to-indigo-700"
                          >
                            {isCropping ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  <ArrowPathIcon className="w-4 h-4" />
                                </motion.div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <CheckIcon className="w-4 h-4" />
                                <span>Save</span>
                              </>
                            )}
                            
                            {/* Loading Bar */}
                            {isCropping && (
                              <motion.div
                                className="absolute bottom-0 left-0 h-1 bg-white/30"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.5 }}
                              />
                            )}
                          </motion.button>
                        </div>
                      </div>

                      {/* Preview Hint */}
                      <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-xs text-indigo-700 dark:text-indigo-300">
                          Profile picture will be a perfect circle
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
