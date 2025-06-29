
"use server";

import type { BookingFormData, UserProfile as UserProfileType, Booking } from "./types";
import { query } from './db';
import { calculateAge } from '@/lib/utils'; // Ensure this is correctly imported

// Helper function to map database rows to UserProfileType
function dbToUserProfile(row: any): UserProfileType {
  if (!row) return null as any; // Explicitly handle null/undefined row
  return {
    id: row.id, // This will be the database-generated UUID
    firebaseUid: row.firebase_uid, // The Firebase UID
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
    userId: row.user_id, // This will be the users.id (UUID) from the users table
    fullName: row.passenger_full_name,
    dateOfBirth: row.passenger_date_of_birth ? new Date(row.passenger_date_of_birth).toISOString().split('T')[0] : "",
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

export async function createUserProfileInDbAction(
  userData: { uid: string; email?: string | null; displayName?: string | null, fetchOnly?: boolean }
) {
  const { uid: firebaseUid, email, displayName, fetchOnly } = userData; // uid here is the Firebase UID
  console.log("Attempting to create/fetch profile in DB for Firebase UID:", firebaseUid);

  try {
    // Check if user already exists by firebase_uid
    const checkUserSql = "SELECT * FROM users WHERE firebase_uid = $1;";
    const existingUserResult = await query(checkUserSql, [firebaseUid]);

    if (existingUserResult.rows.length > 0) {
      console.log("User profile already exists for Firebase UID:", firebaseUid);
      return { success: true, profile: dbToUserProfile(existingUserResult.rows[0]), message: "User profile already exists." };
    }
    
    if (fetchOnly) {
         return { success: false, message: "User profile not found and fetchOnly is true." };
    }

    const fullName = displayName || email?.split('@')[0] || 'New User';
    const contactDetails = email || 'Not specified';
    const dateOfBirth = '1970-01-01'; 

    const insertSql = `
      INSERT INTO users (firebase_uid, full_name, date_of_birth, contact_details, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *; 
    `;
    // id (UUID) will be auto-generated by the database
    const values = [firebaseUid, fullName, dateOfBirth, contactDetails];
    const result = await query(insertSql, values);

    if (result.rows.length > 0) {
      const newUserProfile = dbToUserProfile(result.rows[0]);
      console.log("New user profile created successfully in DB:", newUserProfile);
      return { success: true, profile: newUserProfile, message: "User profile created." };
    } else {
      console.error("User profile creation failed, no rows returned.");
      return { success: false, message: "Failed to create user profile in DB." };
    }
  } catch (error) {
    console.error("Error in createUserProfileInDbAction:", error);
    return { success: false, message: `Database error: ${(error as Error).message}` };
  }
}


export async function createBookingAction(bookingData: BookingFormData, firebaseUid?: string) {
  if (!firebaseUid) {
    return { success: false, message: "Firebase User ID is required to create a booking." };
  }
  console.log("Attempting to create booking with data:", bookingData, "for Firebase user:", firebaseUid);

  const age = calculateAge(bookingData.dateOfBirth);

  if (age < 18 && (!bookingData.guardianName || !bookingData.guardianContact)) {
    return { success: false, message: "Guardian details are required for passengers under 18." };
  }

  try {
    // Get the internal database user ID (UUID) using the firebaseUid
    const userQuery = await query("SELECT id FROM users WHERE firebase_uid = $1", [firebaseUid]);
    if (userQuery.rows.length === 0) {
      return { success: false, message: "User profile not found for the provided Firebase UID." };
    }
    const internalUserId = userQuery.rows[0].id; // This is the UUID from users.id

    const sql = `
      INSERT INTO bookings (
        user_id, passenger_full_name, passenger_date_of_birth, passenger_contact_details,
        guardian_name, guardian_contact, destination, departure_date,
        preferred_vehicle, allergies_or_requests, is_confirmed, age_at_booking
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *;
    `;

    const departureDateTime = new Date(bookingData.departureDate).toISOString();
    const passengerDobFormatted = new Date(bookingData.dateOfBirth).toISOString().split('T')[0];

    const values = [
      internalUserId, // Use the internal UUID
      bookingData.fullName, 
      passengerDobFormatted,
      bookingData.contactDetails, 
      bookingData.guardianName || null,
      bookingData.guardianContact || null,
      bookingData.destination,
      departureDateTime,
      bookingData.preferredVehicle,
      bookingData.allergiesOrRequests || null,
      true, 
      age   
    ];

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

export async function getUserProfileAction(firebaseUid?: string) {
  if (!firebaseUid) {
    return { success: false, message: "Firebase User ID is required to fetch profile." };
  }
  console.log("Fetching profile for Firebase user:", firebaseUid);
  const sql = "SELECT * FROM users WHERE firebase_uid = $1;";
  try {
    const result = await query(sql, [firebaseUid]);
    if (result.rows.length > 0) {
      const userProfile = dbToUserProfile(result.rows[0]);
      return { success: true, profile: userProfile };
    }
    return { success: false, message: "Profile not found for the given Firebase UID." };
  } catch (error) {
    console.error("Error fetching user profile from DB:", error);
    return { success: false, message: `Database error: ${(error as Error).message}` };
  }
}

export async function updateUserProfileAction(firebaseUid: string | undefined, profileData: Partial<UserProfileType>) {
   if (!firebaseUid) {
    return { success: false, message: "Firebase User ID is required to update profile." };
  }
  console.log("Updating profile for Firebase user:", firebaseUid, "with data:", profileData);

  const fieldsToUpdate: Partial<Record<string, any>> = {};
  if (profileData.fullName !== undefined) fieldsToUpdate.full_name = profileData.fullName;
  if (profileData.dateOfBirth !== undefined) fieldsToUpdate.date_of_birth = new Date(profileData.dateOfBirth).toISOString().split('T')[0];
  if (profileData.contactDetails !== undefined) fieldsToUpdate.contact_details = profileData.contactDetails;
  if (profileData.preferredVehicleType !== undefined) fieldsToUpdate.preferred_vehicle_type = profileData.preferredVehicleType;
  if (profileData.preferredTemperature !== undefined) fieldsToUpdate.preferred_temperature = profileData.preferredTemperature;
  if (profileData.preferredMusicGenre !== undefined) fieldsToUpdate.preferred_music_genre = profileData.preferredMusicGenre;
  
  // Do not allow updating firebase_uid or id via this action
  delete fieldsToUpdate.id;
  delete fieldsToUpdate.firebaseUid;


  if (Object.keys(fieldsToUpdate).length === 0) {
    const currentProfileResult = await getUserProfileAction(firebaseUid);
    return { success: true, message: "No changes to update.", profile: currentProfileResult.profile };
  }

  fieldsToUpdate.updated_at = new Date(); 

  const setClauses = Object.keys(fieldsToUpdate)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(", ");
  const values = Object.values(fieldsToUpdate);

  const sql = `UPDATE users SET ${setClauses} WHERE firebase_uid = $${values.length + 1} RETURNING *;`;

  try {
    const result = await query(sql, [...values, firebaseUid]);
    if (result.rows.length > 0) {
      const updatedProfile = dbToUserProfile(result.rows[0]);
      console.log("Profile updated in DB:", updatedProfile);
      return { success: true, profile: updatedProfile };
    }
    return { success: false, message: "Profile not found for update using Firebase UID." };
  } catch (error) {
    console.error("Error updating user profile in DB:", error);
    return { success: false, message: `Database error: ${(error as Error).message}` };
  }
}

export async function getMyTripsAction(firebaseUid?: string) {
   if (!firebaseUid) {
    return { success: false, message: "Firebase User ID is required to fetch trips." };
  }
  console.log("Fetching trips for Firebase user:", firebaseUid);
  
  try {
    // Get the internal database user ID (UUID) using the firebaseUid
    const userQuery = await query("SELECT id FROM users WHERE firebase_uid = $1", [firebaseUid]);
    if (userQuery.rows.length === 0) {
      // If no user profile, then no trips. This is not an error, just no data.
      return { success: true, bookings: [] };
    }
    const internalUserId = userQuery.rows[0].id; // This is the UUID from users.id

    const sql = "SELECT * FROM bookings WHERE user_id = $1 AND is_confirmed = TRUE ORDER BY departure_date DESC;";
    const result = await query(sql, [internalUserId]);
    const userBookings: Booking[] = result.rows.map(dbToBooking);
    return { success: true, bookings: userBookings };

  } catch (error) {
    console.error("Error fetching user trips from DB:", error);
    return { success: false, message: `Database error: ${(error as Error).message}` };
  }
}
    
