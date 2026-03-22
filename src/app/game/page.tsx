
'use client';

import dynamic from 'next/dynamic';
import { Loader2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const GameLoadingFallback = () => {
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTroubleshoot(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background text-foreground p-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xl font-bold">Preparing the Arena...</p>
        <p className="text-muted-foreground max-w-md">
          We're setting up the board. This might take a moment on some devices.
        </p>
      </div>

      {showTroubleshoot && (
        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 rounded-lg bg-muted border text-sm max-w-sm">
            <p className="font-semibold mb-2">Taking longer than expected?</p>
            <p className="text-muted-foreground">
              Some TV browsers might struggle with the initial load. Try refreshing the page or clearing your cache.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Game
          </Button>
        </div>
      )}
    </div>
  );
};

const GameClient = dynamic(
  () => import('@/components/ludo/GameClient'),
  {
    ssr: false,
    loading: GameLoadingFallback,
  }
);

export default function GamePage() {
  return <GameClient />;
}
