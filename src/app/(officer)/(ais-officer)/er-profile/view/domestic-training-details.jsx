// 'use client'

// import { useState } from 'react'
// import { PlusIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
// import { ModalDomesticTrainingDetails } from '../modal/domestic-training-details'

//   export function DomesticTrainingDetails() {
//     const [isModalOpen, setModalOpen] = useState(false)

//   return (
//     <>
//       <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white rounded-xl border w-full mb-3">
//         <div className="p-3 sm:p-3">
//           <div>
//             <div className="px-4 sm:px-0 flex justify-between items-center">
//               <div>
//                 <h3 className="text-base/7 font-semibold text-gray-900">Domestic Training Details Details</h3>
//                 <p className="max-w-2xl text-sm/6 text-gray-500">Domestic Training details of Officer.</p>
//               </div>
              
//                 <button type="button" className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
//                   onClick={() => setModalOpen(true)} >
//                   Add <PlusIcon aria-hidden="true" className="-mr-0.5 size-5" />
//                 </button>
//                 <ModalDomesticTrainingDetails open={isModalOpen} setOpen={setModalOpen} />
              
//             </div>
//             <div className="mt-3">  
//               <dl className="grid grid-cols-1 sm:grid-cols-2">
//                 {/* comment starts : this will render as first set of data where edit option is needed  */}
//                 <div className="border-t border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
//                   <dt className="text-sm/6 font-medium text-gray-900">Domestic Training Details Details</dt>
//                   <dd className="text-sm/6 text-gray-700">-</dd>
//                 </div>
//                 <div className="border-t border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
//                   <button type="button" className="float-right inline-flex items-center gap-x-1.5 rounded-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-indigo-500 hover:ring-indigo-500 px-2.5 py-1.5 text-sm font-semibold text-grey  "
//                     onClick={() => setModalOpen(true)} >
//                     Edit <PencilSquareIcon aria-hidden="true" className="-mr-0.5 size-5" />
//                   </button>
//                   <ModalDomesticTrainingDetails open={isModalOpen} setOpen={setModalOpen} />
//                 </div>
//                 {/* comment ends : this will render as first set of data where edit option is needed  */}

//                 {/* comment starts : following edit option, rest of the data fields renders here  */}
//                 <div className="border-t border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
//                   <dt className="text-sm/6 font-medium text-gray-900">Domestic Training Details Details</dt>
//                   <dd className="text-sm/6 text-gray-700">-</dd>
//                 </div>
//                 <div className="border-t border-gray-100 px-3 py-3 sm:col-span-1 sm:px-0">
//                   <dt className="text-sm/6 font-medium text-gray-900">Domestic Training Details Details</dt>
//                   <dd className="text-sm/6 text-gray-700">-</dd>
//                 </div>
//                 {/* comment ends : following edit option, rest of the data fields renders here  */}
//               </dl>
//             </div>
//           </div>
//         </div>
//       </div>

      
//     </>
//   );
// }
