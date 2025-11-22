import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="ShangLudo Arena Logo"
      width={48}
      height={48}
      className={cn("h-12 w-auto", className)}
      {...props}
    />
  );
}
