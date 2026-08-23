import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#000] file:border-0 file:bg-transparent file:text-sm file:font-bold placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";