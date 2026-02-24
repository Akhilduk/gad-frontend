'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react'; // Import Transition
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon, SparklesIcon  } from '@heroicons/react/24/solid';
import axiosInstance from '@/utils/apiClient';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

interface ChangePasswordModalProps {
  closeModal: () => void;
  isFirstLogin: boolean;
  isPasswordExpired: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  closeModal,
  isFirstLogin,
  isPasswordExpired,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Add this useEffect to clear errors when fields are updated
  useEffect(() => {
    if (errors.length > 0) {
      // Check if the current errors are related to validation (not backend errors)
      const hasValidationErrors = errors.some(error => 
        error.includes('fill in all fields') ||
        error.includes('do not match') ||
        error.includes('cannot be the same') ||
        error.includes('must not contain spaces') ||
        error.includes('At least 8 characters') ||
        error.includes('Must not exceed 20 characters') ||
        error.includes('uppercase letter') ||
        error.includes('lowercase letter') ||
        error.includes('One number') ||
        error.includes('special character')
      );

      if (hasValidationErrors) {
        setErrors([]);
      }
    }
  }, [oldPassword, newPassword, confirmPassword]); // Run when these fields change

  const validatePassword = (password: string) => {
    const validations = [
      { test: password.length >= 8, message: 'At least 8 characters' },
      { test: password.length <= 20, message: 'Must not exceed 20 characters' },
      { test: /[A-Z]/.test(password), message: 'One uppercase letter' },
      { test: /[a-z]/.test(password), message: 'One lowercase letter' },
      { test: /\d/.test(password), message: 'One number' },
      { test: /[@$!%*?&]/.test(password), message: 'One special character (@, $, !, %, *, ?, &)' },
    ];
    return validations.filter((v) => !v.test).map((v) => v.message);
  };

  // Get current password validation status for real-time feedback
  const getPasswordValidationStatus = () => {
    if (!newPassword) return null;
    
    return [
      { test: newPassword.length >= 8, message: 'At least 8 characters' },
      { test: newPassword.length <= 20, message: 'Must not exceed 20 characters' },
      { test: /[A-Z]/.test(newPassword), message: 'One uppercase letter' },
      { test: /[a-z]/.test(newPassword), message: 'One lowercase letter' },
      { test: /\d/.test(newPassword), message: 'One number' },
      { test: /[@$!%*?&]/.test(newPassword), message: 'One special character (@, $, !, %, *, ?, &)' },
    ];
  };

  const handleSave = async () => {
    setLoading(true);
    setErrors([]);

    const validationErrors: string[] = [];

    // Step 1: Basic required checks
    if (!oldPassword || !newPassword || !confirmPassword) {
      validationErrors.push('Please fill in all fields.');
    }

    // Step 2: Only check match, sameness, and space if all fields are filled
    if (oldPassword && newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        validationErrors.push('New password and confirm password do not match.');
      }
 
      if (newPassword === oldPassword) {
        validationErrors.push('New password cannot be the same as the old password.');
      }

      if (/\s/.test(oldPassword) || /\s/.test(newPassword) || /\s/.test(confirmPassword)) {
        validationErrors.push('Passwords must not contain spaces.');
      }

      // Step 3: If no errors so far, apply password rule validation
      if (validationErrors.length === 0) {
        validationErrors.push(...validatePassword(newPassword));
      }
    }

