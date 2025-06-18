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
import { CalendarIcon, UserCircle, Loader2, Edit3, Save } from 'lucide-react';
import { cn, calculateAge, formatDate } from '@/lib/utils';
import PersonalizedSettings from '@/components/custom/PersonalizedSettings';
import type { UserProfile as UserProfileType } from '@/lib/types'; // Renamed to avoid conflict
import { getUserProfileAction, updateUserProfileAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { PersonalizeBookingSettingsOutput } from '@/ai/flows/personalize-booking-settings';

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  dateOfBirth: z.string().refine(val => new Date(val) < new Date(), "Date of birth must be in the past."),
  contactDetails: z.string().min(5, "Contact details are required."), // Add email/phone validation if needed
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        // Assuming a mock userId for now
        const result = await getUserProfileAction("mockUserId");
        if (result.success && result.profile) {
          setUserProfile(result.profile as UserProfileType);
          reset(result.profile as ProfileFormData); // Set form default values
        } else {
          toast({ title: "Error", description: result.message || "Failed to load profile.", variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Error", description: "An unexpected error occurred while loading profile.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [reset, toast]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    try {
      const result = await updateUserProfileAction("mockUserId", data);
      if (result.success && result.profile) {
        setUserProfile(result.profile as UserProfileType);
        reset(result.profile as ProfileFormData);
        setIsEditing(false);
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated.", className: "bg-green-500 text-white" });
      } else {
        toast({ title: "Update Failed", description: result.message || "Failed to update profile.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Update Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };
  
  const handlePreferencesSaved = (newPreferences: PersonalizeBookingSettingsOutput) => {
    if(userProfile) {
        const updatedProfile = {
            ...userProfile,
            preferredVehicleType: newPreferences.preferredVehicleType,
            preferredTemperature: newPreferences.preferredTemperature,
            preferredMusicGenre: newPreferences.preferredMusicGenre,
        };
        setUserProfile(updatedProfile);
        reset(updatedProfile as ProfileFormData); // Update form if these fields are part of it
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-body text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <UserCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-headline font-semibold text-destructive mb-2">Profile Not Found</h2>
        <p className="text-lg font-body text-muted-foreground">We couldn&apos;t find your profile. Please try again later.</p>
      </div>
    );
  }

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
                render={({ field }) => <Input id="fullName" {...field} readOnly={!isEditing} className={!isEditing ? "border-transparent bg-transparent px-0 shadow-none" : ""} />}
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
                 <Input id="dateOfBirth" value={formatDate(userProfile.dateOfBirth)} readOnly className="border-transparent bg-transparent px-0 shadow-none" />
              )}
              {errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{errors.dateOfBirth.message}</p>}
              {userProfile.dateOfBirth && <p className="text-sm text-muted-foreground mt-1">Age: {calculateAge(userProfile.dateOfBirth)}</p>}
            </div>

            <div>
              <Label htmlFor="contactDetails" className="font-semibold">Contact Details</Label>
              <Controller
                name="contactDetails"
                control={control}
                render={({ field }) => <Input id="contactDetails" {...field} readOnly={!isEditing}  className={!isEditing ? "border-transparent bg-transparent px-0 shadow-none" : ""} />}
              />
              {errors.contactDetails && <p className="text-sm text-destructive mt-1">{errors.contactDetails.message}</p>}
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="p-6 flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); reset(userProfile as ProfileFormData); }} disabled={isSubmitting}>
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
        userId="mockUserId" 
        currentPreferences={{
            preferredVehicleType: userProfile.preferredVehicleType,
            preferredTemperature: userProfile.preferredTemperature,
            preferredMusicGenre: userProfile.preferredMusicGenre,
        }}
        onPreferencesSaved={handlePreferencesSaved}
      />
    </div>
  );
}
