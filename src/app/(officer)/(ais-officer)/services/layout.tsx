'use client'


import { Breadcrumb } from '@/app/components/breadcrumb'
import ServicesSidenav from '@/app/components/sidemenu/services-sidenav'




export default function ServicesLayout ({children,}: Readonly<{children: React.ReactNode;}>) 
{
  return (
   
    <div className="grid grid-cols-12 gap-4">
        {/* 4-column width div */}
        <div className="col-span-12 sm:col-span-2 lg:col-span-1">
          <ServicesSidenav />
        </div>
        {/* 8-column width div */}
        <div className="col-span-12 sm:col-span-10 lg:col-span-11">
          <div className="grid grid-cols-12">
            <div className="col-span-12 sm:col-span-12 lg:col-span-12">
              <Breadcrumb />
            </div>
            <div className="col-span-12 sm:col-span-12 lg:col-span-12">
              {/* Main content area for cards */}
              
                <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 ">
                  {children}
                </div>
            </div>
        </div>
      </div>
    </div>
   
    
  );
}




