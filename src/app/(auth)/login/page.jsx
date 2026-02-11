'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import ForgotPassword from "@/app/(auth)/forgot-password/ForgotPassword";
import axiosInstance from "@/utils/apiClient";
import Image from 'next/image';
import ChangePasswordModal from "../change-password/change-password-modal";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon, HomeIcon } from '@heroicons/react/24/solid';
import { ThemeToggle } from '@/app/components/theme-toggle';
import toast, { Toaster } from 'react-hot-toast';
import { getServiceTypeName, extractErrorMessage, getErrorMessage, getGadTypeName  } from "@/utils/serviceTypeUtils";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

const LogIn = () => {
  const router = useRouter();

  // UI state
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'otp'
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [step, setStep] = useState('request'); // for ForgotPassword only

  // Common fields
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password login fields
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP login fields
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const otpInputsRef = useRef([]);
  const [otpRequested, setOtpRequested] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // First login / expiry
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isPasswordExpired, setIsPasswordExpired] = useState(false);

  const otpValue = useMemo(() => otpDigits.join(''), [otpDigits]);
  const canRequestOtp = useMemo(() => !!email && !loading && resendCooldown === 0, [email, loading, resendCooldown]);
  const canVerifyOtp = useMemo(() => otpValue.length === OTP_LENGTH && !loading, [otpValue, loading]);

  useEffect(() => {
    sessionStorage.clear();
    localStorage.clear();
    const usernameInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    setEmail(usernameInput?.value || "")
    setPassword(passwordInput?.value || "")
    
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const getHeading = () => {
    if (!isForgotPassword) {
      return authMode === 'password' ? 'Login to your account' : (otpRequested ? 'Enter OTP' : 'Login via OTP');
    }
    if (step === 'verify') return 'Verify OTP';
    if (step === 'reset') return 'Reset Your Password';
    if (step === 'request') return 'Forgot Password';
    return null;
  };

  const handleForgotPasswordToggle = () => {
    setIsForgotPassword(!isForgotPassword);
    setStep('request');
    setError(null); // Clear any lingering errors
  };

  const handleStepChange = (nextStep) => setStep(nextStep);

  // Shared post-login (tokens, RBAC, redirects)
  const finalizeLogin = async (payload) => {
    const {
      access_token: token,
      refresh_token,
      url,
      user,
    } = payload;

    const {
      role_id,
      id,
      is_first_login,
      last_password_changed,
      service_type_id,
      pen_number,
      dob,
      gad_role_id,
      ais_per_id,
    } = user;

    try {
      // Save session
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('refresh_token', refresh_token);
      sessionStorage.setItem('role_id', role_id);
      sessionStorage.setItem('user_id', id);
      sessionStorage.setItem('ais_per_id', ais_per_id);
      sessionStorage.setItem('pen_number', pen_number);
      sessionStorage.setItem('dob', dob);
      sessionStorage.setItem('user_details', JSON.stringify(user));
      sessionStorage.setItem('redirect_url', url);

      // Role-specific service type
      if (role_id === 2 && service_type_id) {
        sessionStorage.setItem('service_type', service_type_id);
        sessionStorage.setItem('service_type_name', getServiceTypeName(service_type_id));
      } else if (role_id === 3 && gad_role_id) {
        sessionStorage.setItem('service_type', gad_role_id);
        sessionStorage.setItem('service_type_name', getGadTypeName(gad_role_id));
      }

      // RBAC (best-effort)
      const [menuRes, permRes] = await Promise.allSettled([
        axiosInstance.get("/rbac/menu-structure"),
        axiosInstance.get("/rbac/page-permissions"),
      ]);
      const menuStructure = (menuRes.status === 'fulfilled' ? menuRes.value : {}).data?.data?.menu_structure || {};
      const permissions = (permRes.status === 'fulfilled' ? permRes.value : {}).data?.data?.permissions || [];
      sessionStorage.setItem("menu_structure", JSON.stringify(menuStructure));
      sessionStorage.setItem("permissions", JSON.stringify(permissions));

      if (menuRes.status === 'rejected') {
        console.warn("RBAC menu fetch failed:", menuRes.reason);
        toast.error("Warning: Menu structure could not be loaded. Some features may be unavailable.");
      }
      if (permRes.status === 'rejected') {
        console.warn("RBAC permissions fetch failed:", permRes.reason);
        toast.error("Warning: Permissions could not be loaded. Contact support if issues persist.");
      }

      // First login & expiry
      setIsFirstLogin(is_first_login);
      const expiryDays = parseInt(process.env.NEXT_PUBLIC_PASSWORD_EXPIRY_DAYS || '90', 10);
      const passwordExpired = last_password_changed
        ? dayjs().diff(dayjs(last_password_changed), 'day') > expiryDays
        : false;
      setIsPasswordExpired(passwordExpired);

      if (is_first_login || passwordExpired) {
        setPasswordModalOpen(true);
        toast.success(is_first_login ? "Welcome! Please change your password to continue." : "Your password has expired. Please update it now.");
        return;
      }

      // Profile status fetch (role 2)
      if (role_id === 2) {
        const statusResponse = await axiosInstance.post("/officer/profile-submit-status", {
          ais_per_id: String(ais_per_id),
        }).catch((e) => {
          console.error('Error fetching profile status:', e);
          throw e; // Re-throw to handle below
        });

        const { profile_status: timeline } = statusResponse.data.data;
        let profileStatus = '1';
        let modalType = 'incomplete';

        if (!timeline || timeline.length === 0) {
          profileStatus = '1';
          modalType = 'incomplete';
        } else {
          const latestStatus = timeline.find((s) => s.is_current) || timeline[timeline.length - 1];
          switch (latestStatus.action_key) {
            case 'approve':
              profileStatus = '3'; modalType = null; break;
            case 'submit':
              profileStatus = '2'; modalType = 'submitted'; break;
            case 'resubmit':
              profileStatus = '2'; modalType = 'resubmitted'; break;
            case 'return_for_correction':
              profileStatus = '1'; modalType = 'correction'; break;
            default:
              profileStatus = '1'; modalType = 'incomplete';
          }
        }
        sessionStorage.setItem('profile_status', profileStatus);
        sessionStorage.setItem('profile_modal_type', modalType ?? '');
      } else {
        sessionStorage.setItem('profile_status', user.profile_status || '3');
        sessionStorage.setItem('profile_modal_type', '');
      }

      // Redirect
      if (url) {
        toast.success("Login successful! Redirecting...");
        router.push(url);
      } else {
        throw new Error('No redirect URL provided by server');
      }
    } catch (err) {
      console.error("Login finalization failed:", err);
      // Clear session on critical failure
      sessionStorage.clear();
      const msg = err.response?.data?.detail || err.message || 'An unexpected error occurred during login setup. Please try again.';
      toast.error(msg);
      setError(msg);
    }
  };

  // Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Logging in...', { id: 'login-toast' });
      const response = await axiosInstance.post('/auth/login', { email, password });
      toast.dismiss('login-toast');
      await finalizeLogin(response.data.data);
    } catch (err) {
      toast.dismiss('login-toast');
      const status = err?.response?.status;
      const backendMessage = extractErrorMessage(err);
      const errorMsg = getErrorMessage(status, backendMessage);
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (action) => {
  setError(null);

  if (!email) {
    toast.error('Please enter your email to receive OTP');
    return;
  }

  try {
    setLoading(true);
    toast.loading('Sending OTP...', { id: 'otp-request-toast' });

    const payload = {
      email: email.toLowerCase(),
      action: action, // "send" or "resend"
    };

    const response = await axiosInstance.post('/auth/otp-login/request', payload);
    toast.dismiss('otp-request-toast');

    if (response.data.success) {
      setOtpRequested(true);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setResendCooldown(RESEND_COOLDOWN_SEC);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 0);
      toast.success(response.data.detail);
    } else {
      toast.error(response.data.detail);
      setError(response.data.detail);
    }
  } catch (err) {
    toast.dismiss('otp-request-toast');
    const msg = extractErrorMessage(err) || 'Something went wrong';
    toast.error(msg);
    setError(msg);
  } finally {
    setLoading(false);
  }
};
  // OTP: Verify
  const verifyOtp = async () => {
  setError(null);
  if (otpValue.length !== OTP_LENGTH) {
    toast.error('Please enter the complete 6-digit OTP');
    return;
  }

  try {
    setLoading(true);
    toast.loading('Verifying OTP...', { id: 'otp-verify-toast' });

    const response = await axiosInstance.post('/auth/otp-login/verify', {
      email: email.toLowerCase(),
      otp: otpValue,
    });

    toast.dismiss('otp-verify-toast');
    await finalizeLogin(response.data.data);

  } catch (err) {
    toast.dismiss('otp-verify-toast');
    const status = err?.response?.status;
    let backendMessage = extractErrorMessage(err);

    // Only override if backend didn't send a clear message
    if (!backendMessage) {
      if (status === 400) {
        backendMessage = 'OTP not found. Please request a new one.';
      } else if (status === 410) {
        backendMessage = 'OTP expired. Please request a new one.';
      } else if (status === 401) {
        backendMessage = 'Invalid OTP. Please try again.';
      } else {
        backendMessage = 'Verification failed. Please try again.';
      }
    }

    const errorMsg = backendMessage;
    toast.error(errorMsg);
    setError(errorMsg);

    // Clear OTP input on any OTP-related failure
    if ([400, 401, 410].includes(status)) {
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setOtpValue('');
      setOtpRequested(false); // Optional: allow re-request immediately
    }

  } finally {
    setLoading(false);
  }
};

  // OTP Inputs Handlers
  const handleOtpChange = (index, v) => {
    const val = v.replace(/\D/g, '');
    if (!val) {
      setOtpDigits(prev => {
        const copy = [...prev];
        copy[index] = '';
        return copy;
      });
      return;
    }
    const digit = val[val.length - 1];
    setOtpDigits(prev => {
      const copy = [...prev];
      copy[index] = digit;
      return copy;
    });
    if (index < OTP_LENGTH - 1) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    const filled = text.split('');
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < OTP_LENGTH; i++) next[i] = filled[i] || '';
    setOtpDigits(next);
    const last = Math.min(text.length, OTP_LENGTH) - 1;
    if (last >= 0) otpInputsRef.current[last]?.focus();
  };

