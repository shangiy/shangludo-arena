"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

const FRIEND_EMAIL = "mushangip0@gmail.com";

export function FindFriendForm() {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.toLowerCase() === FRIEND_EMAIL) {
      toast({
        title: "Friend's Game Found!",
        description: "Joining your friend's game room.",
      });
      router.push('/game?mode=classic');
    } else {
      toast({
        variant: "destructive",
        title: "Game Not Found",
        description: "No active game room found for that email. Please check and try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
      <Input
        type="email"
        placeholder="friend@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit">
        <Search className="mr-2 h-4 w-4" />
        Find Game
      </Button>
    </form>
  );
}
