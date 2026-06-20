import React from 'react';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

const MainLayout = ({ children }) => {
  const { isOpen } = useSidebarContext();
  const location = useLocation();

  // Determine if padding is needed (auth pages don't need layout, but MainLayout typically wraps protected routes)
  // Logic is handled in App.jsx via wrapper

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          isOpen ? "lg:ml-[280px]" : "lg:ml-[70px]"
        )}
      >
        <TopHeader />
        
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;