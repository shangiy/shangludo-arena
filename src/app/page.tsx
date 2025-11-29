
import Link from 'next/link';
import { Mail, Phone, Users, Crown, Zap, QrCode, Timer, Dice5, Dribbble, Linkedin, MapPin, Clock, ArrowUp, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/Logo';
import { FindFriendForm } from '@/components/ludo/FindFriendForm';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { XIcon } from '@/components/icons/XIcon';
import Image from 'next/image';
import { StrongArmIcon } from '@/components/icons/StrongArmIcon';

export default function Home() {
  return (
    <div id="top" className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo />
            <span className="text-lg">ShangLudo Arena</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section id="play" className="container px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 pt-16 md:pt-24 text-center">
          <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            The Shangludo
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
            Join the arena, challenge your friends, and become a Ludo champion. Multiple game modes, endless fun.
          </p>
        </section>

        <section id="play" className="container px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
          <h2 className="text-center font-headline text-3xl font-bold mb-8">Choose A GameMode to Play</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
             <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-400/10 p-3 rounded-full">
                    <Timer className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle className="font-headline">5-Minutes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 justify-between">
                <div>
                  <CardDescription className="mb-4">
                    The quickest mode with a 5-minute timer. Perfect for a short break. Can you win in time?
                  </CardDescription>
                  <div className="flex justify-center gap-4 mb-4">
                    <Dice5 className="h-8 w-8 text-red-500" />
                    <Dice5 className="h-8 w-8 text-green-500" />
                    <Dice5 className="h-8 w-8 text-yellow-400" />
                    <Dice5 className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <Button asChild className={cn("w-full text-white", "gradient-button-blue")}>
                  <Link href="/game?mode=5-min">Play 5-Min</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-400/10 p-3 rounded-full">
                    <Zap className="h-6 w-6 text-yellow-500" />
                  </div>
                  <CardTitle className="font-headline">Quick Play</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  A faster-paced version for when you're short on time. Get straight into the action and race to the finish!
                </CardDescription>
                <Button asChild className={cn("w-full gradient-button-yellow")}>
                  <Link href="/game?mode=quick">Play Quick</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-green-400/10 p-3 rounded-full">
                    <QrCode className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle className="font-headline">Scan QR and Connect</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Play with friends on the same network using different devices via Wi-Fi, hotspot, or Bluetooth.
                </CardDescription>
                <Button asChild className={cn("w-full gradient-button-green-inverse")}>
                  <Link href="/game?mode=local-multiplayer">Connect & Play</Link>
                </Button>
              </CardContent>
            </Card>

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
                  <div className="bg-slate-400/10 p-3 rounded-full">
                    <Skull className="h-6 w-6 text-slate-500" />
                  </div>
                  <CardTitle className="font-headline">Tombstone</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  A high-stakes mode where captured pawns are eliminated permanently. Last player standing wins.
                </CardDescription>
                <Button asChild className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                  <Link href="/tombstone">Play Tombstone</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-purple-400/10 p-3 rounded-full">
                    <Image src="/powerup-logo.png" alt="Power-Up" width={24} height={24} />
                  </div>
                  <CardTitle className="font-headline">Power-Up</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Collect special abilities on the board to gain an advantage. Unleash powers to shield, teleport, or strike!
                </CardDescription>
                <Button asChild className={cn("w-full gradient-button-purple")}>
                  <Link href="/game?mode=powerup">Play Power-Up</Link>
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
      
      <div className="relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="https://mushangis-portfolio.onrender.com/" target="_blank" rel="noopener noreferrer" className="block">
                <div className="bg-[#111827] text-gray-300">
                  <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {/* About Me */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">About Me</h3>
                        <p className="text-sm">
                          A creative and passionate full-stack developer dedicated to building elegant, functional, and user-friendly web experiences. I thrive on turning complex problems into beautiful, intuitive designs.
                        </p>
                        <div className="flex space-x-4">
                          <span className="hover:text-white"><XIcon className="h-5 w-5" /></span>
                          <span className="hover:text-white"><Dribbble className="h-5 w-5" /></span>
                          <span className="hover:text-white"><Linkedin className="h-5 w-5" /></span>
                        </div>
                      </div>

                      {/* Useful Links */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Useful Links</h3>
                        <ul className="space-y-2 text-sm">
                          <li>About</li>
                          <li>Projects</li>
                          <li>Portfolio</li>
                          <li>Blog</li>
                        </ul>
                      </div>

                      {/* Support & Legal */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Support & Legal</h3>
                        <ul className="space-y-2 text-sm">
                          <li>FAQs</li>
                          <li>Privacy Policy</li>
                          <li>Terms of Service</li>
                        </ul>
                      </div>
                      
                      {/* Quick Contact - Combined for smaller screens */}
                      <div className="space-y-4 lg:hidden">
                          <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                          <div className="flex items-start space-x-4">
                              <MapPin className="h-5 w-5 mt-1 text-gray-400" />
                              <div>
                                  <p className="font-semibold">Location</p>
                                  <p className="text-sm">Nairobi, Kenya</p>
                              </div>
                          </div>
                          <div className="flex items-start space-x-4">
                              <Clock className="h-5 w-5 mt-1 text-gray-400" />
                              <div>
                                  <p className="font-semibold">Availability</p>
                                  <p className="text-sm">Mon - Fri: 9.00am - 6.00pm</p>
                                  <p className="text-sm">Available for freelance projects</p>
                              </div>
                          </div>
                          <div className="flex items-start space-x-4">
                              <Phone className="h-5 w-5 mt-1 text-gray-400" />
                              <div>
                                  <p className="font-semibold">Quick Contact</p>
                                  <p className="text-sm">mushangip0@gmail.com</p>
                                  <p className="text-sm">+254 727 607 824</p>
                              </div>
                          </div>
                      </div>

                    </div>

                    <div className="mt-8 border-t border-gray-700 pt-8 hidden lg:grid lg:grid-cols-3 gap-8">
                      <div className="flex items-start space-x-4">
                          <MapPin className="h-5 w-5 mt-1 text-gray-400" />
                          <div>
                              <p className="font-semibold text-white">Location</p>
                              <p className="text-sm">Nairobi, Kenya</p>
                          </div>
                      </div>
                      <div className="flex items-start space-x-4">
                          <Clock className="h-5 w-5 mt-1 text-gray-400" />
                          <div>
                              <p className="font-semibold text-white">Availability</p>
                              <p className="text-sm">Mon - Fri: 9.00am - 6.00pm</p>
                              <p className="text-sm">Available for freelance projects</p>
                          </div>
                      </div>
                      <div className="flex items-start space-x-4">
                          <Phone className="h-5 w-5 mt-1 text-gray-400" />
                          <div>
                              <p className="font-semibold text-white">Quick Contact</p>
                              <p className="text-sm">mushangip0@gmail.com</p>
                              <p className="text-sm">+254 727 607 824</p>
                          </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-700">
                      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-center items-center relative">
                          <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-700 text-white text-lg">
                                  🎲
                              </div>
                              <p className="text-sm">&copy; 2025 Shangludo . Developed by <span className="font-bold hover:underline">Coder+</span>. All rights reserved.</p>
                          </div>
                      </div>
                  </div>
                </div>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>https://mushangis-portfolio.onrender.com/</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
           <a href="#top" className="absolute right-4 -bottom-5 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                <ArrowUp className="h-5 w-5" />
            </a>
        </div>
      </div>
    </div>
  );
}
