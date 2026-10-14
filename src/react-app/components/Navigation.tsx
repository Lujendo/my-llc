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
} from "lucide-react";
import type { Entity } from "../types";

interface NavigationProps {
  user: any;
  currentView: string;
  onNavigate: (view: string) => void;
  entities: Entity[];
  activeEntity: Entity | null;
  onEntityChange: (entity: Entity) => void;
  onLogout: () => void;
  onShowEntityManager: () => void;
  onShowSettings: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  user,
  currentView,
  onNavigate,
  entities,
  activeEntity,
  onEntityChange,
  onLogout,
  onShowEntityManager,
  onShowSettings,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "checklist", label: "Checklist", icon: ListChecks },
    { id: "timeline", label: "Timeline", icon: Calendar },
    { id: "hub", label: "Holdings", icon: Network },
    { id: "treaty", label: "Treaty", icon: Globe },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">MY-LLC</span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:inline">
              LLC FILINGS
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Entity Selector & User Menu */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Entity Dropdown */}
            {entities.length > 0 && (
              <select
                value={activeEntity?.id || ""}
                onChange={(e) => {
                  const entity = entities.find((ent) => ent.id === e.target.value);
                  if (entity) onEntityChange(entity);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hidden sm:block"
              >
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* User Menu Button */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                  {user?.name?.split(" ")[0]}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      onShowEntityManager();
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Building2 className="w-4 h-4" />
                    Entities
                  </button>

                  <button
                    onClick={() => {
                      onShowSettings();
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/5"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
