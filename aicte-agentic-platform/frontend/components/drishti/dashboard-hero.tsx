"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, FilePlus2 } from "lucide-react";

export function DashboardHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111217] px-8 py-10 shadow-2xl drishti-accent-glow"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-red-800/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3.5 py-1 text-xs font-medium text-red-400 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          Agentic Decision Intelligence
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Welcome to{" "}
          <span className="text-red-400 bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent">
            Drishti AI
          </span>
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-7 text-gray-400">
          Intelligent institutional verification,
          evidence-based document analysis, and
          human-controlled regulatory decision support.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/upload"
            className="drishti-button inline-flex items-center gap-2"
          >
            <FilePlus2 size={17} />
            New Application
          </Link>

          <Link
            href="/applications"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-white/5 hover:text-white"
          >
            View Applications
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
