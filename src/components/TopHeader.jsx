import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebarContext } from '@/contexts/SidebarContext';
import UserMenu from '@/components/UserMenu';
import GlobalMarketplaceSelect from '@/components/GlobalMarketplaceSelect';
import { Helmet } from 'react-helmet';

const TopHeader = () => {
  const { toggleSidebar } = useSidebarContext();

  return (
    <>
      <Helmet>
        <title>Amazon Seller Operation</title>
      </Helmet>
      
      <header className="sticky top-0 z-30 flex h-[60px] w-full items-center justify-between bg-[hsl(var(--cinder))] border-b border-white/10 px-4 md:px-6 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center text-sm">
            <span className="font-medium text-slate-300">Amazon Seller Operation</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
           <div className="hidden sm:block">
             <GlobalMarketplaceSelect />
           </div>
           <UserMenu />
        </div>
      </header>
    </>
  );
};

export default TopHeader;