//   const handleOtpPaste = (e) => {
//   e.preventDefault();
//   const text = e.clipboardData.getData('text').replace(/\D/g, '');
//   if (text.length > OTP_LENGTH) {
//     toast.error(`Invalid paste: OTP must be exactly ${OTP_LENGTH} digits.`);
//     return; // Reject entirely if it looks padded/phony
//   }
//   if (!text) return;
//   const filled = text.split('');
//   const next = Array(OTP_LENGTH).fill('');
//   for (let i = 0; i < OTP_LENGTH; i++) next[i] = filled[i] || '';
//   setOtpDigits(next);
//   const last = Math.min(text.length, OTP_LENGTH) - 1;
//   if (last >= 0) otpInputsRef.current[last]?.focus();
//   };

  const handleCloseModal = () => {
    setPasswordModalOpen(false);
    setError(null);
  };

  const AuthTabs = () => (
    <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        <button
          type="button"
          onClick={() => { setAuthMode('password'); setOtpRequested(false); setError(null); }}
          className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm ${
            authMode === 'password'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
          }`}
        >
          Password Login
        </button>

        <button
          type="button"
          onClick={() => { setAuthMode('otp'); setError(null); }}
          className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm ${
            authMode === 'otp'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
          }`}
        >
          OTP Login
        </button>
      </nav>
    </div>
  );

  return (
    <>
   
      <div className="flex min-h-full flex-1">
            {/* ==================== NAVBAR ==================== */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-primary-500 dark:bg-gray-950 text-white shadow-sm"
      >
        <div className="mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
              src="/images/logos/government-of-kerala-white.png"
              alt="Government of Kerala"
              className="h-12 w-auto"
            />
            <div>
              <h3 className="text-sm text-white/80 font-semibold">Government of Kerala</h3>
              <span className="text-xs text-white/70 font-light">Beta Version (Testing Environment - For Testing Purpose Only)</span>
            </div>
          </div>

       <div className="text-right flex items-center gap-3">
        
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white backdrop-blur transition  "
        >
          <HomeIcon className="h-6 w-6 text-indigo-700 hover:text-indigo-500 " />
        </Link>

        <ThemeToggle />
      </div>
        </div>
      </motion.nav>
        <div className="relative hidden w-0 flex-1 lg:block w-full min-h-screen">
          <div className="absolute inset-0 h-full w-full bg-primary-500 opacity-70 dark:bg-gray-950 opacity-70 z-10"></div>
          <Image
            alt="Login Image"
            src="/images/login.jpg"
            className="absolute inset-0 h-full w-full object-cover"
            fill
          />
          <div className="absolute inset-0 flex items-center justify-center text-white text-center z-10">
            <div className="flex flex-col items-center justify-center">
              <img
                src="/images/logos/government-of-kerala-white.png"
                alt="Government of Kerala Logo"
                className="mb-4"
                style={{ maxWidth: '128px', height: 'auto' }}
              />
              <div>
                <h3 className="text-1xl font-semibold">General Administration Department</h3>
                <h3 className="text-1xl">Government of Kerala</h3>
                 <div className="relative inline-block mb-4">
                        <motion.h1
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter relative"
                        >
                          {/* 3D Shadow Layers (lighter & fewer) */}
                          <span
                            className="absolute inset-0"
                            style={{
                              color: 'rgba(30, 58, 138, 0.25)',
                              transform: 'translate(2px, 4px)',
                              filter: 'blur(3px)',
                            }}
                          >
                            KARMASRI
                          </span>
                          <span
                            className="absolute inset-0"
                            style={{
                              color: 'rgba(30, 58, 138, 0.15)',
                              transform: 'translate(4px, 8px)',
                              filter: 'blur(6px)',
                            }}
                          >
                            KARMASRI
                          </span>

                          {/* Main Text: White with Navy Outline */}
                          <span
                            className="relative"
                            style={{
                              color: '#ffffff',
                              WebkitTextStroke: '2px #1e3a8a',
                              textStroke: '2px #1e3a8a',
                            }}
                          >
                            KARMASRI
                          </span>

                          {/* Flag Texture Overlay */}
                          <span
                            className="absolute inset-0"
                            style={{
                              color: 'transparent',
                              //background: `linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), url(/images/flag_wave.png) center/contain no-repeat`,
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextStroke: '2px #1e3a8a',
                              textStroke: '2px #1e3a8a',
                            }}
                          >
                            KARMASRI
                          </span>
                        </motion.h1>
                      </div>
               
                         {/* Expansion with Bold First Letters */}
                         <motion.h2
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: 0.8, delay: 0.5 }}
                           className="text-xl md:text-2xl font-light text-white leading-relaxed max-w-4xl mx-auto"
                         >
                           <span className="font-bold">K</span>erala Cadre <span className="font-bold">A</span>IS Officers' <span className="font-bold">R</span>esource <span className="font-bold">M</span>anagement<br />
                           <span className="font-bold">A</span>nd <span className="font-bold">S</span>ervice <span className="font-bold">R</span>elated <span className="font-bold">I</span>nterface
                         </motion.h2></div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-4 py-24 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
            <Link href="/">
              {/* Light mode logo */}
              <Image
                alt="Your Company"
                src="/images/logos/logo-en-white.png"
                className="h-16 w-auto dark:hidden"
                width={47}
                height={40}
              />

              {/* Dark mode logo */}
              <Image
                alt="Your Company"
                src="/images/logos/logo-en-white-w.png"
                className="h-16 w-auto hidden dark:block"
                width={47}
                height={40}
              />
            </Link>

            <h2 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
              {getHeading()}
            </h2>
          </div>


            <div className="mt-4">
              {!isForgotPassword && <AuthTabs />}

              <div className="mt-6">
                {isForgotPassword ? (
                  <ForgotPassword step={step} onStepChange={handleStepChange} onBackToLogin={handleForgotPasswordToggle} />
                ) : authMode === 'password' ? (
                  <form className="space-y-6" onSubmit={handlePasswordLogin}>
                    <div>
                      <label htmlFor="email" className="block text-sm/6 font-medium text-gray-600 dark:text-gray-300">
                        Email
                      </label>
                      <div className="mt-1">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value.toLowerCase())}
                          placeholder="Enter your email"
                          autoComplete="email"
                          className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm/6 font-medium text-gray-600 dark:text-gray-300">
                        Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          // onCopy={(e) => e.preventDefault()}
                          // onPaste={(e) => e.preventDefault()}
                          // onCut={(e) => e.preventDefault()}
                          onContextMenu={(e) => e.preventDefault()}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="block w-full rounded-md border-0 py-1.5 pr-10 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div />
                      <div className="text-sm/6">
                        <button
                          type="button"
                          onClick={handleForgotPasswordToggle}
                          className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="flex w-full justify-center rounded-md bg-primary-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                        disabled={loading}
                      >
                        {loading && <div className="spinner-border animate-spin border-2 border-t-4 border-white w-5 h-5 rounded-full mr-2"></div>}
                        {loading ? 'Logging In...' : 'Login'}
                      </button>
                    </div>
                  </form>
                ) : (
                  // OTP AUTH MODE
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="otp-email" className="block text-sm/6 font-medium text-gray-600 dark:text-gray-300">
                        Email
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          id="otp-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value.toLowerCase())}
                          placeholder="Enter your email"
                          autoComplete="email"
                          className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-indigo-500"
                          disabled={otpRequested && resendCooldown > 0}
                        />
                       <button
                          type="button"
                          onClick={() => requestOtp(otpRequested ? 'resend' : 'send')}
                          className="whitespace-nowrap rounded-md bg-primary-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                          disabled={!canRequestOtp}
                          title={resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Send OTP'}
                        >
                          {loading
                            ? 'Sending…'
                            : otpRequested
                              ? resendCooldown > 0
                                ? `Resend (${resendCooldown}s)`
                                : 'Resend OTP'
                              : 'Send OTP'}
                        </button>
                      </div>
                      {otpRequested && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          An OTP has been sent to your email. It's valid for a limited time.
                        </p>
                      )}
                    </div>

                    {otpRequested && (
                      <>
                        <div>
                          <label className="block text-sm/6 font-medium text-gray-600 dark:text-gray-300">
                            Enter 6-digit OTP
                          </label>
                          <div className="mt-2 flex gap-2">
                            {otpDigits.map((d, idx) => (
                              <input
                                key={idx}
                                ref={(el) => (otpInputsRef.current[idx] = el)}
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={1}
                                value={d}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                onPaste={handleOtpPaste}
                                className="w-10 h-12 text-center text-lg rounded-md border-0 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:focus:ring-indigo-500"
                              />
                            ))}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Didn't receive it? Check spam or try resending.
                            </p>
                            <button
                              type="button"
                              onClick={() => setOtpDigits(Array(OTP_LENGTH).fill(''))}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={verifyOtp}
                            className="flex w-full justify-center rounded-md bg-primary-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                            disabled={!canVerifyOtp}
                          >
                            {loading ? 'Verifying…' : 'Verify & Login'}
                          </button>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between">
                      <div />
                      <div className="text-sm/6">
                        <button
                          type="button"
                          onClick={handleForgotPasswordToggle}
                          className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      

      {isPasswordModalOpen && (
        <ChangePasswordModal
          closeModal={handleCloseModal}
          isFirstLogin={isFirstLogin}
          isPasswordExpired={isPasswordExpired}
        />
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
     
    </>
  );
};

export default LogIn;