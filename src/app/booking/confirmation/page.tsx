"use client";

import React, { useEffect, useState } from 'react';
import { useBookingContext } from '../BookingContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertTriangle, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBookingAction } from '@/lib/actions';
import type { BookingFormData, Booking } from '@/lib/types';
import { formatDate, calculateAge } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function ConfirmationPage() {
  const { formData, setCurrentStep } = useBookingContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    if (!formData || Object.keys(formData).length === 0) {
      // If no form data, redirect to booking start
      router.replace('/booking');
      toast({
        title: "Missing Information",
        description: "Please start your booking from the beginning.",
        variant: "destructive"
      });
    } else if (formData.dateOfBirth) {
      setAge(calculateAge(formData.dateOfBirth));
    }
  }, [formData, router, toast]);

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setError(null);
    setBookingResult(null);

    try {
      // Assuming a mock userId for now
      const result = await createBookingAction(formData as BookingFormData, "mockUserId");
      if (result.success && result.booking) {
        setBookingResult(result.booking);
        toast({
          title: "Booking Confirmed!",
          description: "Your luxury ride is booked. We'll be in touch soon.",
          variant: "default",
          className: "bg-green-500 text-white"
        });
        // Optionally clear form data from context or reset state
        // updateFormData({}); // Example reset
        // setCurrentStep(1);
      } else {
        setError(result.message || "Failed to confirm booking. Please try again.");
        toast({
          title: "Booking Failed",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Confirmation error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
       toast({
          title: "Booking Error",
          description: errorMessage,
          variant: "destructive"
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData || Object.keys(formData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-body text-muted-foreground">Loading booking details...</p>
      </div>
    );
  }
  
  const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="flex justify-between py-2 border-b border-border/50">
      <dt className="font-semibold text-muted-foreground font-body">{label}:</dt>
      <dd className="text-right text-foreground font-body">{value || 'N/A'}</dd>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-headline font-bold text-center mb-12 text-primary">
        {bookingResult ? "Booking Confirmed!" : "Review Your Booking"}
      </h1>
      
      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-2xl font-headline text-primary flex items-center">
            {bookingResult ? <CheckCircle className="mr-2 h-7 w-7 text-green-500" /> : null}
            Booking Summary
          </CardTitle>
          {!bookingResult && <CardDescription className="font-body">Please review your details before confirming.</CardDescription>}
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <dl className="space-y-2">
            <DetailItem label="Full Name" value={formData.fullName} />
            <DetailItem label="Date of Birth" value={formatDate(formData.dateOfBirth)} />
            {age !== null && <DetailItem label="Age" value={age} />}
            <DetailItem label="Contact Details" value={formData.contactDetails} />
            {age !== null && age < 18 && (
              <>
                <DetailItem label="Guardian Name" value={formData.guardianName} />
                <DetailItem label="Guardian Contact" value={formData.guardianContact} />
              </>
            )}
            <DetailItem label="Destination" value={formData.destination} />
            <DetailItem label="Departure Date" value={formatDate(formData.departureDate)} />
            <DetailItem label="Preferred Vehicle" value={formData.preferredVehicle} />
            <DetailItem label="Allergies/Requests" value={formData.allergiesOrRequests} />
          </dl>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {bookingResult && (
            <Alert variant="default" className="bg-green-50 border-green-300">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-700 font-headline">Booking Successful!</AlertTitle>
              <AlertDescription className="text-green-600 font-body">
                Your booking (ID: {bookingResult.id}) is confirmed. We look forward to serving you.
                You can view this booking in <Link href="/my-trips" className="underline hover:text-green-800">My Trips</Link>.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="p-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          {!bookingResult ? (
            <>
              <Button variant="outline" onClick={() => { setCurrentStep(BOOKING_FORM_STEPS.length-1); router.back()}} disabled={isSubmitting}>
                Edit Booking
              </Button>
              <Button onClick={handleConfirmBooking} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Confirm Booking
              </Button>
            </>
          ) : (
             <Link href="/" passHref>
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                    <Home className="mr-2 h-4 w-4" /> Go to Homepage
                </Button>
             </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
