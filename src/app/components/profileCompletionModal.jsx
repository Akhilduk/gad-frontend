'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
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
  
  // Configuration for different modal types
  const modalConfig = {
    incomplete: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-red-600',
      title: 'Profile Action Required',
      description:
        'Please complete all required details and submit your profile for verification. You will be able to proceed with all other actions only after ER-profile verification.',
      buttonText: 'View Profile',
      buttonColor: 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500',
      buttonTextColor: 'text-white'
    },

    submitted: {
      icon: ClockIcon,
      iconColor: 'text-indigo-600',
      title: 'Profile Under Review',
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-2xl transition-all">
                <div className="flex items-center space-x-3">
                  <IconComponent 
                    className={`h-8 w-8 ${config.iconColor}`}
                    strokeWidth={2} 
                  />
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                    {config.title}
                  </Dialog.Title>
                </div>

                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {config.description}
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  {/* Remove "Later" button when modal is non-closable */}
                  {canClose ? (
                    <>
                      <button
                        type="button"
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 mr-3"
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