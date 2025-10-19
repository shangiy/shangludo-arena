
"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const GameClient = dynamic(() => import('@/components/ludo/GameClient'), { 
  ssr: false,
  loading: () => <div className="flex h-screen w-full items-center justify-center">Loading Game...</div>
});

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading Game...</div>}>
      <GameClient />
    </Suspense>
  );
}
