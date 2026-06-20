
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/hooks/useRole';
import { usePermissions } from '@/hooks/usePermissions';
import { moduleForRoute } from '@/constants/accessModules';
import { getNavigationItems } from '@/utils/navigationUtils';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, LogOut, X, BarChart3, Users } from 'lucide-react';
import RoleBadge from '@/components/RoleBadge';

const SidebarItem = ({ to, icon: Icon, label, isOpen }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to) && (to !== '/dashboard' || location.pathname === '/dashboard');
  const { closeSidebar } = useSidebarContext();

  const handleClick = () => {
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
        isActive
          ? "bg-[hsl(var(--terracotta))] text-white font-medium"
          : "text-slate-400 hover:bg-white/10 hover:text-white"
      )}
    >
      {Icon && <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />}

      <span className={cn(
        "whitespace-nowrap transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0 w-0 hidden lg:block"
      )}>
        {label}
      </span>

      {!isOpen && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-[hsl(var(--cinder))] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap hidden lg:block border border-white/10">
          {label}
        </div>
      )}
    </Link>
  );
};

const SidebarSection = ({ title, children, isOpen, isExpanded, onToggle }) => {
  if (!isOpen) {
    return (
      <div className="mb-2 py-2 border-t border-white/10">
        {children}
      </div>
    );
  }

  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
      >
        <span>{title}</span>
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      <div className={cn(
        "space-y-1 transition-all duration-300 overflow-hidden",
        isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        {children}
      </div>
    </div>
  );
};

const Sidebar = () => {
  const { isOpen, closeSidebar, expandedSections, toggleSection } = useSidebarContext();
  const { user, signOut, hasOpsHubAccess, userRole, canManageUsers } = useAuth();
  const { role } = useRole();
  const { can } = usePermissions();

  const navItems = useMemo(() => {
    const items = getNavigationItems(role);
    if (hasOpsHubAccess) {
      const dashboardIndex = items.findIndex(i => i.to === '/dashboard');
      const opsHubItem = { to: '/ops-hub', icon: BarChart3, label: 'Amazon Ops Hub', section: 'Main' };
      if (dashboardIndex >= 0) {
        items.splice(dashboardIndex + 1, 0, opsHubItem);
      } else {
        items.unshift(opsHubItem);
      }
    }

    if (canManageUsers || userRole === 'admin') {
      items.push({
        to: '/user-management',
        icon: Users,
        label: 'Users',
        section: 'Admin',
        description: 'Manage user roles and permissions'
      });
    }

    // Hide pages the user has no per-module view access to (UX only; RLS enforces).
    return items.filter(item => {
      const moduleId = moduleForRoute(item.to);
      return !moduleId || can(moduleId, 'view');
    });
  }, [role, hasOpsHubAccess, canManageUsers, userRole, can]);

  const groupedItems = navItems.reduce((acc, item) => {
    const section = item.section || 'Main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const sections = ['Main', 'Operations', 'Compliance & Quality', 'Finance', 'Supply Chain', 'Service Providers', 'Intake', 'Admin'];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeSidebar}
      />

      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-[hsl(var(--cinder))] border-r border-white/10 z-50 flex flex-col transition-all duration-300 ease-in-out",
          isOpen ? "w-[280px] translate-x-0" : "lg:w-[70px] -translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
          <div className={cn("flex items-center gap-2 overflow-hidden", !isOpen && "lg:justify-center w-full")}>
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--terracotta))] flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-white text-xs">AS</span>
            </div>
            <span className={cn("font-heading font-bold text-white whitespace-nowrap transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 hidden")}>
              Seller Ops
            </span>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-2 custom-scrollbar">
          {sections.map(sectionName => {
            const items = groupedItems[sectionName];
            if (!items || items.length === 0) return null;

            if (sectionName === 'Main') {
              return (
                <div key="main-section" className="mb-4">
                  {items.map(item => (
                    <SidebarItem key={item.to} {...item} isOpen={isOpen} />
                  ))}
                </div>
              );
            }

            return (
              <SidebarSection
                key={sectionName}
                title={sectionName}
                isOpen={isOpen}
                isExpanded={expandedSections[sectionName] !== false}
                onToggle={() => toggleSection(sectionName)}
              >
                {items.map(item => (
                  <SidebarItem key={item.to} {...item} isOpen={isOpen} />
                ))}
              </SidebarSection>
            );
          })}
        </div>

        {/* User footer */}
        <div className="border-t border-white/10 p-4">
          <div className={cn("flex items-center gap-3", !isOpen && "justify-center")}>
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--terracotta))] flex items-center justify-center text-white font-medium flex-shrink-0 text-sm">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            {isOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-slate-300 capitalize">
                    {userRole || 'Viewer'}
                  </span>
                  <button onClick={() => signOut()} className="text-slate-500 hover:text-red-400">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
