import { Suspense } from 'react';
import GameClient from '@/components/ludo/GameClient';

function GamePageContent() {
  return <GameClient />;
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading Game...</div>}>
      <GamePageContent />
    </Suspense>
  );
}
