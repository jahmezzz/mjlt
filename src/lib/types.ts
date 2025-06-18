export interface UserProfile {
  id: string;
  fullName: string;
  dateOfBirth: string; 
  contactDetails: string; 
  guardianName?: string;
  guardianContact?: string;
  preferredVehicleType?: string;
  preferredTemperature?: string;
  preferredMusicGenre?: string;
}

export interface BookingFormData {
  fullName: string;
  dateOfBirth: string;
  contactDetails: string;
  guardianName?: string;
  guardianContact?: string;
  destination: string;
  departureDate: string; // Should be stored as ISO string or Date
  preferredVehicle: string;
  allergiesOrRequests?: string;
}

export interface Booking extends BookingFormData {
  id: string;
  userId: string; // Assuming a logged-in user context
  isConfirmed: boolean;
  age?: number; // Calculated at time of booking or derived
}

export interface PastBooking {
  vehicleType: string;
  temperature: string;
  musicGenre: string;
}

// For the multi-step form
export type BookingStep = 'personalInfo' | 'tripDetails' | 'specialRequests' | 'review';

export interface BookingContextType {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}
