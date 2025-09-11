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

export const START_POSITIONS: Record<PlayerColor, number> = {
    red: p(1, 6),
    green: p(8, 2),
    yellow: p(13, 8),
    blue: p(6, 13),
};

// Main path around the board (clockwise)
const MAIN_PATH = [
    // Red to Green
    p(1, 6), p(2, 6), p(3, 6), p(4, 6), p(5, 6),
    p(6, 5), p(6, 4), p(6, 3), p(6, 2), p(6, 1), p(6,0),
    p(7, 0), // turn
    p(8, 0), p(8, 1), p(8, 2), p(8, 3), p(8, 4), p(8, 5),
    p(9, 6), p(10, 6), p(11, 6), p(12, 6), p(13, 6), p(14, 6),
    p(14, 7), // turn
    p(14, 8), p(13, 8), p(12, 8), p(11, 8), p(10, 8), p(9, 8),
    p(8, 9), p(8, 10), p(8, 11), p(8, 12), p(8, 13), p(8,14),
    p(7, 14), // turn
    p(6, 14), p(6, 13), p(6, 12), p(6, 11), p(6, 10), p(6, 9),
    p(5, 8), p(4, 8), p(3, 8), p(2, 8), p(1, 8), p(0, 8),
    p(0, 7), // turn
];

const homeRuns: Record<PlayerColor, number[]> = {
    red:    [p(1,7), p(2,7), p(3,7), p(4,7), p(5,7), p(6,7)],
    green:  [p(7,1), p(7,2), p(7,3), p(7,4), p(7,5), p(7,6)],
    yellow: [p(13,7), p(12,7), p(11,7), p(10,7), p(9,7), p(8,7)],
    blue:   [p(7,13), p(7,12), p(7,11), p(7,10), p(7,9), p(7,8)],
}

const generatePath = (startPosition: PlayerColor) => {
    const startIndex = MAIN_PATH.indexOf(START_POSITIONS[startPosition]);
    const rotatedPath = [...MAIN_PATH.slice(startIndex), ...MAIN_PATH.slice(0, startIndex)];
    // The path to home is 51 steps, then the home run
    const finalPath = [...rotatedPath.slice(0, 51), ...homeRuns[startPosition]];
    return finalPath;
}

export const PATHS: Record<PlayerColor, number[]> = {
    red: generatePath('red'),
    green: generatePath('green'),
    yellow: generatePath('yellow'),
    blue: generatePath('blue'),
};


export const HOME_ENTRANCES: Record<PlayerColor, number> = {
    red: p(0, 7),
    green: p(7, 0),
    yellow: p(14, 7),
    blue: p(7, 14),
};

export const SECONDARY_YELLOW_SAFE_ZONE = p(8, 1);
export const SECONDARY_RED_SAFE_ZONE = p(6, 2);
export const SECONDARY_BLUE_SAFE_ZONE = p(12, 7);
export const SECONDARY_GREEN_SAFE_ZONE = p(12, 6);

export const SAFE_ZONES = [
    START_POSITIONS.red, 
    START_POSITIONS.green,
    START_POSITIONS.yellow, 
    START_POSITIONS.blue, 
];
