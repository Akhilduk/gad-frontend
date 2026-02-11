'use client';
import { CheckCircleIcon } from '@heroicons/react/24/solid'; 
import { useState, useEffect } from 'react';
import axiosInstance from "@/utils/apiClient"; 
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';

const validatePassword = (password) => {
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

export default function ForgotPassword({
  step,
  onStepChange,
  onBackToLogin,
}) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpSentTime, setOtpSentTime] = useState(null);
  const [timer, setTimer] = useState(0);
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  const isValidEmail = (input) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  const showMessage = (message, isError = false) => {
    if (isError) {
      setError(message);
    } else {
      setOtpSentMessage(message);
    }

    setTimeout(() => {
      if (isError) {
        setError(null);
      } else {
        setOtpSentMessage('');
      }
    }, 10000);
  };

  const handleEmailSubmit = async () => {
    setLoading(true);
    setError(null);

    if (!isValidEmail(email)) {
      showMessage('Please enter a valid email address.', true);
      setLoading(false);
      return;
    }

    try {
      const { data } = await axiosInstance.post('/auth/forgot-password', { email });
      showMessage(data?.message || 'OTP has been sent to your email.');
      onStepChange('verify');
      setOtpSentTime(Date.now());
      setTimer(60);
    } catch (err) {
      const backendMessage = err?.response?.data?.detail || err?.response?.data?.message ||         
        'Something went wrong. Please try again.';
      showMessage(backendMessage, true);
    } 
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (otpSentTime && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [otpSentTime, timer]);

  const handleOtpSubmit = async () => {
    setLoading(true);
    setError(null);

    if (!otp || otp.trim() === '') {
      showMessage('Please enter the OTP.', true);
      setLoading(false);
      return;
    }

    // New: Enforce exact 6 digits (adjust length as needed) 
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      showMessage('OTP must be exactly 6 digits.', true);
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/password-reset-otp', { email, otp });
    
      if (response.status === 200) {
        const token = response.data?.data?.token;
        sessionStorage.setItem('reset_token', token);  
        sessionStorage.setItem('email', email); 
        onStepChange('reset');
      }
    } catch (error) {
      const backendError = error.response?.data?.detail || "Something went wrong. Please try again.";
      showMessage(backendError, true);
    } finally {
      setLoading(false);
    }    
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    setError(null);

    const storedEmail = sessionStorage.getItem('email');
    const resetToken = sessionStorage.getItem('reset_token');

    const validationErrors = []; 

    if (!newPassword || !confirmPassword) {
      validationErrors.push('Please fill in all required fields.');
    }

    if (/\s/.test(newPassword) || /\s/.test(confirmPassword)) {
      validationErrors.push('Passwords must not contain spaces.');
    }

    if (validationErrors.length === 0 && newPassword !== confirmPassword) {
      validationErrors.push('Passwords do not match.');
    }

    if (validationErrors.length === 0 && newPassword && confirmPassword && newPassword === confirmPassword) {
      validationErrors.push(...validatePassword(newPassword));
    }

    if (validationErrors.length > 0) {
      setPasswordErrors(validationErrors);
      setLoading(false);
      return;
    } else {
      setPasswordErrors([]);
    }

    try {
      const response = await axiosInstance.post('/auth/password-reset-confirm', {
        token: resetToken,
        email: storedEmail,
        new_password: newPassword,
      });

      if (response && response.status === 200) {
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('reset_token');
        onStepChange('done');
      } else {
        showMessage('Failed to reset password. Please try again.', true);
      }
    } catch (error) {
      const backendMessage =
        error?.response?.data?.detail ||
        'Something went wrong. Please try again.';
      showMessage(backendMessage, true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    if (timer > 0) return;

    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });

      if (response && response.status === 200) {
        setOtpSentTime(() => new Date().getTime());
        setTimer(60);
        showMessage('OTP has been sent to your email.');
      } else {
        showMessage('Failed to resend OTP. Please check your input.', true);
      }
    } 
    catch (error) {
      showMessage('Something went wrong. Please try again.', true);
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-red-500 text-sm mb-4 dark:text-red-400">{error}</p>}
      {otpSentMessage && !error && <p className="text-green-500 text-sm mb-4 dark:text-green-400">{otpSentMessage}</p>}
      {step === 'request' && (
        <form onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-500 dark:text-gray-300">
              Enter your Email ID
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400"
              />
            </div>
          </div>
          <button
            type="submit"
            onClick={handleEmailSubmit}
            disabled={loading || timer > 0}
            className="mt-4 w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {loading ? 'Sending OTP...' : timer > 0 ? `Resend OTP in ${timer}s` : 'Send OTP'}
          </button>
        </form>
      )}
      {step === 'verify' && (
        <form onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-500 dark:text-gray-300">
              Enter OTP
            </label>
            <div className="mt-2">
              <input
                id="otp"
                name="otp"
                type="text"  // Changed from "number" to "text" to treat as string
                inputMode="numeric"  // Keeps numeric keyboard on mobile for better UX
                pattern="[0-9]*"  // Hint for digit-only input
                maxLength="6"  // Enforce max length (adjust if not 6 digits)
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400"
              />
            </div>
          </div>
          <button
            type="submit"
            onClick={handleOtpSubmit}
            disabled={loading}
            className="mt-4 w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {loading ? 'Verifying OTP...' : 'Verify OTP'}
          </button>
          {timer === 0 && (
            <p className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer dark:text-indigo-400 dark:hover:text-indigo-300" onClick={handleResendOtp}>
              Resend OTP
            </p>
          )}
          {timer > 0 && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Resend OTP in {timer}s</p>
          )}
        </form>
      )}
      {step === 'reset' && (
        <form onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-500 dark:text-gray-300">
              New Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="block w-full rounded-md border-0 py-1.5 pr-10 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm mb-4 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showNewPassword ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-500 dark:text-gray-300">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirm-password"
                name="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                // onCopy={(e) => e.preventDefault()}
                // onPaste={(e) => e.preventDefault()}
                // onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="block w-full mb-3 rounded-md border-0 py-1.5 pr-10 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showConfirmPassword ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {passwordErrors.length > 0 && (
            <ul className="text-sm text-red-500 mb-4 list-disc list-inside dark:text-red-400">
              {passwordErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            onClick={handlePasswordReset}
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 mt-3 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="flex flex-col justify-center items-center text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-600 mb-2 dark:text-green-500" />
          <p className="text-green-600 mb-6 dark:text-green-500">Password has been reset successfully!</p>
        </div>
      )}
      <div className="text-end mt-4">
        <button
          onClick={onBackToLogin}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};