export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export const PLAYER_COLORS: Record<PlayerColor, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
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

export const START_POSITIONS: Record<PlayerColor, number> = {
    red: p(1, 6),
    green: p(8, 1),
    yellow: p(6, 13),
    blue: p(13, 8),
};

// Main path around the board
const MAIN_PATH = [
    // Top row
    p(6,1), p(6,2), p(6,3), p(6,4), p(6,5),
    p(5,6), p(4,6), p(3,6), p(2,6), p(1,6), p(0,6),
    p(0,7),
    // Left side
    p(0,8), p(1,8), p(2,8), p(3,8), p(4,8), p(5,8),
    p(6,9), p(6,10), p(6,11), p(6,12), p(6,13), p(6,14),
    p(7,14),
    // Bottom row
    p(8,14), p(8,13), p(8,12), p(8,11), p(8,10), p(8,9),
    p(9,8), p(10,8), p(11,8), p(12,8), p(13,8), p(14,8),
    p(14,7),
    // Right side
    p(14,6), p(13,6), p(12,6), p(11,6), p(10,6), p(9,6),
    p(8,5), p(8,4), p(8,3), p(8,2), p(8,1), p(8,0),
    p(7,0),
    p(6,0) // back to start area
];


const homeRuns: Record<PlayerColor, number[]> = {
    red:    [p(1,7), p(2,7), p(3,7), p(4,7), p(5,7), p(6,7)],
    green:  [p(7,1), p(7,2), p(7,3), p(7,4), p(7,5), p(7,6)],
    blue:   [p(13,7), p(12,7), p(11,7), p(10,7), p(9,7), p(8,7)],
    yellow: [p(7,13), p(7,12), p(7,11), p(7,10), p(7,9), p(7,8)],
}

const generatePath = (startPosition: PlayerColor) => {
    const startIndex = MAIN_PATH.indexOf(START_POSITIONS[startPosition]);
    // The path starts *after* the start position.
    const rotatedPath = [...MAIN_PATH.slice(startIndex + 1), ...MAIN_PATH.slice(0, startIndex + 1)];
    // The 51st step is the one before entering the home run
    const finalPath = [...rotatedPath.slice(0, 51), ...homeRuns[startPosition]];
    // Add the final home square
    finalPath.push(p(7,7));
    return finalPath;
}

export const PATHS: Record<PlayerColor, number[]> = {
    red: generatePath('red'),
    green: generatePath('green'),
    yellow: generatePath('yellow'),
    blue: generatePath('blue'),
};


export const HOME_ENTRANCES: Record<PlayerColor, number> = {
    red: p(5, 7),
    green: p(7, 5),
    yellow: p(7, 9),
    blue: p(9, 7),
};

export const SAFE_ZONES = [
    START_POSITIONS.red, 
    START_POSITIONS.green,
    START_POSITIONS.yellow, 
    START_POSITIONS.blue,
    p(2, 8),
    p(6, 2), 
    p(12, 6),
    p(8, 12)
];
