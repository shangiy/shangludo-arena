import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const GameClient = dynamic(() => import('@/components/ludo/GameClient'), { ssr: false });

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