    // Show errors if any
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      await axiosInstance.post('auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
 
      toast.success('Password changed successfully! Please log in again.');
      
      // Close modal immediately
      closeModal();

      // Keep loading=true so button stays disabled
      setTimeout(() => {
        sessionStorage.clear();
        localStorage.clear();
        router.push('/login');
      }, 3000);

    } catch (err) {
      const axiosError = err as AxiosError;
      const data = axiosError.response?.data as { detail?: string | string[] };

      let detailErrors: string[];

      if (data?.detail) {
        if (typeof data.detail === 'string') {
          if (data.detail.toLowerCase().includes('invalid credentials')) {
            detailErrors = ['Current password is incorrect.'];
          } else {
            detailErrors = [data.detail];
          }
        } else {
          detailErrors = data.detail;
        }
      } else {
        detailErrors = ['Failed to change password. Please try again.'];
     }

      setErrors(detailErrors);
      setLoading(false); // only reset loader if error occurs
    }
  };

  const handlePasswordChange = (
    setter: (value: string) => void,
    value: string
  ) => {
    setter(value);
  };

  const getTitle = () => {
    if (isFirstLogin) return 'Create a New Password';
    if (isPasswordExpired) return 'Password Expired!';
    return 'Change Your Password';
  };

  const getSubtitle = () => {
    if (isFirstLogin) return 'Set your password below.';
    if (isPasswordExpired) return 'Reset your password below.';
    return 'Update your password below.';
  };

  const renderPasswordField = (
    label: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    isVisible: boolean,
    toggleVisible: () => void,
    placeholder: string
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full rounded-md border border-gray-300 p-2 pr-10 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleVisible();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isVisible ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  // Enhanced Password Policy Legend component
  const PasswordPolicyLegend = () => {
    const validationStatus = getPasswordValidationStatus();
    
    // Calculate password strength
    const calculateStrength = () => {
      if (!newPassword) return 0;
      const status = validationStatus || [];
      const passed = status.filter(v => v.test).length;
      return Math.round((passed / 6) * 100);
    };

    const strength = calculateStrength();
    const strengthColor = strength >= 80 ? 'bg-green-500' : strength >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    const strengthText = strength >= 80 ? 'Strong' : strength >= 60 ? 'Medium' : 'Weak';

    if (!validationStatus) {
      return (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800">
          <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center mb-2">
            <LockClosedIcon className="h-4 w-4 mr-2" />
            Password Requirements
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
              At least 8 characters
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
              Maximum 20 characters
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
              One uppercase letter
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
              One lowercase letter
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
              One number
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
              One special character
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400 md:col-span-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
              No spaces allowed
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-3">
        {/* Requirements Grid */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 dark:bg-gray-700 dark:border-gray-600">
          <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center mb-2">
            <LockClosedIcon className="h-4 w-4 mr-2" />
            Password Requirements
          </h4>
           {/* Password Strength Indicator */}
        {newPassword && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Password Strength</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{strengthText}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${strengthColor}`}
                style={{ width: `${strength}%` }}
              ></div>
            </div>
          </div>
        )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-6">
            {validationStatus.map((validation, index) => (
              <div key={index} className="flex items-center space-x-2">
                {validation.test ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
                )}
                <span className={`text-xs ${validation.test ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {validation.message}
                </span>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              {!/\s/.test(newPassword) && newPassword ? (
                <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
              )}
              <span className={!/\s/.test(newPassword) && newPassword ? 'text-green-600 dark:text-green-400 text-xs' : 'text-gray-600 dark:text-gray-400 text-xs'}>
                No spaces allowed
              </span>
            </div>
          </div>
        </div>

        {/* Additional Tips */}
        {newPassword && (
        <div className="bg-indigo-50 rounded-lg border border-indigo-300 p-3 dark:bg-indigo-900/20 dark:border-indigo-800">
            <p className="text-xs text-indigo-700 dark:text-indigo-600 flex items-start">
              <SparklesIcon  className="h-4 w-4 mr-2 text-yellow-400 mt-0.5 flex-shrink-0" />
              Make sure your password is easy to remember but hard to guess.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Prevent closing if it's first login or password expired
  const handleClose = () => {
    if (isFirstLogin || isPasswordExpired) {
      // Don't allow closing for first login or expired password
      return;
    }
    closeModal();
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-[10000]" // Increased z-index to be above everything
        onClose={handleClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 z-[10001] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 my-20 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white p-8 text-left shadow-xl transition-all w-full max-w-2xl dark:bg-gray-800">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <LockClosedIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                      {getTitle()}
                    </Dialog.Title>
                    <p className="text-sm text-gray-400 mt-2 dark:text-gray-500">
                      {getSubtitle()}
                    </p>
                  </div>
                  <div className="mt-8">
                    <form onSubmit={(e) => e.preventDefault()}>
                      {renderPasswordField(
                        'Current Password',
                        oldPassword,
                        (e) => handlePasswordChange(setOldPassword, e.target.value),
                        showOld,
                        () => setShowOld(!showOld),
                        'Enter old password'
                      )}

                      {renderPasswordField(
                        'New Password',
                        newPassword,
                        (e) => handlePasswordChange(setNewPassword, e.target.value),
                        showNew,
                        () => setShowNew(!showNew),
                        'Enter new password'
                      )}

                      {renderPasswordField(
                        'Confirm Password',
                        confirmPassword,
                        (e) => handlePasswordChange(setConfirmPassword, e.target.value),
                        showConfirm,
                        () => setShowConfirm(!showConfirm),
                        'Confirm new password'
                      )}
                    </form>
                         {errors.length > 0 && (
                      <ul className="mt-1 list-disc list-inside text-sm text-red-500 dark:text-red-400">
                        {errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    )}

                    {/* Enhanced Password Policy Legend */}
                    <PasswordPolicyLegend />
                  </div>
                </div>
                <div className="mt-5 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  {/* Only show cancel button if not first login or password expired */}
                  {!(isFirstLogin || isPasswordExpired) && (
                    <button
                      onClick={closeModal}
                      className="w-full bg-gray-300 hover:bg-gray-400 px-4 py-2 text-sm font-medium text-gray-700 rounded-md shadow-sm mt-2 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`w-full bg-indigo-700 hover:bg-indigo-600 px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm disabled:bg-indigo-300 mt-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:disabled:bg-indigo-700 ${
                      (isFirstLogin || isPasswordExpired) ? 'sm:col-span-2' : ''
                    }`}
                  >
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ChangePasswordModal;