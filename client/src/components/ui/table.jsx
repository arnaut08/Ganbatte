import * as React from "react";
import { cn } from "../../lib/utils";

export function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-auto border-2 border-black shadow-[4px_4px_0px_0px_#000]">
      <table className={cn("w-full caption-bottom text-sm font-semibold text-black", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("border-b-2 border-black bg-[#FFDE59]", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableFooter({ className, ...props }) {
  return <tfoot className={cn("border-t-2 border-black bg-neutral-100 font-bold", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return <tr className={cn("border-b-2 border-black transition-colors hover:bg-neutral-100", className)} {...props} />;
}

export function TableHead({ className, ...props }) {
  return <th className={cn("h-12 px-4 text-left font-black uppercase text-black align-middle", className)} {...props} />;
}

export function TableCell({ className, ...props }) {
  return <td className={cn("p-4 align-middle font-medium", className)} {...props} />;
}