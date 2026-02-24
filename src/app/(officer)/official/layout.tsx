'use client';

import { Breadcrumb } from '@/app/components/breadcrumb';
import OnboardingSideNav from '@/app/components/sidemenu/official-sidenav';


export default function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sidebar */}
      <div className="col-span-12 sm:col-span-2 lg:col-span-1">
        <OnboardingSideNav />
      </div>

      {/* Main Content */}
      <div className="col-span-12 sm:col-span-10 lg:col-span-11">
        <div className="grid grid-cols-12">
          {/* Breadcrumb */}
          <div className="col-span-12">
            <Breadcrumb />
          </div>

          {/* Children Content */}
          <div className="col-span-12">
            <div className="">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
