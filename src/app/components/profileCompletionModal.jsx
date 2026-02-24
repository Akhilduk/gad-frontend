'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { 
  ExclamationTriangleIcon, 
  ClockIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function ProfileCompletionModal({ 
  isOpen, 
  setIsOpen, 
  onNavigate, 
  modalType = 'incomplete',
  canClose = false // Default to non-closable
}) {
  const [officerName, setOfficerName] = useState('Officer');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('user_details');
      if (!raw) return;

      const user = JSON.parse(raw);
      const firstName = (user?.first_name || '').trim();
      const lastName = (user?.last_name || '').trim();
      const fullNameFromParts = `${firstName} ${lastName}`.trim();
      const fullName =
        fullNameFromParts ||
        (user?.name || '').trim() ||
        (user?.officer_name || '').trim();

      if (fullName) {
        setOfficerName(fullName);
      }
    } catch {
      // Keep fallback as "Officer" when user details are unavailable.
    }
  }, []);

  const incompleteDescription = useMemo(
    () => (
      <div className="space-y-3">
        <p className="font-semibold text-gray-800 dark:text-gray-100">{`Dear ${officerName || 'Officer'},`}</p>
        <p>
          Welcome to the KARMASRI Portal, the comprehensive digital platform for e-services and resource
          management of Kerala Cadre AIS Officers in Kerala.
        </p>
        <p>
          As a first step, please review, complete, and submit your Executive Record (ER) profile with all
          required details for verification. Once your ER profile is verified, related e-services will be
          activated as applicable.
        </p>
        <p>
          Kindly proceed to update your profile and begin your KARMASRI experience. If you need assistance,
          use Guided Mode or Help.
        </p>
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          Access to related actions will be enabled after ER profile verification.
        </div>
      </div>
    ),
    [officerName]
  );
  
  // Configuration for different modal types
  const modalConfig = {
    incomplete: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-red-600',
      title: 'ER Profile Action Required',
      subtitle: 'Complete your Executive Record to activate related e-services',
      description: incompleteDescription,
      buttonText: 'View Profile',
      buttonColor: 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500',
      buttonTextColor: 'text-white'
    },

    submitted: {
      icon: ClockIcon,
      iconColor: 'text-indigo-600',
      title: 'Profile Under Review',
      subtitle: 'Your submission is currently being verified',
      description:
        'Your profile has been submitted and is currently under review. You will be able to proceed with all other actions only after ER-profile verification.',
      buttonText: 'View Profile',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-500',
      buttonTextColor: 'text-white'
    },

    resubmitted: {
      icon: DocumentCheckIcon,
      iconColor: 'text-green-600',
      title: 'Profile Resubmitted',
      subtitle: 'Your updated profile is under review again',
      description:
        'Your updated profile has been resubmitted and is under review again. You will be able to proceed with all other actions only after ER-profile verification.',
      buttonText: 'View Profile',
      buttonColor: 'bg-green-600 hover:bg-green-500 focus-visible:ring-green-500',
      buttonTextColor: 'text-white'
    },

    correction: {
      icon: DocumentMagnifyingGlassIcon,
      iconColor: 'text-amber-600',
      title: 'Correction Required',
      subtitle: 'Please fix the requested items and resubmit',
      description:
        'Your profile needs corrections before it can be verified. Please update the requested details and resubmit your profile for verification. You will be able to proceed with all other actions only after ER-profile verification.',
      buttonText: 'View Profile',
      buttonColor: 'bg-amber-600 hover:bg-amber-500 focus-visible:ring-amber-500',
      buttonTextColor: 'text-white'
    }

  };


  const config = modalConfig[modalType] || modalConfig.incomplete;
  const IconComponent = config.icon;

  // Handle close attempt - only close if allowed
  const handleClose = () => {
    if (canClose) {
      setIsOpen(false);
    }
    // If canClose is false, do nothing (modal stays open)
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={handleClose} // Use controlled close handler
      >
        {/* Backdrop - make it non-interactive if not closable */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className={`fixed inset-0 backdrop-blur-sm ${
              canClose ? 'bg-black/30 cursor-pointer' : 'bg-black/50 cursor-not-allowed'
            }`}
            onClick={canClose ? handleClose : undefined}
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-2xl ring-1 ring-black/5 transition-all">
                <div className="pointer-events-none absolute -top-16 -right-14 h-36 w-36 rounded-full bg-indigo-200/40 blur-2xl dark:bg-indigo-700/20"></div>
                <div className="pointer-events-none absolute -bottom-16 -left-14 h-36 w-36 rounded-full bg-cyan-200/40 blur-2xl dark:bg-cyan-700/20"></div>

                <div className="relative mb-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-cyan-50 to-white p-4 dark:border-gray-700 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-indigo-100 dark:bg-gray-900 dark:ring-gray-700">
                      <IconComponent 
                        className={`h-7 w-7 ${config.iconColor}`}
                        strokeWidth={2} 
                      />
                    </div>
                    <div>
                      <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                        {config.title}
                      </Dialog.Title>
                      <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {config.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-xl border border-gray-100 bg-white/90 p-4 text-sm leading-relaxed text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-300">
                  <div>
                    {config.description}
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {/* Remove "Later" button when modal is non-closable */}
                  {canClose ? (
                    <>
                      <button
                        type="button"
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        onClick={handleClose}
                      >
                        Later
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg px-4 py-2 text-sm font-semibold ${config.buttonTextColor} ${config.buttonColor} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                        onClick={onNavigate}
                      >
                        {config.buttonText}
                      </button>
                    </>
                  ) : (
                    // Only show the action button when non-closable
                    <button
                      type="button"
                      className={`rounded-lg px-4 py-2 text-sm font-semibold ${config.buttonTextColor} ${config.buttonColor} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                      onClick={onNavigate}
                    >
                      {config.buttonText}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
