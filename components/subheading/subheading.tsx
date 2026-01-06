import React from "react";
import { cn } from "@/lib/utils";

export const SubHeading = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) => {
  return (
    <h3
      className={cn(
        "text-center text-2xl font-medium tracking-tight text-gray-400 dark:text-gray-300",
        className,
      )}
    >
      {children}
    </h3>
  );
};
