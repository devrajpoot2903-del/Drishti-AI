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

import { useAuth } from "@/lib/auth-context";

export function Sidebar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { user, switchAccount } = useAuth();

  return (
    <aside
      className={`w-60 flex flex-col shrink-0 bg-[#0F172A] text-slate-300 border-r border-slate-800 select-none ${className}`}
      style={{ height: "100vh" }}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm tracking-tight text-white truncate">
            AICTE Platform
          </span>
          <span className="text-[11px] text-slate-400 truncate">
            Decision Support
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
              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-slate-800 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-indigo-400" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Authenticated User Session & Role Switcher */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/50">
            <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-semibold text-xs flex items-center justify-center shrink-0">
              {user ? user.name.slice(0, 2).toUpperCase() : "AI"}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-white truncate">
                {user ? user.name : "Scrutiny Officer"}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {user?.role === "SCRUTINY_OFFICER"
                  ? "Scrutiny Officer (Authorized)"
                  : user?.role === "INSTITUTION"
                  ? "Technical Institution"
                  : "System Administrator"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span>Role:</span>
            <select
              value={user?.role || "SCRUTINY_OFFICER"}
              onChange={(e) => switchAccount(e.target.value as any)}
              className="bg-slate-900 text-slate-200 text-[11px] border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
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

