import BookingForm from '@/components/custom/BookingForm';

export default function BookingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-headline font-bold text-center mb-12 text-primary">Book Your Luxury Ride</h1>
      <BookingForm />
    </div>
  );
}
