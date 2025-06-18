"use client";

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react'; // Removed Car import
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/booking', label: 'Book a Ride' },
  { href: '/my-trips', label: 'My Trips' },
  { href: '/profile', label: 'Profile' },
];

export default function Header() {
  const pathname = usePathname();

  const NavLinksContent = () => (
    <>
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} passHref>
          <Button
            variant="ghost"
            className={cn(
              "text-lg font-headline hover:bg-accent/50",
              pathname === link.href ? "text-primary font-bold underline underline-offset-4" : "text-foreground/80"
            )}
          >
            {link.label}
          </Button>
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2" aria-label="MJLT Home">
          {/* <Car className="h-10 w-10 text-primary" /> Removed Car icon */}
          <span className="text-3xl font-headline font-bold text-primary">MJLT</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-2">
          <NavLinksContent />
          <ThemeToggle />
        </nav>

        <div className="md:hidden flex items-center">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px] bg-background p-6">
              <div className="flex flex-col space-y-4 mt-8">
                <NavLinksContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
