export const VEHICLE_TYPES = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van" },
  { value: "limousine", label: "Limousine" },
  { value: "luxury_bus", label: "Luxury Bus" },
];

export const BOOKING_FORM_STEPS = [
  { id: 1, name: 'Personal Info', fields: ['fullName', 'dateOfBirth', 'contactDetails', 'guardianName', 'guardianContact'] },
  { id: 2, name: 'Trip Details', fields: ['destination', 'departureDate', 'preferredVehicle'] },
  { id: 3, name: 'Special Requests', fields: ['allergiesOrRequests'] },
  { id: 4, name: 'Review & Confirm' },
];

export const MIN_AGE = 18;
