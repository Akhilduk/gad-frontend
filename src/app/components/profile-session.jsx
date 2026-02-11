// import { useState, useEffect, useRef } from "react";
// import { toast } from "react-toastify";
// import Image from "next/image";
// import ReactCrop from "react-image-crop";
// import "react-image-crop/dist/ReactCrop.css";
// import { CameraIcon } from "@heroicons/react/24/outline";
// import { motion } from "framer-motion";
// import { useRouter } from "next/navigation";
// import axiosInstance from "@/utils/apiClient";
// import { useProfileCompletion } from "@/contexts/Profile-completion-context";
// import { fileTypes } from "../../utils/fileValidator";

// export const ProfileSession = () => {
//   const router = useRouter();
//   const baseURL = process.env.NEXT_PUBLIC_API_URL;
//   const { overallProgress, updateSectionProgress, initialLoadComplete } = useProfileCompletion();
//   const progress = overallProgress();
  
//   const [userDetails, setUserDetails] = useState(null);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [croppedImage, setCroppedImage] = useState(null);
//   const [imageUrl, setImageUrl] = useState("/images/avatar.jpg");
//   const [loading, setLoading] = useState(false);
//   const [completedCrop, setCompletedCrop] = useState(null);
  
//   const imgRef = useRef(null);
//   const fileInputRef = useRef(null);

//   const [crop, setCrop] = useState({
//     unit: "px",
//     width: 200,
//     height: 200,
//     x: 0,
//     y: 0,
//     aspect: 1
//   });

//   const isProfileComplete = 100 === 100;

//   useEffect(() => {
//     const storedUserDetails = sessionStorage.getItem("user_details");
//     if (storedUserDetails) {
//       setUserDetails(JSON.parse(storedUserDetails));
//     }
//   }, []);

//   const fetchProfileImage = async () => {
//     try {
//       const response = await axiosInstance.get("/officer/officer");
      
//       const officerData = response.data.data.officer_data.get_all_officer_info_by_user_id;
//       console.log("Officer Data:", officerData.officer_info[0]?.fields);
//       const profileImage = officerData.officer_info[0]?.fields?.AIS_OFFICER?.profile_image||officerData.officer_info[0]?.fields?.GAD_OFFICER?.profile_image||officerData.officer_info[0]?.fields?.UNKNOWN?.profile_image;
      
//       if (profileImage) {
//         const imageSrc = `${baseURL}/officer/get-image/${profileImage}`;
//         setTimeout(() => setImageUrl(`${imageSrc}?t=${new Date().getTime()}`), 100);
//       }
//     } catch (error) {
//       console.error("Error fetching profile image:", error);
//     }
//   };

//   useEffect(() => { fetchProfileImage(); }, []);

//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setSelectedImage(e.target.result);
//         setCroppedImage(null);
//         setCompletedCrop(null);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const onImageLoad = (e) => {
//     const { width, height } = e.currentTarget;
//     const cropSize = Math.min(width, height) * 0.8;
//     const x = (width - cropSize) / 2;
//     const y = (height - cropSize) / 2;
    
//     const newCrop = {
//       unit: "px",
//       width: cropSize,
//       height: cropSize,
//       x: x,
//       y: y,
//       aspect: 1
//     };
    
//     setCrop(newCrop);
//   };

//   const getCroppedImg = (image, crop) => {
//     const canvas = document.createElement("canvas");
//     const scaleX = image.naturalWidth / image.width;
//     const scaleY = image.naturalHeight / image.height;
    
//     canvas.width = crop.width;
//     canvas.height = crop.height;
    
//     const ctx = canvas.getContext("2d");
    
//     ctx.drawImage(
//       image,
//       crop.x * scaleX,
//       crop.y * scaleY,
//       crop.width * scaleX,
//       crop.height * scaleY,
//       0,
//       0,
//       crop.width,
//       crop.height
//     );

//     return new Promise((resolve, reject) => {
//       canvas.toBlob((blob) => {
//         if (!blob) {
//           reject(new Error("Canvas is empty"));
//           return;
//         }
//         resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
//       }, "image/jpeg", 0.95);
//     });
//   };

//   const handleCropComplete = (crop) => {
//     if (crop.width && crop.height) {
//       setCompletedCrop(crop);
//     }
//   };

//   const handleSaveImage = async () => {
//     if (!completedCrop || !imgRef.current) {
//       toast.error("Please crop the image first");
//       return;
//     }

//     setLoading(true);
//     try {
//       const croppedImgFile = await getCroppedImg(imgRef.current, completedCrop);
      
//       const formData = new FormData();
//       formData.append("file", croppedImgFile);
//       formData.append("type", fileTypes.profile);

