"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function PageEntrance({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
      {children}
    </motion.div>
  );
}
