
import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function StrongArmIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 21v-3a2.9 2.9 0 0 1 2.5-3h1.8a2.5 2.5 0 0 1 2.3 1.1l1.4 2.4" />
      <path d="M20 21v-3a2.5 2.5 0 0 0-2.2-2.5h-1.6a2.5 2.5 0 0 0-2.3 1.1l-1.4 2.4" />
      <path d="M12.5 8.5a4.5 4.5 0 0 0-7.7-2.8" />
      <path d="m14 3-1 3h3l-1-3" />
      <path d="M15 8a4.5 4.5 0 0 0 4.5 4.5h.5" />
    </svg>
  );
}
