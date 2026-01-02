"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SpinningBorderCardProps {
  children: ReactNode;
  className?: string;
}

export function SpinningBorderCard({ children, className }: SpinningBorderCardProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg p-[2px] shadow-sm", className)}>
      <div className="absolute inset-0 rounded-lg bg-[#FF2727]" />
      <div
        className="absolute inset-0 animate-spin rounded-lg [animation-duration:3s]"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, transparent 35%, black 40%, black 60%, transparent 65%, transparent 100%)"
        }}
      />
      <div
        className="absolute inset-0 animate-spin rounded-lg [animation-duration:3s]"
        style={{
          background: "conic-gradient(from 180deg, transparent 0%, transparent 35%, white 40%, white 60%, transparent 65%, transparent 100%)"
        }}
      />
      <div className="relative z-20 rounded-[6px] bg-white">
        {children}
      </div>
    </div>
  );
}
