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
  move: z.string().describe('The AI opponent’s determined move based on the board state and dice roll.'),
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
  prompt: `You are an expert Ludo player. Given the current board state, the current player, and the dice roll, you must decide on the best move for the AI player.

Board State:
{{boardState}}

Current Player:
{{currentPlayer}}

Dice Roll:
{{diceRoll}}

Consider all possible moves and their potential outcomes. Provide the move and a brief explanation of your reasoning.

Output the move to make and the reasoning for making that move. If there are no valid moves, output that there are no valid moves.

Make sure to pick a valid move according to standard Ludo rules.

Ensure that the outputted move is in a format that can be easily interpreted by a Ludo game engine. A possible move format would be pawn:[pawnNumber], from:[startingLocation], to:[endingLocation].

Reasoning for the move should be provided as well.
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
