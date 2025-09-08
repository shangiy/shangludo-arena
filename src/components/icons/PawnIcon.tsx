import { cn } from "@/lib/utils";
import { PlayerColor } from "@/lib/ludo-constants";
import type { SVGProps } from "react";

export function PawnIcon({color, ...props}: SVGProps<SVGSVGElement> & {color: PlayerColor}) {
    const PAWN_COLORS: Record<PlayerColor, string> = {
        red: 'text-red-500',
        green: 'text-green-500',
        yellow: 'text-yellow-400',
        blue: 'text-blue-500',
    }
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cn("h-5 w-5", PAWN_COLORS[color])} {...props}>
            <path d="M12 2C9.243 2 7 4.243 7 7c0 2.757 2.243 5 5 5s5-2.243 5-5c0-2.757-2.243-5-5-5z"></path><path d="M12 14c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8z"></path>
        </svg>
    )
};
