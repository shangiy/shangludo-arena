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
    position: number; // -1 for yard, path indices for board
    isHome: boolean;
}

export interface ChatMessage {
    sender: string;
    text: string;
    color?: PlayerColor;
}

// Using a 15x15 grid, where position is y * 15 + x
const p = (x: number, y: number) => y * 15 + x;

export const HOME_YARDS: Record<PlayerColor, number> = {
    blue: p(0,0),
    yellow: p(9,0),
    red: p(0,9),
    green: p(9,9),
};


const bluePathRaw = [
    p(6,1), p(6,2), p(6,3), p(6,4), p(6,5),
    p(5,6), p(4,6), p(3,6), p(2,6), p(1,6), p(0,6),
    p(0,7),
    p(1,8), p(2,8), p(3,8), p(4,8), p(5,8), p(6,8),
    p(6,9), p(6,10), p(6,11), p(6,12), p(6,13), p(6,14),
    p(7,14),
    p(8,13), p(8,12), p(8,11), p(8,10), p(8,9), p(8,8),
    p(9,8), p(10,8), p(11,8), p(12,8), p(13,8), p(14,8),
    p(14,7),
    p(13,6), p(12,6), p(11,6), p(10,6), p(9,6), p(8,6),
    p(8,5), p(8,4), p(8,3), p(8,2), p(8,1), p(8,0),
    p(7,0),
];

const homeRuns: Record<PlayerColor, number[]> = {
    red: [p(1,7), p(2,7), p(3,7), p(4,7), p(5,7), p(6,7)],
    green: [p(8,13), p(8,12), p(8,11), p(8,10), p(8,9)],
    yellow: [p(13,7), p(12,7), p(11,7), p(10,7), p(9,7)],
    blue: [p(7,1), p(7,2), p(7,3), p(7,4), p(7,5)],
}

const generatePath = (startOffset: number, homeColor: PlayerColor) => {
    const path = [];
    for (let i = 0; i < 52; i++) {
        path.push(bluePathRaw[(i + startOffset) % 52]);
    }
    return [...path.slice(0, 51), ...homeRuns[homeColor]];
}

export const PATHS: Record<PlayerColor, number[]> = {
    blue: generatePath(40, 'blue'),
    yellow: generatePath(1, 'yellow'),
    green: generatePath(14, 'green'),
    red: generatePath(27, 'red'),
};

export const START_POSITIONS: Record<PlayerColor, number> = {
    blue: p(8,1),
    red: p(1,6),
    green: p(6,13),
    yellow: p(13,8),
};

export const HOME_ENTRANCES: Record<PlayerColor, number> = {
    blue: p(8,0),
    red: p(0,6),
    green: p(6,14),
    yellow: p(14,8),
};

export const SAFE_ZONES = [
    START_POSITIONS.blue, 
    START_POSITIONS.red, 
    START_POSITIONS.green, 
    START_POSITIONS.yellow,
    p(6,2),
    p(2,8),
    p(8,12),
    p(12,6)
];
