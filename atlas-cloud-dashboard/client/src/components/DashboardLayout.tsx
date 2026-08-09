import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Network,
  Zap,
  Radio,
  Lock,
  Cpu,
  Settings,
  TestTube,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  section: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: <LayoutDashboard size={18} />,
    section: "monitoring",
  },
  {
    label: "VRRP",
    href: "/vrrp",
    icon: <Zap size={18} />,
    section: "monitoring",
  },
  {
    label: "SD-WAN",
    href: "/sdwan",
    icon: <Network size={18} />,
    section: "monitoring",
  },
  {
    label: "BGP",
    href: "/bgp",
    icon: <Radio size={18} />,
    section: "monitoring",
  },
  {
    label: "IPsec",
    href: "/ipsec",
    icon: <Lock size={18} />,
    section: "monitoring",
  },
  {
    label: "FGCP",
    href: "/fgcp",
    icon: <Cpu size={18} />,
    section: "monitoring",
  },
  {
    label: "Architecture",
    href: "/architecture",
    icon: <Network size={18} />,
    section: "architecture",
  },
  {
    label: "Automatisation",
    href: "/automation",
    icon: <Settings size={18} />,
    section: "automation",
  },
  {
    label: "Test Connectivité",
    href: "/connectivity-test",
    icon: <TestTube size={18} />,
    section: "automation",
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col overflow-y-auto`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-sidebar-primary rounded-sm flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
                ACS
              </div>
              {sidebarOpen && (
                <span className="text-xs font-semibold text-sidebar-foreground whitespace-nowrap">
                  ATLAS CLOUD
                </span>
              )}
            </a>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-muted"
                }`}
              >
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
              </a>
            </Link>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full"
          >
            {sidebarOpen ? (
              <X size={16} />
            ) : (
              <Menu size={16} />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Atlas Cloud Services
            </h1>
            <p className="text-sm text-muted-foreground">
              SD-WAN over BGP — Datacenter Benguerir/Backup
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                Système Opérationnel
              </p>
              <p className="text-xs text-muted-foreground">
                Tous les équipements actifs
              </p>
            </div>
            <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
