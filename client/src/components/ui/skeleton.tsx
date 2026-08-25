import * as React from "react";
import { cn } from "../../lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse border-2 border-black bg-neutral-300 shadow-[3px_3px_0px_0px_#000]", className)}
      {...props}
    />
  );
}