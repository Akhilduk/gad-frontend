// app/layout.tsx

import { ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from 'next-themes';

import "./styles/style.css";
import "./globals.css";
interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
 <html
      lang="en"
      suppressHydrationWarning={true}   // ✅ ADD THIS
    >
      <body suppressHydrationWarning={true} className="antialiased bg-white text-zinc-950 dark:bg-gray-950 dark:text-white " >
         <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
    
        <ToastContainer
        position="top-center"
        autoClose={3000}
        newestOnTop={true}
        pauseOnHover
        draggable
        hideProgressBar={true}
      />
      </body>
    </html>
  );
}