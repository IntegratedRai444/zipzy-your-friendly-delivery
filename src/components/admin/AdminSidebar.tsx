import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShieldCheck, 
  Wallet,
  ClipboardList,
  ArrowLeft,
  Ticket
} from 'lucide-react';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/deliveries', icon: Package, label: 'Deliveries' },
  { href: '/admin/verifications', icon: ShieldCheck, label: 'Verifications' },
  { href: '/admin/transactions', icon: Wallet, label: 'Transactions' },
  { href: '/admin/promos', icon: Ticket, label: 'Promo Codes' },
  { href: '/admin/actions', icon: ClipboardList, label: 'Admin Logs' },
];

export const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-display font-bold text-primary">Admin Panel</h1>
        <p className="text-xs text-muted-foreground">Manage your platform</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/admin' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        to="/dashboard"
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to App
      </Link>
    </aside>
  );
};
