import type { Booking } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, MapPin, Car, User, Info } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TripCardProps {
  trip: Booking;
}

export default function TripCard({ trip }: TripCardProps) {
  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="bg-muted/30">
        <CardTitle className="font-headline text-xl text-primary flex items-center">
          <MapPin className="mr-2 h-5 w-5" /> To: {trip.destination}
        </CardTitle>
        <CardDescription className="font-body text-sm">Booking ID: {trip.id}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 grid gap-4">
        <div className="flex items-center">
          <CalendarDays className="mr-3 h-5 w-5 text-muted-foreground" />
          <span className="font-body"><span className="font-semibold">Date:</span> {formatDate(trip.departureDate)}</span>
        </div>
        <div className="flex items-center">
          <Car className="mr-3 h-5 w-5 text-muted-foreground" />
          <span className="font-body"><span className="font-semibold">Vehicle:</span> {trip.preferredVehicle}</span>
        </div>
        <div className="flex items-center">
          <User className="mr-3 h-5 w-5 text-muted-foreground" />
          <span className="font-body"><span className="font-semibold">Passenger:</span> {trip.fullName}</span>
        </div>
        {trip.allergiesOrRequests && (
          <div className="flex items-start">
            <Info className="mr-3 h-5 w-5 text-muted-foreground mt-1" />
            <span className="font-body"><span className="font-semibold">Requests:</span> {trip.allergiesOrRequests}</span>
          </div>
        )}
         <div className={`mt-2 p-2 rounded-md text-sm font-medium ${trip.isConfirmed ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'}`}>
          Status: {trip.isConfirmed ? 'Confirmed' : 'Pending Confirmation'}
        </div>
      </CardContent>
    </Card>
  );
}
