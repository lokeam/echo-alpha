import React from 'react';

import { cn } from '@/lib/utils';

export const PageContainer = <T extends React.ElementType = "div">({
  children,
  className,
  as,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  as?: T;
} & React.ComponentPropsWithoutRef<'div'>) => {
  const Component = as || 'div';
  return (
    <Component
      className={cn("max-w-7xl mx-auto", className)}
      {...props}
    >
      {children}
    </Component>
  );
};