import React from 'react';
import { Navigate } from 'react-router-dom';
import TopHeader from '@/components/TopHeader';

/**
 * @deprecated Header is deprecated. Use TopHeader and Sidebar in MainLayout instead.
 * This component acts as a passthrough to TopHeader for backward compatibility if still imported directly.
 * Pages should now be wrapped in MainLayout which includes TopHeader automatically.
 */
const Header = () => {
  return <TopHeader />;
};

export default Header;