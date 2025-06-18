
export interface UserProfile {
  id: string; // This will be the database-generated UUID
  firebaseUid: string; // The Firebase UID
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
  id: string; // Booking's own UUID
  userId: string; // This will be the users.id (UUID) from the users table
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
