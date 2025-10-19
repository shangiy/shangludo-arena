
'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const GameClient = dynamic(
  () => import('@/components/ludo/GameClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Preparing the Arena...</p>
      </div>
    ),
  }
);

export default function GamePage() {
  return <GameClient />;
}
