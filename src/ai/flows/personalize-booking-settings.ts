'use server';

/**
 * @fileOverview A flow that personalizes booking settings based on past bookings.
 *
 * - personalizeBookingSettings - A function that handles the personalization of booking settings.
 * - PersonalizeBookingSettingsInput - The input type for the personalizeBookingSettings function.
 * - PersonalizeBookingSettingsOutput - The return type for the personalizeBookingSettings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizeBookingSettingsInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  pastBookings: z
    .string()
    .describe(
      'A string containing a JSON array of past booking objects, each including vehicle type, temperature, and music genre preferences.'
    ),
});
export type PersonalizeBookingSettingsInput = z.infer<
  typeof PersonalizeBookingSettingsInputSchema
>;

const PersonalizeBookingSettingsOutputSchema = z.object({
  preferredVehicleType: z
    .string()
    .describe('The user preferred vehicle type based on past bookings.'),
  preferredTemperature: z
    .string()
    .describe('The user preferred temperature based on past bookings.'),
  preferredMusicGenre: z
    .string()
    .describe('The user preferred music genre based on past bookings.'),
});
export type PersonalizeBookingSettingsOutput = z.infer<
  typeof PersonalizeBookingSettingsOutputSchema
>;

export async function personalizeBookingSettings(
  input: PersonalizeBookingSettingsInput
): Promise<PersonalizeBookingSettingsOutput> {
  return personalizeBookingSettingsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizeBookingSettingsPrompt',
  input: {schema: PersonalizeBookingSettingsInputSchema},
  output: {schema: PersonalizeBookingSettingsOutputSchema},
  prompt: `You are an AI assistant designed to personalize booking settings for users based on their past bookings.

  Analyze the user's past bookings to determine their preferred vehicle type, temperature, and music genre.
  Return the most frequently preferred settings.

  User ID: {{{userId}}}
  Past Bookings: {{{pastBookings}}}
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const personalizeBookingSettingsFlow = ai.defineFlow(
  {
    name: 'personalizeBookingSettingsFlow',
    inputSchema: PersonalizeBookingSettingsInputSchema,
    outputSchema: PersonalizeBookingSettingsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
