import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Music, BookOpen, Presentation, Image, 
  Radio, ChevronRight, Cross
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/songs", label: "Song Library", icon: Music },
  { path: "/scripture", label: "Scripture", icon: BookOpen },
  { path: "/presentations", label: "Presentations", icon: Presentation },
  { path: "/media", label: "Media Library", icon: Image },
];

export default function Layout() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Cross className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-accent-foreground leading-none">WorshipFlow</p>
            <p className="text-xs text-sidebar-foreground mt-0.5">Presentation Studio</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 group ${
                isActive(path)
                  ? "bg-primary/20 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive(path) && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          ))}
        </nav>

        {/* Live Mode Button */}
        <div className="p-3 border-t border-sidebar-border">
          <Link
            to="/live"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all duration-150 animate-pulse-glow"
          >
            <Radio className="w-4 h-4" />
            Go Live
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}