import React, { useState } from "react";
import {
  LayoutDashboard,
  ListChecks,
  Calendar,
  Globe,
  FileText,
  Menu,
  Building2,
  Network,
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { Entity } from "../types";

// Integration note: App.tsx still renders <Navigation/>. To adopt this sidebar shell,
// in App.tsx swap <Navigation .../> + the <main> wrapper for <AppShell {...navProps}>{views}</AppShell>
// (keep <Footer/> and the modals; AppShell drops the max-w-7xl centering). Left un-wired on purpose.
// Nav ids mirror the target's existing `currentView` values (see Navigation.tsx / App.tsx).
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "checklist", label: "Checklist", icon: ListChecks },
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "hub", label: "Holdings", icon: Network },
  { id: "treaty", label: "Treaty", icon: Globe },
  { id: "documents", label: "Documents", icon: FileText },
] as const;

export interface AppShellProps {
  user: any;
  currentView: string;
  onNavigate: (view: string) => void;
  entities: Entity[];
  activeEntity: Entity | null;
  onEntityChange: (entity: Entity) => void;
  onLogout: () => void;
  onShowEntityManager: () => void;
  onShowSettings: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  currentView,
  onNavigate,
  entities,
  activeEntity,
  onEntityChange,
  onLogout,
  onShowEntityManager,
  onShowSettings,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const nav = (
    <nav className="flex-1 space-y-1 p-2">
      {NAV_ITEMS.map((item) => {
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              setMobileOpen(false);
            }}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t p-2">
      {!collapsed && entities.length > 0 && (
        <select
          value={activeEntity?.id || ""}
          onChange={(e) => {
            const entity = entities.find((ent) => ent.id === e.target.value);
            if (entity) onEntityChange(entity);
          }}
          className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
        >
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
        </select>
      )}
      {!collapsed && (
        <div className="mb-2 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={onLogout}
          title="Sign out"
          className={cn(
            "flex flex-1 items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={() => setIsUserMenuOpen((v) => !v)}
          title="Account"
          className={cn(
            "rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            collapsed && "hidden"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {isUserMenuOpen && !collapsed && (
        <div className="mt-1 space-y-0.5 rounded-md border bg-popover p-1 text-popover-foreground">
          <button
            onClick={() => {
              onShowEntityManager();
              setIsUserMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Building2 className="h-4 w-4" /> Entities
          </button>
          <button
            onClick={() => {
              onShowSettings();
              setIsUserMenuOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-4 w-4" /> Settings
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "relative hidden flex-shrink-0 flex-col border-r bg-muted/30 transition-all duration-300 md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex items-center border-b p-4", collapsed ? "justify-center" : "justify-between")}>
          {collapsed ? (
            <span className="text-lg font-bold text-primary">M</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">MY-LLC</span>
              <span className="text-xs font-semibold text-muted-foreground">FILINGS</span>
            </div>
          )}
        </div>
        {nav}
        {footer}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-20 z-50 rounded-full border bg-background p-1 shadow-md transition-colors hover:bg-muted"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b bg-muted/30 p-3 md:hidden">
          <span className="text-lg font-bold text-primary">MY-LLC</span>
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent"
            aria-label="Open navigation"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r bg-background">
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-xl font-bold text-primary">MY-LLC</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </div>
  );
};
