import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query'; // We'll implement a simple version if not available, or use window matchMedia

const SidebarContext = createContext();

export const useSidebarContext = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  // Initialize from localStorage or default
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_open');
    // Default to true on desktop, false on mobile
    if (saved !== null) return JSON.parse(saved);
    return window.innerWidth >= 1024;
  });

  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('sidebar_expanded_sections');
    return saved ? JSON.parse(saved) : {
      'Operations': true,
      'Compliance & Quality': true,
      'Finance': true,
      'Suppliers': true,
      'Service Providers': true,
      'Admin': true
    };
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem('sidebar_open', JSON.stringify(isOpen));
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('sidebar_expanded_sections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  const toggleSidebar = () => setIsOpen(prev => !prev);
  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  return (
    <SidebarContext.Provider value={{ 
      isOpen, 
      toggleSidebar, 
      openSidebar, 
      closeSidebar, 
      expandedSections, 
      toggleSection 
    }}>
      {children}
    </SidebarContext.Provider>
  );
};