//       const response = await axiosInstance.post("/file-uploader/img", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
    
//       // if (response.status === 200) {
//       //   await axiosInstance.post("/officer/profile-image", 
//       //     { file_name: response.data.data }, 
//       //     { headers: { "Content-Type": "application/json" } }
//       //   );
//       // }

//       await fetchProfileImage();
//       setSelectedImage(null);
//       setCroppedImage(null);
//       setCompletedCrop(null);
//       updateSectionProgress("profile_photo", 1, 1);
//       toast.success("Profile picture updated successfully!");
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       toast.error("Failed to update profile picture");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePreviewClick = () => {
//     if (isProfileComplete) {
//       router.push("/er-profile/preview-profile");
//     }
//   };

//   const handleCancelCrop = () => {
//     setSelectedImage(null);
//     setCrop({
//       unit: "px",
//       width: 200,
//       height: 200,
//       x: 0,
//       y: 0,
//       aspect: 1
//     });
//     setCroppedImage(null);
//     setCompletedCrop(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   if (!userDetails || !initialLoadComplete) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 w-full shadow-sm">
//       {/* Profile Avatar with Progress Ring */}
//       <div className="relative w-32 h-32 mx-auto mb-4">
//         <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
//           <circle cx="18" cy="18" r="16" fill="none" 
//             className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1" />
//           <circle cx="18" cy="18" r="16" fill="none" 
//             className="stroke-indigo-600" strokeWidth="1" 
//             strokeDasharray={`${progress} 100`} strokeLinecap="round" />
//         </svg>

//         <div className="absolute inset-0 flex items-center justify-center">
//           <Image
//             src={imageUrl}
//             alt="Profile"
//             width={80}
//             height={80}
//             className="rounded-full object-cover border-2 border-white dark:border-gray-800"
//           />
//         </div>

//         <label className="absolute bottom-0 right-0 cursor-pointer">
//           <input 
//             type="file" 
//             accept="image/*" 
//             onChange={handleFileChange} 
//             className="hidden" 
//             ref={fileInputRef}
//           />
//           <div className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md">
//             <CameraIcon className="w-4 h-4" />
//           </div>
//         </label>

//         <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
//           <span className="text-xs font-medium bg-white dark:bg-gray-800 px-2 py-1 rounded-full shadow-sm text-gray-700 dark:text-white">
//             {progress}% Complete
//           </span>
//         </div>
//       </div>

//       {/* User Info */}
//       <div className="text-center mb-4">
//         <h2 className="text-lg font-semibold dark:text-white">
//           {userDetails.first_name} {userDetails.last_name}
//         </h2>
//         <p className="text-sm text-gray-600 dark:text-gray-300">{userDetails.position}</p>
//         <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userDetails.email}</p>
//       </div>

//       {/* Preview Button */}
//       <div className="flex justify-center">
//         <div className="relative group">
//           <motion.button
//             whileHover={isProfileComplete ? { scale: 1.02 } : {}}
//             whileTap={isProfileComplete ? { scale: 0.98 } : {}}
//             className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
//               isProfileComplete 
//                 ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md" 
//                 : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
//             }`}
//             onClick={handlePreviewClick}
//             disabled={!isProfileComplete}
//           >
//             Profile Preview
//           </motion.button>
          
//           {!isProfileComplete && (
//             <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
//               Complete profile to preview
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Image Cropper Modal */}
//       {selectedImage && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
//             <h3 className="text-xl font-semibold mb-4 dark:text-white text-center">
//               Crop Your Profile Picture
//             </h3>
            
//             <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
//               Drag to reposition and resize the circle to crop your image
//             </p>
            
//             <div className="flex-1 overflow-auto mb-6 flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
//               <ReactCrop
//                 crop={crop}
//                 onChange={(_, percentCrop) => setCrop(percentCrop)}
//                 onComplete={(c) => handleCropComplete(c)}
//                 aspect={1}
//                 circularCrop
//                 keepSelection
//                 minWidth={50}
//                 minHeight={50}
//               >
//                 <img 
//                   ref={imgRef} 
//                   src={selectedImage} 
//                   alt="Crop preview"
//                   onLoad={onImageLoad}
//                   style={{ 
//                     maxWidth: "100%", 
//                     maxHeight: "60vh",
//                     display: "block"
//                   }}
//                 />
//               </ReactCrop>
//             </div>

//             <div className="flex gap-3">
//               <button
//                 onClick={handleCancelCrop}
//                 disabled={loading}
//                 className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveImage}
//                 disabled={loading || !completedCrop}
//                 className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
//               >
//                 {loading ? (
//                   <span className="flex items-center justify-center gap-2">
//                     <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Saving...
//                   </span>
//                 ) : "Save Image"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };