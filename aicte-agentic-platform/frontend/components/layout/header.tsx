"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showNewButton?: boolean;
}

import { useAuth } from "@/lib/auth-context";

export function Header({
  title = "Overview",
  subtitle = "Regulatory scrutiny & institutional decision support",
  showNewButton = true,
}: HeaderProps) {
  const { user } = useAuth();
  const initials = user ? user.name.slice(0, 2).toUpperCase() : "AI";
  const userTitle = user ? `${user.name} (${user.role})` : "Authenticated Session";

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-base font-semibold text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      {/* Right: Primary Action + User Initials */}
      <div className="flex items-center gap-3">
        {showNewButton && (
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Application</span>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center select-none"
            title={userTitle}
          >
            {initials}
          </div>
          <span className="text-xs text-slate-600 font-medium hidden sm:inline">
            {user ? user.name.split(" ")[0] : "Officer"}
          </span>
        </div>
      </div>
    </header>
  );
}

