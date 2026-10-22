"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({
  children,
  className = "",
  delay = 0,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay,
        ease: "easeOut",
      }}
      whileHover={{ y: -2 }}
      className={`drishti-glass ${className}`}
    >
      {children}
    </motion.div>
  );
}
