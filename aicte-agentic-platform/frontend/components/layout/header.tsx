"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showNewButton?: boolean;
}

export function Header({
  title = "Overview",
  subtitle = "Regulatory scrutiny & institutional decision support",
  showNewButton = true,
}: HeaderProps) {
  const { user } = useAuth();
  const initials = user ? user.name.slice(0, 2).toUpperCase() : "--";
  const userTitle = user ? `${user.name} (${user.role})` : "Authenticated Session";

  return (
    <header className="h-16 border-b border-white/10 bg-[#0c0d12]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-gray-400">
          {subtitle}
        </p>
      </div>

      {/* Right: Primary Action + User Initials */}
      <div className="flex items-center gap-3">
        {showNewButton && (
          <Link
            href="/upload"
            className="drishti-button text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shadow-md shadow-red-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Application</span>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-xs flex items-center justify-center select-none"
            title={userTitle}
          >
            {initials}
          </div>
          <span className="text-xs text-gray-300 font-medium hidden sm:inline">
            {user ? user.name.split(" ")[0] : "Guest"}
          </span>
        </div>
      </div>
    </header>
  );
}
