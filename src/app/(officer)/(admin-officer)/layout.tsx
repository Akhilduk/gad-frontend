'use client'
import { Breadcrumb } from '@/app/components/breadcrumb'
import AdminOfficeControlsSidenav from '@/app/components/sidemenu/admin-office-controls-sidenav'

export default function MasterControlsLayout ({children,}: Readonly<{children: React.ReactNode;}>) 
{
  return (
    <div className="grid grid-cols-12 gap-4">
        {/* 4-column width div */}
        <div className="col-span-12 sm:col-span-2 lg:col-span-1">
          <AdminOfficeControlsSidenav/>
        </div>
        {/* 8-column width div */}
        <div className="col-span-12 sm:col-span-10 lg:col-span-11">
          <div className="grid grid-cols-12">
            <div className="col-span-12 sm:col-span-12 lg:col-span-12">
              <Breadcrumb/>
            </div>
            <div className="col-span-12 sm:col-span-12 lg:col-span-12">
              {/* Main content area for cards */}
              {children}
            </div>
        </div>
      </div>
    </div>

    
  );
}




