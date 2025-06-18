"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { BookingFormData, BookingContextType } from '@/lib/types';
import { BOOKING_FORM_STEPS } from '@/lib/constants';

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = BOOKING_FORM_STEPS.length;

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return (
    <BookingContext.Provider value={{ formData, updateFormData, currentStep, setCurrentStep, totalSteps }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingContext = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return context;
};
