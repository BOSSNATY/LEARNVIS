import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  Shield,
} from "lucide-react";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "User Management", path: "/admin/users" },
    { icon: BookOpen, label: "Subjects", path: "/admin/subjects" },
    { icon: FileText, label: "Topics", path: "/admin/topics" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#080b14] text-white flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-gradient-to-b from-[#0f172a] to-[#0d1117] border-r border-white/5 transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Shield size={20} className="text-white" />
              </div>
              {isSidebarOpen && (
                <div>
                  <span className="text-lg font-bold text-white">LEARNVIS</span>
                  <span className="block text-[10px] text-purple-400 uppercase tracking-wider">
                    Admin Panel
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              {isSidebarOpen ? (
                <ChevronLeft size={18} className="text-gray-400" />
              ) : (
                <ChevronRight size={18} className="text-gray-400" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Admin Badge */}
          {isSidebarOpen && (
            <div className="px-4 py-3 mx-3 mt-4 bg-purple-600/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-purple-400" />
                <span className="text-sm text-purple-300">Administrator</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path)
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={20} />
                {isSidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/5">
            <div
              className={`flex items-center gap-3 ${isSidebarOpen ? "p-3 bg-white/5 rounded-xl" : "justify-center"}`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-sm">
                A
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Admin User</p>
                  <p className="text-xs text-gray-500 truncate">
                    admin@learnvis.com
                  </p>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button
                onClick={() => navigate("/")}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <LogOut size={18} />
                <span className="text-sm">Logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Menu size={20} className="text-gray-400" />
              </button>
              <div className="hidden md:flex items-center gap-3 bg-[#1f2937]/40 border border-white/5 rounded-xl px-4 py-2.5 w-80">
                <Search size={18} className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users, subjects..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                <Bell size={20} className="text-gray-400" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-sm lg:hidden">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
