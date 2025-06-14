import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Mail, 
  BarChart3, 
  Send, 
  Users, 
  ChartScatter, 
  Code, 
  Settings,
  LogOut,
  Shield,
  List,
  Image
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Campaigns", href: "/campaigns", icon: Send },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Lists", href: "/lists", icon: List },
  { name: "Images", href: "/images", icon: Image },
  { name: "Analytics", href: "/analytics", icon: ChartScatter },
  { name: "API Tokens", href: "/api-tokens", icon: Code },
];

const adminNavigation = [
  { name: "Admin Dashboard", href: "/admin", icon: Shield },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">ReMailer</h1>
            <p className="text-xs text-slate-500">v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            return (
              <li key={item.name}>
                <Link href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin Navigation */}
        {user?.role === 'admin' && (
          <div className="mt-6">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Administration
            </div>
            <ul className="mt-2 space-y-2">
              {adminNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <span className="text-slate-600 text-sm font-medium">
              {user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
          <button 
            onClick={logout}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
