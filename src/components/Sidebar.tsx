
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  ChartNoAxesCombined,
  Settings,
  CircleHelp,
  ChartColumnIncreasing,
} from "lucide-react";

export type Page =
  | "Overview"
  | "Transactions"
  | "Products"
  | "Customers"
  | "Analytics"
  | "Help & Support"
  | "Settings";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  transactionCount: number;
}

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Transactions", icon: ShoppingCart },
  { label: "Products", icon: Package },
  { label: "Customers", icon: Users },
  { label: "Analytics", icon: ChartNoAxesCombined },
] as const;

export default function Sidebar({
  activePage,
  onNavigate,
  transactionCount,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <ChartColumnIncreasing size={23} />
        </div>
        <div>
          <h2>
            Pulse<span>Analytics</span>
          </h2>
          <p>BUSINESS INTELLIGENCE</p>
        </div>
      </div>

      <div className="nav-label">WORKSPACE</div>

      <nav className="navigation" aria-label="Main navigation">
        {navigation.map(({ label, icon: Icon }) => (
          <button
            className={`nav-item ${
              activePage === label ? "active" : ""
            }`}
            key={label}
            type="button"
            aria-current={activePage === label ? "page" : undefined}
            onClick={() => onNavigate(label)}
          >
            <Icon size={19} />
            <span>{label}</span>

            {label === "Transactions" && (
              <span className="nav-count">{transactionCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-item ${
            activePage === "Help & Support" ? "active" : ""
          }`}
          type="button"
          onClick={() => onNavigate("Help & Support")}
        >
          <CircleHelp size={19} />
          <span>Help &amp; Support</span>
        </button>

        <button
          className={`nav-item ${
            activePage === "Settings" ? "active" : ""
          }`}
          type="button"
          onClick={() => onNavigate("Settings")}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <div className="profile">
          <div className="avatar">CR</div>
          <div className="profile-info">
            <strong>Dashboard Admin</strong>
            <span>Administrator</span>
          </div>
          <span className="profile-menu">···</span>
        </div>
      </div>
    </aside>
  );
}
