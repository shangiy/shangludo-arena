
'use server';

/**
 * @fileOverview Implements the AI opponent for the Ludo game.
 *
 * - generateAIMove - A function that determines the AI opponent's move.
 * - GenerateAIMoveInput - The input type for the generateAIMove function.
 * - GenerateAIMoveOutput - The return type for the generateAIMove function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAIMoveInputSchema = z.object({
  boardState: z.string().describe('The current state of the Ludo board.'),
  currentPlayer: z.string().describe('The player who is currently making a move (AI).'),
  diceRoll: z.number().describe('The result of the dice roll.'),
});
export type GenerateAIMoveInput = z.infer<typeof GenerateAIMoveInputSchema>;

const GenerateAIMoveOutputSchema = z.object({
  move: z.string().describe('The AI opponent’s determined move based on the board state and dice roll. MUST be in the format "pawn:[pawnId],from:[currentPosition],to:[newPosition]".'),
  reasoning: z.string().describe('The AI’s reasoning for making the move.'),
});
export type GenerateAIMoveOutput = z.infer<typeof GenerateAIMoveOutputSchema>;

export async function generateAIMove(input: GenerateAIMoveInput): Promise<GenerateAIMoveOutput> {
  return generateAIMoveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAIMovePrompt',
  input: {schema: GenerateAIMoveInputSchema},
  output: {schema: GenerateAIMoveOutputSchema},
  prompt: `You are an expert Ludo player with a strategic mindset. Your goal is to win the game quickly while being cautious to minimize risks. Given the current board state, the current player, and the dice roll, you must decide on the optimal move for the AI player.

Board State:
{{boardState}}

Current Player:
{{currentPlayer}}

Dice Roll:
{{diceRoll}}

Analyze the board and determine the best possible move. Follow this strategic priority list:
1.  **Win the Game:** If a move can bring one of your pawns home, prioritize it.
2.  **Capture Opponent:** If you can land on a single opponent's pawn to send it back to their yard, this is a high-priority move. This sets them back significantly.
3.  **Move to Safety:** Move pawns onto safe zones (starred spaces) to protect them from being captured.
4.  **Advance Pawns:** Move your pawns forward along the track, prioritizing those that are furthest ahead.
5.  **Bring Pawns Out:** If you roll a 6, and have pawns in your starting yard, bringing a new pawn into play is often a good strategic choice.
6.  **Avoid Risk:** Be cautious. Avoid leaving a single pawn on a space where it is highly likely to be captured by an opponent on their next turn.

Your output for the move is extremely important. It MUST be ONLY in the following format: "pawn:[pawnId],from:[currentPosition],to:[newPosition]".

For example, a valid move output is: "pawn:2,from:15,to:21"

Do NOT include any other text, explanation, or formatting in the 'move' field of your response.
If there are no valid moves, you must return "pawn:null,from:null,to:null" in the 'move' field.
Provide your reasoning for the move in the 'reasoning' field based on the strategic priorities. If there are no valid moves, you must state that in the reasoning.
`,
});

const generateAIMoveFlow = ai.defineFlow(
  {
    name: 'generateAIMoveFlow',
    inputSchema: GenerateAIMoveInputSchema,
    outputSchema: GenerateAIMoveOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
