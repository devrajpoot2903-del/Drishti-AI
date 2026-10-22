"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Cpu,
  UserCheck,
  History,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Applications",
    href: "/applications",
    icon: FileText,
  },
  {
    title: "Upload Documents",
    href: "/upload",
    icon: UploadCloud,
  },
  {
    title: "AI Processing",
    href: "/agents",
    icon: Cpu,
  },
  {
    title: "Human Review",
    href: "/review",
    icon: UserCheck,
  },
  {
    title: "Audit & Reports",
    href: "/audit",
    icon: History,
  },
];

export function Sidebar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { user, switchAccount } = useAuth();

  return (
    <aside
      className={`w-60 flex flex-col shrink-0 bg-[#090a0e] text-slate-300 border-r border-white/10 select-none ${className}`}
      style={{ height: "100vh" }}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-white/10 flex items-center gap-3 bg-[#0c0d12]">
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-500/25">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm tracking-tight text-white truncate flex items-center gap-1.5">
            Drishti AI
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              V2
            </span>
          </span>
          <span className="text-[11px] text-gray-400 truncate">
            Decision Intelligence
          </span>
        </div>
      </div>

      {/* Navigation Items (Exactly 6 items) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname === "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-red-500/10 text-white font-semibold border-l-2 border-red-500 shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-red-400" : "text-gray-400"
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Authenticated User Session & Role Switcher */}
      <div className="p-3 border-t border-white/10 bg-[#0c0d12]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/10">
            <div className="w-7 h-7 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 font-semibold text-xs flex items-center justify-center shrink-0">
              {user ? user.name.slice(0, 2).toUpperCase() : "--"}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-white truncate">
                {user ? user.name : "Unauthenticated"}
              </span>
              <span className="text-[10px] text-gray-400 truncate">
                {user?.role === "SCRUTINY_OFFICER"
                  ? "Scrutiny Officer (Authorized)"
                  : user?.role === "INSTITUTION"
                  ? "Technical Institution"
                  : user?.role === "ADMIN"
                  ? "System Administrator"
                  : "Please select account to log in"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-gray-400">
            <span>{user ? "Switch:" : "Log In:"}</span>
            <select
              value={user?.role || ""}
              onChange={(e) => {
                if (e.target.value) switchAccount(e.target.value as "SCRUTINY_OFFICER" | "INSTITUTION" | "ADMIN");
              }}
              className="bg-[#14151c] text-gray-200 text-[11px] border border-white/10 rounded px-1.5 py-0.5 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {!user && <option value="" disabled>Select Account</option>}
              <option value="SCRUTINY_OFFICER">Scrutiny Officer (Demo)</option>
              <option value="INSTITUTION">Institution (Demo)</option>
              <option value="ADMIN">Administrator (Demo)</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}
