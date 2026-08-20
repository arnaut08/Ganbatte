import * as React from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn("border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_#000]", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-xl font-black uppercase tracking-tight text-black", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm font-semibold text-neutral-700", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("pt-0 font-medium text-black", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center pt-4", className)} {...props} />;
}