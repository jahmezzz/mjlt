"use client";

import React, { useState }_ from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, AlertTriangle, CheckCircle } from 'lucide-react';
import { personalizeBookingSettings, type PersonalizeBookingSettingsOutput } from '@/ai/flows/personalize-booking-settings';
import type { PastBooking } from '@/lib/types';
import { updateUserProfileAction } from '@/lib/actions'; // Assuming this action exists
import { useToast } from '@/hooks/use-toast';

// Mock past bookings for demonstration
const mockPastBookings: PastBooking[] = [
  { vehicleType: "SUV", temperature: "21°C", musicGenre: "Pop" },
  { vehicleType: "Sedan", temperature: "22°C", musicGenre: "Classical" },
  { vehicleType: "SUV", temperature: "21°C", musicGenre: "Pop" },
  { vehicleType: "Van", temperature: "20°C", musicGenre: "Rock" },
  { vehicleType: "SUV", temperature: "21°C", musicGenre: "Electronic" },
];

interface PersonalizedSettingsProps {
  userId: string;
  currentPreferences?: Partial<PersonalizeBookingSettingsOutput>;
  onPreferencesSaved?: (newPreferences: PersonalizeBookingSettingsOutput) => void;
}

export default function PersonalizedSettings({ userId, currentPreferences, onPreferencesSaved }: PersonalizedSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PersonalizeBookingSettingsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePersonalize = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await personalizeBookingSettings({
        userId,
        pastBookings: JSON.stringify(mockPastBookings),
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
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!suggestions) return;
    setIsLoading(true);
    try {
      const updateData = {
        preferredVehicleType: suggestions.preferredVehicleType,
        preferredTemperature: suggestions.preferredTemperature,
        preferredMusicGenre: suggestions.preferredMusicGenre,
      };
      await updateUserProfileAction(userId, updateData); // Use your actual update profile action
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

        {!suggestions && !currentPreferences && !isLoading && (
          <p className="text-muted-foreground font-body text-center py-4">
            Click "Personalize with AI" to get suggestions based on your travel history.
          </p>
        )}
        
      </CardContent>
      <CardFooter className="p-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <Button onClick={handlePersonalize} disabled={isLoading} variant="outline" className="shadow-sm">
          {isLoading && !suggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Personalize with AI
        </Button>
        {suggestions && (
          <Button onClick={handleSaveChanges} disabled={isLoading} className="bg-primary hover:bg-primary/90 shadow-sm">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Save Suggestions
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
