
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn, calculateAge, formatDate } from '@/lib/utils';
import { VEHICLE_TYPES, MIN_AGE, BOOKING_FORM_STEPS } from '@/lib/constants';
import type { BookingFormData } from '@/lib/types';
import { useBookingContext } from '@/app/booking/BookingContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const createBookingFormSchema = (isUnderAge: boolean) => z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format." })
    .refine(val => new Date(val) < new Date(), { message: "Date of birth must be in the past." }),
  contactDetails: z.string().min(5, { message: "Contact details are required." }), // Simple validation
  guardianName: isUnderAge ? z.string().min(2, { message: "Guardian name is required." }) : z.string().optional(),
  guardianContact: isUnderAge ? z.string().min(5, { message: "Guardian contact is required." }) : z.string().optional(),
  destination: z.string().min(3, { message: "Destination must be at least 3 characters." }),
  departureDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format." })
    .refine(val => new Date(val) >= new Date(new Date().setHours(0,0,0,0)), { message: "Departure date cannot be in the past." }),
  preferredVehicle: z.string().min(1, { message: "Please select a vehicle type." }),
  allergiesOrRequests: z.string().optional(),
});

type ValidationSchema = z.infer<ReturnType<typeof createBookingFormSchema>>;

export default function BookingForm() {
  const { formData, updateFormData, currentStep, setCurrentStep, totalSteps } = useBookingContext();
  const [age, setAge] = useState<number | null>(null);
  const [isUnderAge, setIsUnderAge] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const currentSchema = createBookingFormSchema(isUnderAge);
  
  const { control, handleSubmit, formState: { errors }, watch, trigger, getValues, reset } = useForm<ValidationSchema>({
    resolver: zodResolver(currentSchema),
    defaultValues: formData,
    mode: "onChange", // "onBlur" or "onChange" are good for UX
  });

  const watchedDob = watch("dateOfBirth");

  useEffect(() => {
    if (watchedDob) {
      const calculatedAge = calculateAge(watchedDob);
      setAge(calculatedAge);
      setIsUnderAge(calculatedAge < MIN_AGE);
    } else {
      setAge(null);
      setIsUnderAge(false);
    }
  }, [watchedDob]);

  useEffect(() => {
    reset(formData); 
  }, [formData, reset, currentStep]);

  const processStep: SubmitHandler<BookingFormData> = (data) => {
    updateFormData(data);
    if (currentStep < totalSteps -1) { 
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/booking/confirmation');
    }
  };

  const handleNext = async () => {
    const fieldsToValidate = BOOKING_FORM_STEPS[currentStep - 1].fields;
    const isValid = await trigger(fieldsToValidate as (keyof ValidationSchema)[]);
    
    if (isValid) {
      const currentValues = getValues();
      // Ensure that processStep receives data that matches BookingFormData structure
      // by explicitly casting. This assumes ValidationSchema is a superset or compatible.
      processStep(currentValues as BookingFormData); 
    } else {
        toast({
          title: "Validation Error",
          description: "Please correct the errors in the form before proceeding.",
          variant: "destructive",
        });
    }
  };

  const handlePrevious = () => {
    const currentValues = getValues();
    updateFormData(currentValues); // Save current step's (potentially partially filled) data
    setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Personal Info
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-headline text-primary">Personal Information</h3>
            <div>
              <Label htmlFor="fullName" className="font-semibold">Full Name</Label>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => <Input id="fullName" {...field} value={field.value || ''} placeholder="e.g., James Bond" aria-invalid={errors.fullName ? "true" : "false"} />}
              />
              {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth" className="font-semibold">Date of Birth</Label>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        aria-label="Select date of birth"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? formatDate(field.value) : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{errors.dateOfBirth.message}</p>}
              {age !== null && <p className="text-sm text-muted-foreground mt-1">Age: {age}</p>}
            </div>

            {isUnderAge && age !== null && (
              <Alert variant="destructive" className="shadow-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-headline">Age Restriction</AlertTitle>
                <AlertDescription className="font-body">
                  Users under {MIN_AGE} must provide guardian contact details. MJLT services may only be directly booked and used by individuals {MIN_AGE} years of age or older.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="contactDetails" className="font-semibold">Contact Details (Email or Phone)</Label>
              <Controller
                name="contactDetails"
                control={control}
                render={({ field }) => <Input id="contactDetails" {...field} value={field.value || ''} placeholder="e.g., user@example.com or +1234567890" aria-invalid={errors.contactDetails ? "true" : "false"} />}
              />
              {errors.contactDetails && <p className="text-sm text-destructive mt-1">{errors.contactDetails.message}</p>}
            </div>

            {isUnderAge && (
              <>
                <div>
                  <Label htmlFor="guardianName" className="font-semibold">Guardian&apos;s Full Name</Label>
                  <Controller
                    name="guardianName"
                    control={control}
                    render={({ field }) => <Input id="guardianName" {...field} value={field.value || ''} placeholder="Guardian's Name" aria-invalid={errors.guardianName ? "true" : "false"} />}
                  />
                  {errors.guardianName && <p className="text-sm text-destructive mt-1">{errors.guardianName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="guardianContact" className="font-semibold">Guardian&apos;s Contact (Email or Phone)</Label>
                  <Controller
                    name="guardianContact"
                    control={control}
                    render={({ field }) => <Input id="guardianContact" {...field} value={field.value || ''} placeholder="Guardian's Contact" aria-invalid={errors.guardianContact ? "true" : "false"} />}
                  />
                  {errors.guardianContact && <p className="text-sm text-destructive mt-1">{errors.guardianContact.message}</p>}
                </div>
              </>
            )}
          </div>
        );
      case 2: // Trip Details
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-headline text-primary">Trip Details</h3>
            <div>
              <Label htmlFor="destination" className="font-semibold">Destination</Label>
              <Controller
                name="destination"
                control={control}
                render={({ field }) => <Input id="destination" {...field} value={field.value || ''} placeholder="e.g., City Airport" aria-invalid={errors.destination ? "true" : "false"} />}
              />
              {errors.destination && <p className="text-sm text-destructive mt-1">{errors.destination.message}</p>}
            </div>

            <div>
              <Label htmlFor="departureDate" className="font-semibold">Date of Departure</Label>
              <Controller
                name="departureDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        aria-label="Select departure date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? formatDate(field.value) : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) } // disable past dates
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.departureDate && <p className="text-sm text-destructive mt-1">{errors.departureDate.message}</p>}
            </div>

            <div>
              <Label htmlFor="preferredVehicle" className="font-semibold">Preferred Vehicle</Label>
              <Controller
                name="preferredVehicle"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ''} aria-invalid={errors.preferredVehicle ? "true" : "false"}>
                    <SelectTrigger id="preferredVehicle">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.preferredVehicle && <p className="text-sm text-destructive mt-1">{errors.preferredVehicle.message}</p>}
            </div>
          </div>
        );
      case 3: // Special Requests
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-headline text-primary">Allergies / Special Requests</h3>
             <div>
              <Label htmlFor="allergiesOrRequests" className="font-semibold">Allergies or Special Requests</Label>
              <Controller
                name="allergiesOrRequests"
                control={control}
                render={({ field }) => <Textarea id="allergiesOrRequests" {...field} value={field.value || ''} placeholder="e.g., Peanut allergy, require child seat" rows={4} />}
              />
              {errors.allergiesOrRequests && <p className="text-sm text-destructive mt-1">{errors.allergiesOrRequests.message}</p>}
            </div>
            <Alert className="shadow-sm">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="font-headline">We&apos;ll do our best!</AlertTitle>
              <AlertDescription className="font-body">
                Please note any special requirements. While we strive to accommodate all requests, some may be subject to availability or additional charges.
              </AlertDescription>
            </Alert>
          </div>
        );
      default:
        return null;
    }
  };

  // The form's onSubmit is primarily a fallback if something triggers a native form submission.
  // The step navigation is handled by the handleNext/handlePrevious button onClick events.
  const onFormSubmit: SubmitHandler<ValidationSchema> = (data) => {
    // This function would be called if the form was submitted traditionally (e.g. enter key)
    // AND if all fields in currentSchema are valid.
    // For the multi-step, we primarily rely on handleNext.
    // If we are on the last input step, this could also trigger navigation.
    if (currentStep === totalSteps - 1) {
        processStep(data as BookingFormData);
    } else {
        // Or, if not last step, just treat as a "next" action.
        handleNext();
    }
  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader className="p-6 bg-muted/30">
        <CardTitle className="text-3xl font-headline text-center text-primary">
          {BOOKING_FORM_STEPS[currentStep -1].name}
        </CardTitle>
        <div className="w-full bg-muted rounded-full h-2.5 mt-4">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${(currentStep / (totalSteps-1)) * 100}%` }}
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={totalSteps-1}
            role="progressbar"
            aria-label={`Step ${currentStep} of ${totalSteps-1}`}
          ></div>
        </div>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
          {renderStepContent()}
          <div className="flex justify-between pt-6 border-t mt-8">
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1} className="shadow-sm">
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button type="button" onClick={handleNext} className="shadow-sm bg-primary hover:bg-primary/90">
              {currentStep === totalSteps - 1 ? 'Review Booking' : 'Next'} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
