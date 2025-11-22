import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="ShangLudo Arena Logo"
      width={32}
      height={32}
      className={cn("h-8 w-8", className)}
      {...props}
    />
  );
}
