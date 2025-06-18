
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, UserCircle, Loader2, Edit3, Save, ShieldAlert } from 'lucide-react';
import { cn, calculateAge, formatDate } from '@/lib/utils';
import PersonalizedSettings from '@/components/custom/PersonalizedSettings';
import type { UserProfile as UserProfileType } from '@/lib/types'; 
import { updateUserProfileAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { PersonalizeBookingSettingsOutput } from '@/ai/flows/personalize-booking-settings';
import { useAuth } from '@/app/auth/AuthContext';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  // Date of birth can be null initially, then required if user tries to set it.
  dateOfBirth: z.string().refine(val => val === "" || (new Date(val) < new Date()), "Date of birth must be in the past if provided.")
                          .refine(val => val === "" || !isNaN(Date.parse(val)), "Invalid date format."),
  contactDetails: z.string().min(5, "Contact details are required."), 
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { currentUser, dbUserProfile, loading: authLoading, fetchDbUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // For local page loading, distinct from authLoading
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      contactDetails: '',
    }
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace('/login');
    } else if (currentUser && dbUserProfile) {
      const profileToSet = {
        fullName: dbUserProfile.fullName || '',
        dateOfBirth: dbUserProfile.dateOfBirth || '', // Ensure it's an empty string if null/undefined
        contactDetails: dbUserProfile.contactDetails || '',
      };
      reset(profileToSet);
      setIsLoading(false);
    } else if (currentUser && !dbUserProfile && !authLoading) {
      // This case might indicate a delay or issue in fetching dbUserProfile
      // Potentially trigger a re-fetch or show a specific message
      setIsLoading(true); // Keep loading until dbUserProfile is available or confirmed unavailable
      fetchDbUserProfile(currentUser.uid); // Attempt to refetch
    }
     else if (authLoading) {
      setIsLoading(true);
    }
  }, [currentUser, dbUserProfile, authLoading, reset, router, fetchDbUserProfile]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }
    try {
      const result = await updateUserProfileAction(currentUser.uid, data);
      if (result.success && result.profile) {
        // The dbUserProfile in AuthContext should ideally be updated by the AuthProvider itself
        // after a successful update. For now, we'll just reset the form with the returned profile.
        const updatedFormValues = {
            fullName: result.profile.fullName || '',
            dateOfBirth: result.profile.dateOfBirth || '',
            contactDetails: result.profile.contactDetails || '',
        };
        reset(updatedFormValues);
        await fetchDbUserProfile(currentUser.uid); // Re-fetch to update context
        setIsEditing(false);
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated.", className: "bg-green-500 text-white" });
      } else {
        toast({ title: "Update Failed", description: result.message || "Failed to update profile.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Update Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };
  
  const handlePreferencesSaved = async (newPreferences: PersonalizeBookingSettingsOutput) => {
    if(currentUser && dbUserProfile) {
        // Optimistically update local form state, AuthContext will update from DB
        const updatedProfileData = {
            ...dbUserProfile, // current full profile from context
            preferredVehicleType: newPreferences.preferredVehicleType,
            preferredTemperature: newPreferences.preferredTemperature,
            preferredMusicGenre: newPreferences.preferredMusicGenre,
        };
        // We only reset the fields part of the form
        reset({
            fullName: updatedProfileData.fullName || '',
            dateOfBirth: updatedProfileData.dateOfBirth || '',
            contactDetails: updatedProfileData.contactDetails || '',
        });
        await fetchDbUserProfile(currentUser.uid); // This will update dbUserProfile in context
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-body text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!currentUser || !dbUserProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-headline font-semibold text-destructive mb-2">Profile Access Error</h2>
        <p className="text-lg font-body text-muted-foreground">We couldn&apos;t load your profile. Please try logging in again.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
      </div>
    );
  }
  
  const currentAge = dbUserProfile.dateOfBirth ? calculateAge(dbUserProfile.dateOfBirth) : null;

  return (
    <div className="container mx-auto py-8 space-y-12">
      <h1 className="text-4xl font-headline font-bold text-center text-primary">My Profile</h1>
      
      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader className="bg-muted/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-headline text-primary">Account Details</CardTitle>
            {!isEditing && (
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit profile">
                <Edit3 className="h-5 w-5" />
              </Button>
            )}
          </div>
          <CardDescription className="font-body">Manage your personal information.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="fullName" className="font-semibold">Full Name</Label>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => <Input id="fullName" {...field} readOnly={!isEditing} className={!isEditing ? "border-transparent bg-transparent px-0 shadow-none dark:border-transparent dark:bg-transparent" : ""} />}
              />
              {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth" className="font-semibold">Date of Birth</Label>
              {isEditing ? (
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
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
                          captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              ) : (
                 <Input id="dateOfBirth" value={dbUserProfile.dateOfBirth ? formatDate(dbUserProfile.dateOfBirth) : 'N/A'} readOnly className="border-transparent bg-transparent px-0 shadow-none dark:border-transparent dark:bg-transparent" />
              )}
              {errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{errors.dateOfBirth.message}</p>}
              {currentAge !== null && <p className="text-sm text-muted-foreground mt-1">Age: {currentAge}</p>}
            </div>

            <div>
              <Label htmlFor="contactDetails" className="font-semibold">Contact Details</Label>
              <Controller
                name="contactDetails"
                control={control}
                render={({ field }) => <Input id="contactDetails" {...field} readOnly={!isEditing}  className={!isEditing ? "border-transparent bg-transparent px-0 shadow-none dark:border-transparent dark:bg-transparent" : ""} />}
              />
              {errors.contactDetails && <p className="text-sm text-destructive mt-1">{errors.contactDetails.message}</p>}
            </div>
             <div>
                <Label className="font-semibold">Email (from Login)</Label>
                <Input value={currentUser.email || 'N/A'} readOnly className="border-transparent bg-transparent px-0 shadow-none dark:border-transparent dark:bg-transparent" />
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="p-6 flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => { 
                  setIsEditing(false); 
                  reset({
                    fullName: dbUserProfile.fullName || '',
                    dateOfBirth: dbUserProfile.dateOfBirth || '',
                    contactDetails: dbUserProfile.contactDetails || '',
                  }); 
                }} 
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>

      <PersonalizedSettings 
        userId={currentUser.uid} 
        currentPreferences={{
            preferredVehicleType: dbUserProfile.preferredVehicleType,
            preferredTemperature: dbUserProfile.preferredTemperature,
            preferredMusicGenre: dbUserProfile.preferredMusicGenre,
        }}
        onPreferencesSaved={handlePreferencesSaved}
      />
    </div>
  );
}
