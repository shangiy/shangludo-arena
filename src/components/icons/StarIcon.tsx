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
      
      className={cn("h-5 w-5 stroke-black/50 stroke-2", STAR_COLORS[color])}
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404.433 2.082-5.007z"
        clipRule="evenodd"
      />
    </svg>
  );
}
