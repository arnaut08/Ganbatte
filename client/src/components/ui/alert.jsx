import * as React from "react";
import { cn } from "../../lib/utils";

export function Alert({ className, variant = "default", children, ...props }) {
  const variants = {
    default: "bg-[#FFDE59]",
    danger: "bg-[#FF6B6B]",
    success: "bg-[#A3E636]",
    info: "bg-[#70CFF8]",
  };

  return (
    <div
      role="alert"
      className={cn(
        "border-2 border-black p-4 font-semibold text-black shadow-[4px_4px_0px_0px_#000]",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className, ...props }) {
  return <h5 className={cn("mb-1 font-black uppercase tracking-tight text-black", className)} {...props} />;
}

export function AlertDescription({ className, ...props }) {
  return <div className={cn("text-sm font-medium text-black", className)} {...props} />;
}