
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import TripCard from '@/components/custom/TripCard';
import type { Booking } from '@/lib/types';
import { getMyTripsAction } from '@/lib/actions';
import { Loader2, TicketX, ShieldAlert, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/app/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format as formatDateFns, isSameDay } from 'date-fns';

export default function MyTripsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilterDate, setSelectedFilterDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace('/login?redirect=/my-trips');
      return;
    }

    async function fetchTrips() {
      if (currentUser) {
        setIsLoading(true);
        setError(null);
        try {
          const result = await getMyTripsAction(currentUser.uid);
          if (result.success && result.bookings) {
            setTrips(result.bookings as Booking[]);
          } else {
            setError(result.message || "Failed to fetch trips.");
          }
        } catch (err) {
          console.error("Fetch trips error:", err);
          setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
          setIsLoading(false);
        }
      } else if (!authLoading) {
        // Not logged in and auth is not loading anymore
        setIsLoading(false);
      }
    }
    
    if(!authLoading && currentUser) fetchTrips();

  }, [currentUser, authLoading, router]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedFilterDate(date);
  };

  const clearFilter = () => {
    setSelectedFilterDate(undefined);
  };

  const displayTrips = useMemo(() => {
    if (!selectedFilterDate) {
      return trips;
    }
    return trips.filter(trip => {
      if (!trip.departureDate) return false;
      const departureD = new Date(trip.departureDate);
      return isSameDay(departureD, selectedFilterDate);
    });
  }, [trips, selectedFilterDate]);

  if (authLoading || (isLoading && currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-body text-muted-foreground">Loading your trips...</p>
      </div>
    );
  }
  
  if (!currentUser && !authLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-headline font-semibold text-destructive mb-2">Access Denied</h2>
        <p className="text-lg font-body text-muted-foreground mb-6">Please log in to view your trips.</p>
        <Link href="/login?redirect=/my-trips" passHref>
          <Button variant="default" className="bg-primary hover:bg-primary/90">Login</Button>
        </Link>
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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
        <h1 className="text-4xl font-headline font-bold text-center sm:text-left text-primary mb-4 sm:mb-0">
          My Trips
        </h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="shadow-sm">
              <Filter className="mr-2 h-4 w-4" />
              {selectedFilterDate ? `Date: ${formatDateFns(selectedFilterDate, "PPP")}` : "Filter by Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedFilterDate}
              onSelect={handleDateSelect}
              initialFocus
              disabled={(date) => date < new Date("1900-01-01") } 
            />
            {selectedFilterDate && (
              <div className="p-2 border-t flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilter} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                  <X className="mr-2 h-4 w-4" /> Clear Filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {displayTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <TicketX className="h-20 w-20 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-headline font-semibold text-foreground mb-3">
            {selectedFilterDate ? "No Trips Found" : "No Trips Yet!"}
          </h2>
          <p className="text-lg font-body text-muted-foreground mb-8 max-w-md">
            {selectedFilterDate
              ? "No trips match the selected date. Try a different date or clear the filter."
              : "You haven't booked any luxury rides with us. Ready to experience the ultimate in comfort and style?"}
          </p>
          {selectedFilterDate ? (
            <Button onClick={clearFilter} variant="outline" className="shadow-sm">
               <X className="mr-2 h-4 w-4" /> Clear Filter
            </Button>
          ) : (
            <Link href="/booking" passHref>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-md transition-transform hover:scale-105">
                Book Your First Ride
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}

