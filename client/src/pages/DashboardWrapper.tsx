import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@shared/i18n";
import { Route, Switch } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Users, Settings as SettingsIcon, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import Dashboard from "./Dashboard";
import Contracts from "./Contracts";
import Counterparties from "./Counterparties";
import Settings from "./Settings";
import CreateContract from "./CreateContract";
import AdminPanel from "./AdminPanel";

export default function DashboardWrapper() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigationItems = [
    {
      label: t("dashboard", language),
      href: "/dashboard",
      icon: FileText,
    },
    {
      label: t("contracts", language),
      href: "/dashboard/contracts",
      icon: FileText,
    },
    {
      label: t("counterpartiesCount", language),
      href: "/dashboard/counterparties",
      icon: Users,
    },
    {
      label: t("settings", language),
      href: "/dashboard/settings",
      icon: SettingsIcon,
    },
    ...(user?.role === "admin"
      ? [
          {
            label: language === "uz" ? "Admin" : "Администратор",
            href: "/dashboard/admin",
            icon: SettingsIcon,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gray-900 text-white transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-lg font-bold">Shartnoma</h2>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-800 rounded"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors group"
              >
                <Icon className="w-5 h-5" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </a>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage("uz")}
              className={`flex-1 px-2 py-2 rounded text-xs font-medium transition-colors ${
                language === "uz"
                  ? "bg-indigo-600"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              O'z
            </button>
            <button
              onClick={() => setLanguage("ru")}
              className={`flex-1 px-2 py-2 rounded text-xs font-medium transition-colors ${
                language === "ru"
                  ? "bg-indigo-600"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              Ру
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-gray-200 border-gray-700 hover:bg-gray-800"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {sidebarOpen && t("logout", language)}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === "uz"
                ? "Shartnoma UZ Pro"
                : "Shartnoma UZ Pro"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          <Switch>
            <Route path="/contracts/new" component={CreateContract} />
            <Route path="/contracts/:rest*" component={Contracts} />
            <Route path="/counterparties/:rest*" component={Counterparties} />
            <Route path="/settings/:rest*" component={Settings} />
            {user?.role === "admin" && (
              <Route path="/admin/:rest*" component={AdminPanel} />
            )}
            <Route path="/" component={Dashboard} />
          </Switch>
        </div>
      </main>
    </div>
  );
}
