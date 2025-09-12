import { Suspense } from 'react';
import GamePageClient from './GamePageClient';

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading Game...</div>}>
      <GamePageClient />
    </Suspense>
  );
}
