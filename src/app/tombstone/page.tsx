
'use client';

import Link from 'next/link';
import { GameBoard } from '@/components/ludo/GameBoard';
import { Button } from '@/components/ui/button';

export default function TombstonePage() {
  // Mock data for GameBoard to render
  const mockScores = { red: 0, green: 0, yellow: 0, blue: 0 };
  const mockGlassWalls = { red: false, green: false, blue: false, yellow: false };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background overflow-hidden">
      <div className="absolute inset-0 blur-sm scale-105">
        <GameBoard
          showSecondarySafes={false}
          scores={mockScores}
          gameMode="classic"
          glassWalls={mockGlassWalls}
        >
          {/* No pawns or children needed for the background */}
        </GameBoard>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center bg-background/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl">
        <h1 className="text-6xl font-extrabold text-slate-800 drop-shadow-md">
          Coming Soon
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          The Tombstone mode is under construction. Get ready for a high-stakes battle!
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Back to Lobby</Link>
        </Button>
      </div>
    </div>
  );
}
