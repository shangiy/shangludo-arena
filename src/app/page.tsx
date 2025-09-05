import Link from 'next/link';
import { Mail, Phone, Users, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/Logo';
import { FindFriendForm } from '@/components/ludo/FindFriendForm';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo className="h-8 w-8" />
            <span className="text-lg">ShangLudo Arena</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="container text-center py-16 md:py-24">
          <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            The Ultimate Online Ludo
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
            Join the arena, challenge your friends, and become a Ludo champion. Multiple game modes, endless fun.
          </p>
        </section>

        <section id="play" className="container pb-16 md:pb-24">
          <h2 className="text-center font-headline text-3xl font-bold mb-8">Choose Your Game</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">Classic Ludo</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  The traditional Ludo experience. Strategy is key. Perfect for purists and those who love a longer, more tactical game.
                </CardDescription>
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/game?mode=classic">Play Classic</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Zap className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="font-headline">Quick Play</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  A faster-paced version for when you're short on time. Get straight into the action and race to the finish!
                </CardDescription>
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/game?mode=quick">Play Quick</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container pb-16 md:pb-24">
           <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-4">
                   <div className="bg-primary/10 p-3 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  <CardTitle>Find a Friend's Game</CardTitle>
                </div>
                <CardDescription>Enter your friend's email to find and join their game room.</CardDescription>
              </CardHeader>
              <CardContent>
                <FindFriendForm />
              </CardContent>
            </Card>
        </section>

      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-center gap-4 py-8 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo className="h-6 w-6" />
            <p className="text-center text-sm leading-loose md:text-left">
              Built for ShangLudo.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href="mailto:mushangip0@gmail.com" className="hover:text-primary">mushangip0@gmail.com</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>0727607824</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
