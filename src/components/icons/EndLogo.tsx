import Image from "next/image";
import { cn } from "@/lib/utils";

export function EndLogo({ className, ...props }: { className?: string }) {
  return (
    <Image
      src="/endLogo.png"
      alt="Game Over"
      width={80}
      height={80}
      className={cn("h-20 w-auto", className)}
      {...props}
    />
  );
}
