import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cn } from "../../lib/utils";

export const Toggle = React.forwardRef(({ className, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center border-2 border-black bg-white px-3 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-100 focus:outline-none data-[state=on]:bg-[#A3E636] data-[state=on]:translate-x-[2px] data-[state=on]:translate-y-[2px] data-[state=on]:shadow-none",
      className
    )}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;