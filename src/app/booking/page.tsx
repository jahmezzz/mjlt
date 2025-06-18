
"use client";
import BookingForm from '@/components/custom/BookingForm';
import { useAuth } from '@/app/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BookingPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace('/login?redirect=/booking');
    }
  }, [currentUser, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-body text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This state should ideally be brief due to the redirect, but good for robustness
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-headline font-semibold text-destructive mb-2">Access Denied</h2>
        <p className="text-lg font-body text-muted-foreground mb-6">Please log in to book a ride.</p>
        <Link href="/login?redirect=/booking" passHref>
            <Button variant="default" className="bg-primary hover:bg-primary/90">Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-headline font-bold text-center mb-12 text-primary">Book Your Luxury Ride</h1>
      <BookingForm />
    </div>
  );
}
