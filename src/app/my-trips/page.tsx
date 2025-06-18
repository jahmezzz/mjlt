"use client";

import React, { useEffect, useState } from 'react';
import TripCard from '@/components/custom/TripCard';
import type { Booking } from '@/lib/types';
import { getMyTripsAction } from '@/lib/actions';
import { Loader2, TicketX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MyTripsPage() {
  const [trips, setTrips] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrips() {
      setIsLoading(true);
      setError(null);
      try {
        // Assuming a mock userId for now
        const result = await getMyTripsAction("mockUserId");
        if (result.success && result.bookings) {
          setTrips(result.bookings as Booking[]); // Cast as Booking[]
        } else {
          setError(result.message || "Failed to fetch trips.");
        }
      } catch (err) {
        console.error("Fetch trips error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrips();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-body text-muted-foreground">Loading your trips...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <TicketX className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-headline font-semibold text-destructive mb-2">Oops! Something went wrong.</h2>
        <p className="text-lg font-body text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-headline font-bold text-center mb-12 text-primary">My Trips</h1>
      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 border border-dashed rounded-lg bg-muted/30">
          <TicketX className="h-20 w-20 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-headline font-semibold text-foreground mb-3">No Trips Yet!</h2>
          <p className="text-lg font-body text-muted-foreground mb-8 max-w-md">
            You haven&apos;t booked any luxury rides with us. Ready to experience the ultimate in comfort and style?
          </p>
          <Link href="/booking" passHref>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-md transition-transform hover:scale-105">
              Book Your First Ride
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
