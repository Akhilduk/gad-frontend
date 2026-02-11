import { useEffect, useState } from 'react';
import { getServiceTypeName, getGadTypeName } from "../../utils/serviceTypeUtils";
import moment from 'moment'; // Import moment

const UserNav = () => {
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    serviceType: '',
    lastLogin: '',
  });

  useEffect(() => {
    const userDetails = JSON.parse(sessionStorage.getItem("user_details") || "{}");
    const roleId = sessionStorage.getItem("role_id");
    const serviceTypeId = sessionStorage.getItem("service_type") || "";
    let userTypeDetails = "";

    if (roleId === "2") {
      userTypeDetails = getServiceTypeName(serviceTypeId);
    } else if (roleId === "3") {
      userTypeDetails = getGadTypeName(serviceTypeId);
    } else if (roleId === "1") {
      userTypeDetails = "Admin";
    } else if (roleId === "4") {
      userTypeDetails = "Verification Officer";
    }

    const firstName = userDetails.first_name || "";
    const lastName = userDetails.last_name || "";
    const serviceType = userTypeDetails || "";

    let lastLogin = "";
    if (userDetails.last_login) {
      try {
        const date = moment(userDetails.last_login);
        if (date.isValid()) {
          // Format: DD MM YYYY, hh:mm A (e.g., 25 12 2023, 02:30 PM)
          lastLogin = date.format('DD MM YYYY, hh:mm A');
          
          // Alternative formats if needed:
          // lastLogin = date.format('DD/MM/YYYY, hh:mm A');  // 25/12/2023, 02:30 PM
          // lastLogin = date.format('DD-MM-YYYY, hh:mm A');  // 25-12-2023, 02:30 PM
          // lastLogin = date.format('DD MMM YYYY, hh:mm A'); // 25 Dec 2023, 02:30 PM
          // lastLogin = date.format('DD MMMM YYYY, hh:mm A'); // 25 December 2023, 02:30 PM
        } else {
          lastLogin = "Invalid date";
        }
      } catch (error) {
        console.error("Error formatting last login date:", error);
        lastLogin = "Date format error";
      }
    }

    setUserInfo({
      firstName,
      lastName,
      serviceType,
      lastLogin,
    });
  }, []);

  return (
    <div className="flex flex-col items-start space-y-1 min-w-0 flex-1">
      <div className="flex items-center w-full min-w-0">
        <p className="text-xs sm:text-sm text-indigo-600 font-semibold text-gray-800 uppercase truncate min-w-0 flex-1 mr-1">
          {`${userInfo.firstName} ${userInfo.lastName}`}
        </p>
        <span className="inline-block bg-gradient-to-r from-indigo-600 to-indigo-600 text-white text-xs px-2 py-0.5 rounded-xl shadow-sm uppercase whitespace-nowrap flex-shrink-0">
          {userInfo.serviceType}
        </span>
      </div>
      <p className="text-xs text-gray-400 truncate w-full">
        {userInfo.lastLogin
          ? `Last login: ${userInfo.lastLogin}`
          : "This is your first login"}
      </p>
    </div>
  );
};

export default UserNav;