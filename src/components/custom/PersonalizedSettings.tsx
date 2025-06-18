
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, AlertTriangle, CheckCircle } from 'lucide-react';
import { personalizeBookingSettings, type PersonalizeBookingSettingsOutput } from '@/ai/flows/personalize-booking-settings';
import type { PastBooking, UserProfile } from '@/lib/types'; // UserProfile for updateUserProfileAction
import { updateUserProfileAction, getMyTripsAction } from '@/lib/actions'; // Added getMyTripsAction
import { useToast } from '@/hooks/use-toast';

interface PersonalizedSettingsProps {
  userId: string;
  currentPreferences?: Partial<PersonalizeBookingSettingsOutput>;
  onPreferencesSaved?: (newPreferences: PersonalizeBookingSettingsOutput) => void;
}

export default function PersonalizedSettings({ userId, currentPreferences, onPreferencesSaved }: PersonalizedSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<PersonalizeBookingSettingsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePersonalize = async () => {
    setIsLoadingSuggestions(true);
    setError(null);
    setSuggestions(null);
    try {
      // Fetch past bookings from the database for the current user
      const tripsResult = await getMyTripsAction(userId);
      let pastBookingsForAI: PastBooking[] = [];

      if (tripsResult.success && tripsResult.bookings) {
        pastBookingsForAI = tripsResult.bookings.map(b => ({
          vehicleType: b.preferredVehicle,
          // Assuming temperature and musicGenre are not directly on Booking type.
          // For the demo, these might be placeholders or need to be derived differently.
          // If these fields *were* on Booking:
          // temperature: b.preferredTemperature || "22°C", 
          // musicGenre: b.preferredMusicGenre || "Varied",
          // For now, let's use mock-like structures for these two if not on Booking:
          temperature: "21°C", // Placeholder
          musicGenre: b.allergiesOrRequests?.includes("music") ? "As Requested" : "Pop" // Example derivation
        }));
      } else {
        toast({
          title: "Could Not Fetch Trip History",
          description: tripsResult.message || "Unable to retrieve past booking data for personalization.",
          variant: "destructive"
        });
        // Proceed with empty pastBookings if fetch fails, or handle differently
      }
      
      if (pastBookingsForAI.length === 0) {
         toast({
          title: "No Past Bookings Found",
          description: "AI personalization works best with past trip data. We couldn't find any for you yet.",
          variant: "default"
        });
        // Still attempt to run the AI, it might have default suggestions or this could be a user's first time
      }


      const result = await personalizeBookingSettings({
        userId,
        pastBookings: JSON.stringify(pastBookingsForAI), 
      });
      setSuggestions(result);
      toast({
        title: "Preferences Suggested!",
        description: "AI has analyzed your past trips to suggest preferences.",
      });
    } catch (err) {
      console.error("Personalization error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch personalized settings.";
      setError(errorMessage);
      toast({
        title: "Personalization Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!suggestions) return;
    setIsLoading(true);
    try {
      const updateData: Partial<UserProfile> = { // Use Partial<UserProfile> for the action
        preferredVehicleType: suggestions.preferredVehicleType,
        preferredTemperature: suggestions.preferredTemperature,
        preferredMusicGenre: suggestions.preferredMusicGenre,
      };
      // Pass userId directly as it's a string
      const result = await updateUserProfileAction(userId, updateData); 
      
      if (result.success) {
        toast({
          title: "Preferences Saved!",
          description: "Your personalized settings have been updated.",
          variant: "default",
          className: "bg-green-500 text-white"
        });
        if(onPreferencesSaved) {
          onPreferencesSaved(suggestions);
        }
        setSuggestions(null); // Clear suggestions after saving
      } else {
         setError(result.message || "Failed to save preferences.");
         toast({
          title: "Save Failed",
          description: result.message || "Failed to save preferences.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Save preferences error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save preferences.";
      setError(errorMessage);
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const preferencesToShow = suggestions || currentPreferences;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-muted/30">
        <CardTitle className="font-headline text-xl text-primary flex items-center">
          <Wand2 className="mr-2 h-5 w-5" /> AI Personalized Settings
        </CardTitle>
        <CardDescription className="font-body">
          Let our AI suggest preferences based on your past trips, or view your current settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" /> {error}
          </div>
        )}
        
        {preferencesToShow && (
          <div className="space-y-3 mb-6 p-4 border rounded-md bg-background shadow-sm">
            <h4 className="font-headline text-lg text-foreground">
              {suggestions ? "Suggested Preferences:" : "Current Preferences:"}
            </h4>
            <p className="font-body"><strong>Vehicle Type:</strong> {preferencesToShow.preferredVehicleType || 'Not set'}</p>
            <p className="font-body"><strong>Temperature:</strong> {preferencesToShow.preferredTemperature || 'Not set'}</p>
            <p className="font-body"><strong>Music Genre:</strong> {preferencesToShow.preferredMusicGenre || 'Not set'}</p>
          </div>
        )}

        {!preferencesToShow && !isLoadingSuggestions && !isLoading && (
          <p className="text-muted-foreground font-body text-center py-4">
            Click "Personalize with AI" to get suggestions based on your travel history.
          </p>
        )}
         {(isLoadingSuggestions || isLoading) && (
           <div className="flex justify-center items-center py-4">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
             <p className="ml-2 text-muted-foreground">
                {isLoadingSuggestions ? "Analyzing your trips..." : isLoading ? "Saving preferences..." : ""}
             </p>
           </div>
        )}
        
      </CardContent>
      <CardFooter className="p-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <Button onClick={handlePersonalize} disabled={isLoadingSuggestions || isLoading} variant="outline" className="shadow-sm">
          {isLoadingSuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Personalize with AI
        </Button>
        {suggestions && (
          <Button onClick={handleSaveChanges} disabled={isLoading || isLoadingSuggestions} className="bg-primary hover:bg-primary/90 shadow-sm">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Save Suggestions
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
