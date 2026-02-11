import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

const iconMap = {
  warning: <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />,
  delete: <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />,
  info: <InformationCircleIcon className="h-8 w-8 text-indigo-500" />,
  success: <CheckCircleIcon className="h-8 w-8 text-green-500" />,
  error: <XCircleIcon className="h-8 w-8 text-red-500" />,
}

const colorMap = {
  warning: 'bg-yellow-500 hover:bg-yellow-600',
  delete: 'bg-red-600 hover:bg-red-700', 
  info: 'bg-indigo-500 hover:bg-indigo-600',
  success: 'bg-green-600 hover:bg-green-700',
  error: 'bg-red-600 hover:bg-red-700',
};

export default function ConfirmModal({
  isOpen,
  setIsOpen,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  iconType = "delete", // default
  confirmText = "Confirm"
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
        {/* Backdrop */}
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100" leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-2xl transition-all">

                <div className="flex items-center space-x-3">
                  {iconMap[iconType] || iconMap.warning}
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </Dialog.Title>
                </div>

                <div className="mt-3">
                  <div className="text-sm text-gray-600 dark:text-gray-300">{message}</div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                 <button
                    type="button"
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${colorMap[iconType] || colorMap.delete}`}
                    onClick={() => {
                      onConfirm();
                      setIsOpen(false);
                    }}
                  >
                     {confirmText}
                  </button>

                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
