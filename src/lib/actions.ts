"use server";

import type { BookingFormData } from "./types";

// Simulate database
let bookings: Array<any> = [];
let userProfiles: Record<string, any> = {
  "mockUserId": {
    id: "mockUserId",
    fullName: "James T. Kirk",
    dateOfBirth: "2233-03-22",
    contactDetails: "kirk@starfleet.com",
  }
};

export async function createBookingAction(bookingData: BookingFormData, userId: string = "mockUserId") {
  console.log("Attempting to create booking with data:", bookingData);

  // Simulate age calculation for confirmation
  const { calculateAge } = await import("@/lib/utils");
  const age = calculateAge(bookingData.dateOfBirth);

  if (age < 18 && (!bookingData.guardianName || !bookingData.guardianContact)) {
    return { success: false, message: "Guardian details are required for passengers under 18." };
  }

  const newBooking = {
    id: `booking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    ...bookingData,
    age,
    isConfirmed: true, // For simplicity, confirm immediately
  };

  bookings.push(newBooking);
  console.log("Booking created successfully:", newBooking);
  console.log("All bookings:", bookings);
  return { success: true, message: "Booking confirmed successfully!", booking: newBooking };
}

export async function getUserProfileAction(userId: string = "mockUserId") {
  console.log("Fetching profile for user:", userId);
  const profile = userProfiles[userId];
  if (profile) {
    return { success: true, profile };
  }
  return { success: false, message: "Profile not found." };
}

export async function updateUserProfileAction(userId: string = "mockUserId", profileData: Partial<any>) {
  console.log("Updating profile for user:", userId, "with data:", profileData);
  if (userProfiles[userId]) {
    userProfiles[userId] = { ...userProfiles[userId], ...profileData };
    console.log("Profile updated:", userProfiles[userId]);
    return { success: true, profile: userProfiles[userId] };
  }
  return { success: false, message: "Profile not found for update." };
}

export async function getMyTripsAction(userId: string = "mockUserId") {
  console.log("Fetching trips for user:", userId);
  const userBookings = bookings.filter(b => b.userId === userId && b.isConfirmed);
  // Add some mock past bookings for AI personalization demo
  const mockPastBookingsForDemo = [
    { id: 'past_1', userId: 'mockUserId', destination: 'Hotel Alpha', departureDate: '2023-01-15', preferredVehicle: 'suv', fullName: 'James T. Kirk', isConfirmed: true, allergiesOrRequests: 'Likes window seat', vehicleType: 'suv', temperature: '21C', musicGenre: 'Classical' },
    { id: 'past_2', userId: 'mockUserId', destination: 'Conference Center', departureDate: '2023-02-20', preferredVehicle: 'sedan', fullName: 'James T. Kirk', isConfirmed: true, allergiesOrRequests: '', vehicleType: 'sedan', temperature: '22C', musicGenre: 'Jazz' },
    { id: 'past_3', userId: 'mockUserId', destination: 'Gala Event', departureDate: '2023-03-10', preferredVehicle: 'limousine', fullName: 'James T. Kirk', isConfirmed: true, allergiesOrRequests: 'Quiet ride preferred', vehicleType: 'limousine', temperature: '20C', musicGenre: 'None' },
  ];
  
  // Combine actual bookings with mocks if needed for demo purposes or ensure AI has data
  // For this example, let's just return the "actual" (in-memory) bookings
  return { success: true, bookings: [...userBookings, ...mockPastBookingsForDemo.filter(b => !userBookings.find(ub => ub.id === b.id))] };
}
