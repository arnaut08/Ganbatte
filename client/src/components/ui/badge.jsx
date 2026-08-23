import * as React from "react";
import { cn } from "../../lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-[#FFDE59]",
    neutral: "bg-white",
    secondary: "bg-[#A3E636]",
    success: "bg-[#A3E636]",
    warning: "bg-[#FFB347]",
    danger: "bg-[#FF6B6B]",
    destructive: "bg-[#FF6B6B]",
    outline: "bg-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}