import { cn } from "@/lib/utils";
import React from "react";

export const PageDivide = ({ className }: { className?: string }) => {
  return <div className={cn("bg-divide h-px w-full", className)} />;
};
