"use client";

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlayerColor } from '@/lib/ludo-constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from 'react';

const playerSchema = z.object({
  color: z.enum(['red', 'green', 'yellow', 'blue']),
  name: z.string().min(1, 'Name is required').max(15, 'Name is too long'),
  type: z.enum(['human', 'ai']),
});

const setupSchema = z.object({
  gameMode: z.enum(['vs-computer', 'multiplayer']),
  players: z.array(playerSchema).min(2, 'At least 2 players required'),
  turnOrder: z.array(z.enum(['red', 'green', 'yellow', 'blue'])),
  humanPlayerColor: z.enum(['red', 'green', 'yellow', 'blue']),
});

export type GameSetup = z.infer<typeof setupSchema>;

const defaultValues: GameSetup = {
  gameMode: 'vs-computer',
  players: [
    { color: 'red', name: 'Red Player', type: 'human' },
    { color: 'green', name: 'Green AI', type: 'ai' },
    { color: 'yellow', name: 'Yellow AI', type: 'ai' },
    { color: 'blue', name: 'Blue AI', type: 'ai' },
  ],
  turnOrder: ['red', 'green', 'yellow', 'blue'],
  humanPlayerColor: 'red',
};

const COLOR_CLASSES: Record<PlayerColor, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-500',
}

export function GameSetupForm({ onSetupComplete }: { onSetupComplete: (setup: GameSetup) => void }) {
  const form = useForm<GameSetup>({
    resolver: zodResolver(setupSchema),
    defaultValues,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "players",
  });

  const gameMode = form.watch('gameMode');
  const players = form.watch('players');
  const humanPlayerColor = form.watch('humanPlayerColor');

  useEffect(() => {
    const newPlayers = form.getValues('players').map(p => {
      const isHuman = (gameMode === 'multiplayer' || p.color === humanPlayerColor);
      return {
        ...p,
        type: isHuman ? 'human' : 'ai',
        name: isHuman ? `${p.color.charAt(0).toUpperCase() + p.color.slice(1)} Player` : `${p.color.charAt(0).toUpperCase() + p.color.slice(1)} AI`,
      };
    });
    form.setValue('players', newPlayers as any, { shouldValidate: true });
  }, [gameMode, humanPlayerColor, form]);

  const onSubmit = (data: GameSetup) => {
    const selectedFirstPlayer = data.turnOrder[0];
    const playerColors = data.players.map(p => p.color);
    const startIndex = playerColors.indexOf(selectedFirstPlayer);
    const newTurnOrder = [...playerColors.slice(startIndex), ...playerColors.slice(0, startIndex)];
    onSetupComplete({ ...data, turnOrder: newTurnOrder as PlayerColor[] });
  };

  return (
    <Card className="w-full max-w-lg shadow-2xl">
      <CardHeader>
        <CardTitle>Game Setup</CardTitle>
        <CardDescription>Configure your Ludo match before you start.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="gameMode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Game Mode</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="vs-computer" />
                        </FormControl>
                        <FormLabel className="font-normal">vs. Computer bot AI</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="multiplayer" />
                        </FormControl>
                        <FormLabel className="font-normal">Multiplayer local challenge</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {gameMode === 'vs-computer' && (
              <FormField
                control={form.control}
                name="humanPlayerColor"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Play as?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map(color => (
                          <FormItem key={color} className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value={color} />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${COLOR_CLASSES[color]}`} />
                              {color.charAt(0).toUpperCase() + color.slice(1)}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="space-y-4">
                <Label>Player Names</Label>
                {fields.map((field, index) => (
                    players[index].type === 'human' && (
                        <FormField
                        key={field.id}
                        control={form.control}
                        name={`players.${index}.name`}
                        render={({ field: nameField }) => (
                            <FormItem>
                               <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${COLOR_CLASSES[field.color]}`}/>
                                <FormControl>
                                    <Input {...nameField} placeholder={`${field.color} player name`} />
                                </FormControl>
                               </div>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    )
                ))}
            </div>

            <FormField
                control={form.control}
                name="turnOrder.0"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Who plays first?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select who starts" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {players.map(p => (
                                    <SelectItem key={p.color} value={p.color}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${COLOR_CLASSES[p.color}`}/>
                                            {p.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            <Button type="submit" className="w-full">Start Game</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}