
"use client";

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, UserCircle, LogIn, UserPlus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/auth/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


const navLinks = [
  { href: '/', label: 'Home', protected: false },
  { href: '/booking', label: 'Book a Ride', protected: true },
  { href: '/my-trips', label: 'My Trips', protected: true },
  { href: '/profile', label: 'Profile', protected: true },
];

export default function Header() {
  const pathname = usePathname();
  const { currentUser, logout, loading } = useAuth();

  const NavLinksContent = ({isMobile = false}: {isMobile?: boolean}) => (
    <>
      {navLinks.filter(link => !link.protected || currentUser).map((link) => (
        <Link key={link.href} href={link.href} passHref>
          <Button
            variant="ghost"
            className={cn(
              "text-lg font-headline hover:bg-accent/50 w-full justify-start",
              pathname === link.href ? "text-primary font-bold underline underline-offset-4" : "text-foreground/80",
              isMobile ? "text-left" : ""
            )}
          >
            {link.label}
          </Button>
        </Link>
      ))}
      {!loading && currentUser && (
        <Button variant="ghost" onClick={logout} className={cn("text-lg font-headline hover:bg-destructive/80 text-destructive w-full justify-start", isMobile ? "text-left" : "")}>
          <LogOut className="mr-2 h-5 w-5" /> Logout
        </Button>
      )}
      {!loading && !currentUser && (
        <>
          <Link href="/login" passHref>
            <Button variant="ghost" className={cn("text-lg font-headline hover:bg-accent/50 w-full justify-start", isMobile ? "text-left" : "")}>
              <LogIn className="mr-2 h-5 w-5" /> Login
            </Button>
          </Link>
          <Link href="/signup" passHref>
            <Button variant="ghost" className={cn("text-lg font-headline hover:bg-accent/50 w-full justify-start", isMobile ? "text-left" : "")}>
               <UserPlus className="mr-2 h-5 w-5" /> Sign Up
            </Button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2" aria-label="MJLT Home">
          <span className="text-3xl font-headline font-bold text-primary">MJLT</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-1">
          <NavLinksContent />
          {currentUser && (
            <Avatar className="ml-2 h-9 w-9">
              <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || 'User'} />
              <AvatarFallback>
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 
                 currentUser.email ? currentUser.email.charAt(0).toUpperCase() : <UserCircle size={20}/>}
              </AvatarFallback>
            </Avatar>
          )}
          <ThemeToggle />
        </nav>

        <div className="md:hidden flex items-center">
           {currentUser && (
            <Avatar className="mr-2 h-8 w-8">
              <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || 'User'} />
              <AvatarFallback>
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 
                 currentUser.email ? currentUser.email.charAt(0).toUpperCase() : <UserCircle size={18}/>}
              </AvatarFallback>
            </Avatar>
          )}
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-background p-6">
              <SheetHeader className="mb-6 border-b pb-4">
                <SheetTitle className="text-2xl font-headline text-primary">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-3">
                <NavLinksContent isMobile={true} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
