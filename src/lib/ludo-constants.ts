export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export const PLAYER_COLORS: Record<PlayerColor, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
};

export interface Pawn {
    id: number;
    color: PlayerColor;
    position: number; // -1 for yard, 0-51 for main path, 52-56 for home path
    isHome: boolean;
}

export interface ChatMessage {
    sender: string;
    text: string;
    color?: PlayerColor;
}

// Using a 15x15 grid, where position is y * 15 + x
const p = (x: number, y: number) => y * 15 + x;

export const HOME_YARDS: Record<PlayerColor, { x: number; y: number }[]> = {
    blue: [p(1, 1), p(4, 1), p(1, 4), p(4, 4)],
    yellow: [p(10, 1), p(13, 1), p(10, 4), p(13, 4)],
    green: [p(10, 10), p(13, 10), p(10, 13), p(13, 13)],
    red: [p(1, 10), p(4, 10), p(1, 13), p(4, 13)],
};

const bluePath = [
    p(6, 1), p(6, 2), p(6, 3), p(6, 4), p(6, 5),
    p(5, 6), p(4, 6), p(3, 6), p(2, 6), p(1, 6), p(0, 6),
    p(0, 7),
    p(1, 8), p(2, 8), p(3, 8), p(4, 8), p(5, 8), p(6, 8),
    p(7, 9), p(7, 10), p(7, 11), p(7, 12), p(7, 13), p(7, 14),
    p(8, 14),
    p(8, 13), p(8, 12), p(8, 11), p(8, 10), p(8, 9), p(8, 8),
    p(9, 7), p(10, 7), p(11, 7), p(12, 7), p(13, 7), p(14, 7),
    p(14, 6),
    p(13, 5), p(12, 5), p(11, 5), p(10, 5), p(9, 5), p(8, 5),
    p(7, 4), p(7, 3), p(7, 2), p(7, 1), p(7, 0),
    p(6, 0), // Last main path square before home
    p(7, 1), p(7, 2), p(7, 3), p(7, 4), p(7, 5), p(7, 6) // Home run
];


const generatePath = (startOffset: number, homeRun: number[]) => {
    const path = [];
    for (let i = 0; i < 52; i++) {
        path.push(bluePath[(i + startOffset) % 52]);
    }
    return [...path, ...homeRun];
}

export const PATHS: Record<PlayerColor, number[]> = {
    blue: generatePath(0, [p(7, 1), p(7, 2), p(7, 3), p(7, 4), p(7, 5), p(7, 6)]),
    red: generatePath(13, [p(1, 7), p(2, 7), p(3, 7), p(4, 7), p(5, 7), p(6, 7)]),
    green: generatePath(26, [p(8, 13), p(8, 12), p(8, 11), p(8, 10), p(8, 9), p(8, 8)]),
    yellow: generatePath(39, [p(13, 8), p(12, 8), p(11, 8), p(10, 8), p(9, 8), p(8, 8)]),
};

export const START_POSITIONS: Record<PlayerColor, number> = {
    blue: p(6,1),
    red: p(1,8),
    green: p(8,13),
    yellow: p(13,6),
};

export const HOME_ENTRANCES: Record<PlayerColor, number> = {
    blue: p(6,0),
    red: p(0,7),
    green: p(8,14),
    yellow: p(14,7),
};

export const SAFE_ZONES = [p(6,1), p(1,8), p(8,13), p(13,6), p(6,5), p(5,8), p(8,9), p(9,6)];

