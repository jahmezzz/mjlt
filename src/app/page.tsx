import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, UserCircle, CalendarDays } from "lucide-react";
import Link from "next/link";
// Removed Image import from 'next/image' as it's no longer used

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-12">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary via-primary/80 to-background rounded-lg shadow-2xl">
        <div className="container px-4 md:px-6">
          {/* Changed grid to a flex column centered layout */}
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary-foreground">
                Mr James Luxury Transport
              </h1>
              <p className="max-w-[600px] text-primary-foreground/90 md:text-xl font-body">
                Experience unparalleled comfort and style. Book your exclusive ride with MJLT today.
              </p>
            </div>
            <div className="flex flex-col gap-3 min-[400px]:flex-row justify-center">
              <Link href="/booking" passHref>
                <Button size="lg" className="text-lg px-8 py-6 bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transition-transform hover:scale-105">
                  <Car className="mr-2 h-5 w-5" /> Book a Ride
                </Button>
              </Link>
              <Link href="/my-trips" passHref>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 shadow-md transition-transform hover:scale-105">
                  <CalendarDays className="mr-2 h-5 w-5" /> My Trips
                </Button>
              </Link>
            </div>
            {/* Removed Image component
             <Image
                src="https://placehold.co/600x400.png"
                alt="Luxury Car"
                data-ai-hint="luxury car night"
                width={600}
                height={400}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-lg"
              />
            */}
          </div>
        </div>
      </section>

      <section className="w-full max-w-4xl space-y-8">
        <h2 className="text-3xl font-headline font-semibold tracking-tight text-foreground">Why Choose MJLT?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <Car className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="font-headline text-center">Premium Fleet</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-body text-center">
                Travel in the latest luxury vehicles, maintained to the highest standards.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <UserCircle className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="font-headline text-center">Professional Chauffeurs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-body text-center">
                Our chauffeurs are experienced, discreet, and dedicated to your comfort.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CalendarDays className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="font-headline text-center">Reliable Service</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-body text-center">
                Punctual, dependable, and available 24/7 for your convenience.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
