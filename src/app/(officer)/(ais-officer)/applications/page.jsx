


import Image from 'next/image';

export default function ApplicationsPage() {
  return (
    <>
      
      <div className="grid grid-cols-12 gap-4 mt-5">
        {/* 4-column width div */}
        <div className="sm:col-span-12 lg:col-span-2"></div>
        <div className="sm:col-span-12 lg:col-span-8">
          <div className="bg-white border rounded-lg p-6 w-full dark:bg-gray-800 dark:border-gray-900 mb-3 ">
            <div className="flex flex-col items-center">
            <Image className="object-cover rounded-t-lg" src="../images/services/noapplications.svg" alt="Applications Image" width={372} height={208}/>
            </div>
              <div className="text-center">
                <h3 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                  No Applications
                </h3>
                <p className="mt-6 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
                  You haven't applied for any services yet !
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  {/* <a
                    href="#"
                    className="rounded-md bg-primary-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Dashboard
                  </a> */}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      
    </>
  )
}
