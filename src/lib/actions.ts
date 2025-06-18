
"use server";

import type { BookingFormData, UserProfile as UserProfileType, Booking } from "./types";
import { query } from './db';
import { calculateAge } from '@/lib/utils'; // Ensure this is correctly imported

// Helper function to map database rows to UserProfileType
function dbToUserProfile(row: any): UserProfileType {
  if (!row) return null as any; // Explicitly handle null/undefined row
  return {
    id: row.id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth).toISOString().split('T')[0] : "", // Format as YYYY-MM-DD string
    contactDetails: row.contact_details,
    preferredVehicleType: row.preferred_vehicle_type,
    preferredTemperature: row.preferred_temperature,
    preferredMusicGenre: row.preferred_music_genre,
  };
}

// Helper function to map database rows to Booking
function dbToBooking(row: any): Booking {
   if (!row) return null as any; // Explicitly handle null/undefined row
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.passenger_full_name, // Passenger's full name for this booking
    dateOfBirth: row.passenger_date_of_birth ? new Date(row.passenger_date_of_birth).toISOString().split('T')[0] : "", // Format as YYYY-MM-DD
    contactDetails: row.passenger_contact_details,
    guardianName: row.guardian_name,
    guardianContact: row.guardian_contact,
    destination: row.destination,
    departureDate: row.departure_date ? new Date(row.departure_date).toISOString() : "",
    preferredVehicle: row.preferred_vehicle,
    allergiesOrRequests: row.allergies_or_requests,
    isConfirmed: row.is_confirmed,
    age: row.age_at_booking,
  };
}


export async function createBookingAction(bookingData: BookingFormData, userId: string = "mockUserId") {
  console.log("Attempting to create booking with data:", bookingData, "for user:", userId);

  const age = calculateAge(bookingData.dateOfBirth);

  if (age < 18 && (!bookingData.guardianName || !bookingData.guardianContact)) {
    return { success: false, message: "Guardian details are required for passengers under 18." };
  }

  // Ensure user exists before creating a booking, or handle this according to your app's logic
  // For now, we assume userId is valid and references an existing user in the 'users' table.

  const sql = `
    INSERT INTO bookings (
      user_id, passenger_full_name, passenger_date_of_birth, passenger_contact_details,
      guardian_name, guardian_contact, destination, departure_date,
      preferred_vehicle, allergies_or_requests, is_confirmed, age_at_booking
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    ) RETURNING *;
  `;

  // Ensure departureDate is in ISO format for TIMESTAMPTZ
  const departureDateTime = new Date(bookingData.departureDate).toISOString();
  // Ensure dateOfBirth is in YYYY-MM-DD for DATE
  const passengerDobFormatted = new Date(bookingData.dateOfBirth).toISOString().split('T')[0];


  const values = [
    userId,
    bookingData.fullName, // This is passenger_full_name for the booking
    passengerDobFormatted,
    bookingData.contactDetails, // This is passenger_contact_details
    bookingData.guardianName || null,
    bookingData.guardianContact || null,
    bookingData.destination,
    departureDateTime,
    bookingData.preferredVehicle,
    bookingData.allergiesOrRequests || null,
    true, // is_confirmed
    age   // age_at_booking
  ];

  try {
    const result = await query(sql, values);
    if (result.rows.length > 0) {
      const newBooking = dbToBooking(result.rows[0]);
      console.log("Booking created successfully in DB:", newBooking);
      return { success: true, message: "Booking confirmed successfully!", booking: newBooking };
    } else {
      console.error("Booking creation failed, no rows returned.");
      return { success: false, message: "Failed to create booking." };
    }
  } catch (error) {
    console.error("Error creating booking in DB:", error);
    return { success: false, message: `Database error: ${(error as Error).message}` };
  }
}

export async function getUserProfileAction(userId: string = "mockUserId") {
  console.log("Fetching profile for user:", userId);
  const sql = "SELECT * FROM users WHERE id = $1;";
  try {
    const result = await query(sql, [userId]);
    if (result.rows.length > 0) {
      const userProfile = dbToUserProfile(result.rows[0]);
      return { success: true, profile: userProfile };
    }
    return { success: false, message: "Profile not found." };
  } catch (error) {
    console.error("Error fetching user profile from DB:", error);
    return { success: false, message: `Database error: ${(error as Error).message}` };
  }
}

