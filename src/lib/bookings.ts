import { useSyncExternalStore } from "react";
import type { PropertyType } from "./stays";

export interface ConfirmedBooking {
  id: string; // Roam confirmation reference, e.g. "ROAM-8921"
  orderId: string; // Razorpay order id
  paymentId: string; // Razorpay payment id
  stayId: string;
  staySlug: string;
  stayTitle: string;
  stayType?: PropertyType;
  location: string;
  imageUrl: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  pricePerNight: number;
  cleaningFee: number;
  totalAmount: number; // in dollars / main currency
  currency: string;
  bookedAt: string;
}

const bookings: ConfirmedBooking[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function getBookingsSnapshot(): ConfirmedBooking[] {
  return bookings;
}

export function subscribeBookings(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function addBooking(booking: ConfirmedBooking): void {
  // Prevent duplicate additions for the same order
  if (bookings.some((b) => b.orderId === booking.orderId)) {
    return;
  }
  bookings.unshift(booking);
  notify();
}

export function clearBookings(): void {
  bookings.length = 0;
  notify();
}

export function useBookings(): ConfirmedBooking[] {
  return useSyncExternalStore(
    subscribeBookings,
    getBookingsSnapshot,
    () => [] as ConfirmedBooking[],
  );
}

