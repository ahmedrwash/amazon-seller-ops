import { 
  LayoutDashboard, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  Package, 
  GitPullRequest, 
  Truck, 
  CheckSquare, 
  ShieldCheck, 
  Settings,
  Users,
  RefreshCw,
  Mail,
  Users2,
  FlaskConical
} from 'lucide-react';
import { ROLES } from '@/constants/roleConstants';

export function getNavigationItems(role) {
  // Define all possible items in desired order
  // Sections: Main (null), Operations, Compliance & Quality, Finance, Supply Chain, Service Providers, Intake, Admin
  
  const allItems = [
    { 
      to: "/dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard, 
      section: null, 
      roles: [ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE, ROLES.VIEWER] 
    },
    { 
      to: "/products", 
      label: "Products", 
      icon: ShoppingBag, 
      section: "Operations", 
      roles: [ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE, ROLES.VIEWER] 
    },
    { 
      to: "/pipeline", 
      label: "Pipeline", 
      icon: GitPullRequest, 
      section: "Operations", 
      roles: [ROLES.ADMIN, ROLES.OPS] 
    },
    { 
      to: "/tasks", 
      label: "Tasks", 
      icon: CheckSquare, 
      section: "Operations", 
      roles: [ROLES.ADMIN, ROLES.OPS] 
    },
    { 
      to: "/inventory", 
      label: "Inventory", 
      icon: Package, 
      section: "Operations", 
      roles: [ROLES.ADMIN, ROLES.OPS] 
    },
    { 
      to: "/compliance", 
      label: "Compliance", 
      icon: ShieldCheck, 
      section: "Compliance & Quality", 
      roles: [ROLES.ADMIN, ROLES.OPS] 
    },
    { 
      to: "/finance", 
      label: "Finance", 
      icon: DollarSign, 
      section: "Finance", 
      roles: [ROLES.ADMIN, ROLES.FINANCE] 
    },
    { 
      to: "/growth", 
      label: "Growth", 
      icon: TrendingUp, 
      section: "Finance", 
      roles: [ROLES.ADMIN, ROLES.FINANCE] 
    },
    { 
      to: "/suppliers", 
      label: "Suppliers", 
      icon: Truck, 
      section: "Supply Chain", 
      roles: [ROLES.ADMIN, ROLES.OPS] 
    },
    { 
      to: "/providers", 
      label: "Service Providers", 
      icon: Users, 
      section: "Service Providers", 
      roles: [ROLES.ADMIN, ROLES.OPS] 
    },
    { 
      to: "/provider-cycle", 
      label: "Provider Cycle", 
      icon: RefreshCw, 
      section: "Service Providers", 
      roles: [ROLES.ADMIN, ROLES.OPS] 
    },
    { 
      to: "/email-intake", 
      label: "Email Intake", 
      icon: Mail, 
      section: "Intake", 
      roles: [ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE] 
    },
    { 
      to: "/admin/users", 
      label: "Users", 
      icon: Users2, 
      section: "Admin", 
      roles: [ROLES.ADMIN] 
    },
    { 
      to: "/admin/test-data", 
      label: "Test Data", 
      icon: FlaskConical, 
      section: "Admin", 
      roles: [ROLES.ADMIN] 
    },
    { 
      to: "/settings/marketplaces", 
      label: "Settings", 
      icon: Settings, 
      section: "Admin", 
      roles: [ROLES.ADMIN] 
    }
  ];

  // Filter by role
  return allItems.filter(item => {
    if (!item.roles) return true; // Accessible by all if no roles defined
    return item.roles.includes(role);
  });
}