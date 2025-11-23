
import { cn } from "@/lib/utils";
import { PlayerColor } from "@/lib/ludo-constants";
import type { SVGProps } from "react";

export function PawnIcon({color, ...props}: SVGProps<SVGSVGElement> & {color: PlayerColor}) {
    const PAWN_COLORS: Record<PlayerColor, string> = {
        red: 'fill-red-500',
        green: 'fill-green-500',
        yellow: 'fill-yellow-400',
        blue: 'fill-blue-500',
    }
    return (
        <svg viewBox="0 0 24 24" {...props}>
            <circle cx="12" cy="12" r="11" fill="black" />
            <g className={cn(PAWN_COLORS[color])}>
                <path d="M12 2C9.243 2 7 4.243 7 7c0 2.757 2.243 5 5 5s5-2.243 5-5c0-2.757-2.243-5-5-5z"></path><path d="M12 14c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8z"></path>
            </g>
        </svg>
    )
};
