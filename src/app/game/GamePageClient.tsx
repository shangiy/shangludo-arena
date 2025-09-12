"use client";

import dynamic from 'next/dynamic';

const GameClient = dynamic(() => import('@/components/ludo/GameClient'), { 
  ssr: false,
  loading: () => <div className="flex h-screen w-full items-center justify-center">Loading Game...</div>
});

export default function GamePageClient() {
  return <GameClient />;
}
