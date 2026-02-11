
import { ReactNode } from 'react';

interface StackedLayoutProps {
  children: ReactNode; // Typing children as ReactNode to handle any type of React children
}

export function StackedLayout({ children }: StackedLayoutProps) {
  return (
    <div className="relative isolate flex min-h-screen w-full flex-col bg-white">
      {/* Content */}
      <main className="flex flex-1 flex-col">
        <div className="grow">
          <div className="mx-auto max-w-12xl">
            {children} {/* Render the children passed into the component */}
          </div>
        </div>
      </main>
    </div>
  );
}
