'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatMessage } from '@/lib/ludo-constants';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';

export function ChatPanel({ messages, onSendMessage }: { messages: ChatMessage[], onSendMessage: (text: string) => void }) {
  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <Card className="flex flex-col h-full lg:h-auto lg:flex-1 shadow-none border-0">
      <CardContent className="flex-1 flex flex-col gap-4 p-0 pt-4">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex items-start gap-3", msg.sender === 'You' ? "justify-end" : "justify-start")}>
                 {msg.sender !== 'You' && (
                    <Avatar className="h-8 w-8">
                       <AvatarFallback className={cn(msg.color ? `bg-${msg.color}-500 text-white` : 'bg-muted')}>
                         {msg.sender.charAt(0)}
                       </AvatarFallback>
                    </Avatar>
                 )}
                <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm", 
                    msg.sender === 'System' ? 'bg-yellow-100 text-yellow-900 w-full text-center' 
                    : msg.sender === 'You' ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted')}>
                  <p className="font-semibold">{msg.sender !== 'System' && msg.sender}</p>
                  <p>{msg.text}</p>
                </div>
                 {msg.sender === 'You' && (
                    <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-blue-500 text-white">
                         Y
                       </AvatarFallback>
                    </Avatar>
                 )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2 p-4 border-t">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

    