export async function updateUserProfileAction(userId: string = "mockUserId", profileData: Partial<UserProfileType>) {
  console.log("Updating profile for user:", userId, "with data:", profileData);

  const fieldsToUpdate: Partial<Record<keyof UserProfileType | string, any>> = {};
  if (profileData.fullName !== undefined) fieldsToUpdate.full_name = profileData.fullName;
  // Ensure dateOfBirth is in YYYY-MM-DD for DATE type in DB
  if (profileData.dateOfBirth !== undefined) fieldsToUpdate.date_of_birth = new Date(profileData.dateOfBirth).toISOString().split('T')[0];
  if (profileData.contactDetails !== undefined) fieldsToUpdate.contact_details = profileData.contactDetails;
  if (profileData.preferredVehicleType !== undefined) fieldsToUpdate.preferred_vehicle_type = profileData.preferredVehicleType;
  if (profileData.preferredTemperature !== undefined) fieldsToUpdate.preferred_temperature = profileData.preferredTemperature;
  if (profileData.preferredMusicGenre !== undefined) fieldsToUpdate.preferred_music_genre = profileData.preferredMusicGenre;
  
  if (Object.keys(fieldsToUpdate).length === 0) {
    return { success: true, message: "No changes to update.", profile: (await getUserProfileAction(userId)).profile };
  }

  fieldsToUpdate.updated_at = new Date(); // Explicitly set updated_at if not using DB trigger for it

  const setClauses = Object.keys(fieldsToUpdate)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(", ");
  const values = Object.values(fieldsToUpdate);

  const sql = `UPDATE users SET ${setClauses} WHERE id = $${values.length + 1} RETURNING *;`;

  try {
    const result = await query(sql, [...values, userId]);
    if (result.rows.length > 0) {
      const updatedProfile = dbToUserProfile(result.rows[0]);
      console.log("Profile updated in DB:", updatedProfile);
      return { success: true, profile: updatedProfile };
    }
    return { success: false, message: "Profile not found for update." };
  } catch (error) {
    console.error("Error updating user profile in DB:", error);
    return { success: false, message: `Database error: ${(error as Error).message}` };
  }
}

export async function getMyTripsAction(userId: string = "mockUserId") {
  console.log("Fetching trips for user:", userId);
  const sql = "SELECT * FROM bookings WHERE user_id = $1 AND is_confirmed = TRUE ORDER BY departure_date DESC;";
  let userBookings: Booking[] = [];

  try {
    const result = await query(sql, [userId]);
    userBookings = result.rows.map(dbToBooking);
  } catch (error) {
    console.error("Error fetching user trips from DB:", error);
    return { success: false, message: `Database error: ${(error as Error).message}` };
  }

  // The mock past bookings are for the AI personalization demo and are kept separate for now.
  // If these should also come from the DB, they'd need to be seeded or managed differently.
  const mockPastBookingsForDemo: Partial<Booking>[] = [ // Made Partial<Booking> to match potential structure
    { id: 'past_1', userId: 'mockUserId', destination: 'Hotel Alpha', departureDate: '2023-01-15T00:00:00.000Z', preferredVehicle: 'suv', fullName: 'James T. Kirk', isConfirmed: true, allergiesOrRequests: 'Likes window seat' },
    { id: 'past_2', userId: 'mockUserId', destination: 'Conference Center', departureDate: '2023-02-20T00:00:00.000Z', preferredVehicle: 'sedan', fullName: 'James T. Kirk', isConfirmed: true, allergiesOrRequests: '' },
    { id: 'past_3', userId: 'mockUserId', destination: 'Gala Event', departureDate: '2023-03-10T00:00:00.000Z', preferredVehicle: 'limousine', fullName: 'James T. Kirk', isConfirmed: true, allergiesOrRequests: 'Quiet ride preferred' },
  ];
  
  // Combine actual bookings with mocks if needed for demo purposes.
  // Filtering to avoid duplicates if mocks overlap with actual trip IDs (unlikely with UUIDs but good practice).
  const combinedBookings = [
    ...userBookings,
    ...mockPastBookingsForDemo.filter(b => !userBookings.find(ub => ub.id === b.id)) as Booking[] // Cast as Booking[]
  ];
  
  return { success: true, bookings: combinedBookings };
}
    