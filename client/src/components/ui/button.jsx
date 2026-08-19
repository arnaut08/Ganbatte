import * as React from "react";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#FFDE59] text-black hover:bg-[#ffe373]",
    secondary: "bg-[#A3E636] text-black hover:bg-[#b5eb5b]",
    danger: "bg-[#FF6B6B] text-black hover:bg-[#ff8585]",
    destructive: "bg-[#FF6B6B] text-black hover:bg-[#ff8585]",
    success: "bg-[#A3E636] text-black hover:bg-[#b5eb5b]",
    warning: "bg-[#FFB347] text-black hover:bg-[#ffc966]",
    outline: "bg-white text-black hover:bg-neutral-100",
    neutral: "bg-white text-black hover:bg-neutral-100",
    ghost: "bg-transparent text-black hover:bg-[#FFDE59]/60",
    link: "bg-transparent text-black underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "px-5 py-2.5 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-8 py-3.5 text-base",
    icon: "h-10 w-10 p-0",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-none border-2 border-black font-bold transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";