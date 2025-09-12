import { cn } from "@/lib/utils";
import { PlayerColor } from "@/lib/ludo-constants";
import type { SVGProps } from "react";

export function StarIcon({ color = 'gray', ...props }: SVGProps<SVGSVGElement> & { color?: PlayerColor | 'gray' | 'white' }) {
    const STAR_COLORS: Record<PlayerColor | 'gray' | 'white', string> = {
        red: 'fill-red-500',
        green: 'fill-green-500',
        yellow: 'fill-yellow-400',
        blue: 'fill-blue-500',
        gray: 'fill-gray-400',
        white: 'fill-white'
    }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      
      className={cn("h-full w-full stroke-black/80 stroke-[1] p-0.5", STAR_COLORS[color])}
      {...props}
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  );
}
