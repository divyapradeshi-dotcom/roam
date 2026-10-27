import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { posthog } from "./posthog";

// Default to development machine LAN IP for physical phone access, or localhost for web/desktop
const DEFAULT_BACKEND_URL =
  Platform.OS === "web" ? "http://localhost:5000" : "http://10.1.28.155:5000";

export const PAYMENT_BACKEND_URL =
  process.env.EXPO_PUBLIC_PAYMENT_BACKEND_URL || DEFAULT_BACKEND_URL;

export interface CreateOrderParams {
  staySlug: string;
  stayTitle: string;
  nights: number;
  pricePerNight: number;
  cleaningFee: number;
  guestName?: string;
  guestEmail?: string;
  clerkToken?: string | null;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  error?: string;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  clerkToken?: string | null;
}

export interface VerifyPaymentResponse {
  success: boolean;
  verifiedAt?: string;
  orderId?: string;
  paymentId?: string;
  error?: string;
}

export function calculateStayDates(nights: number): {
  checkInDate: string;
  checkOutDate: string;
  rangeText: string;
} {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1); // tomorrow
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + nights);

  const checkInStr = checkIn.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const checkOutStr = checkOut.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const yearStr = checkOut.getFullYear();

  return {
    checkInDate: `${checkInStr}, ${yearStr}`,
    checkOutDate: `${checkOutStr}, ${yearStr}`,
    rangeText: `${checkInStr} – ${checkOutStr}`,
  };
}

export async function createPaymentOrder(
  params: CreateOrderParams,
): Promise<CreateOrderResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (params.clerkToken) {
    headers.Authorization = `Bearer ${params.clerkToken}`;
  }

  const response = await fetch(`${PAYMENT_BACKEND_URL}/api/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      staySlug: params.staySlug,
      stayTitle: params.stayTitle,
      nights: params.nights,
      pricePerNight: params.pricePerNight,
      cleaningFee: params.cleaningFee,
      guestName: params.guestName,
      guestEmail: params.guestEmail,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to create order on server (Status ${response.status})`,
    );
  }

  return response.json();
}

export async function verifyPayment(
  params: VerifyPaymentParams,
): Promise<VerifyPaymentResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (params.clerkToken) {
    headers.Authorization = `Bearer ${params.clerkToken}`;
  }

  const response = await fetch(`${PAYMENT_BACKEND_URL}/api/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      razorpay_order_id: params.razorpay_order_id,
      razorpay_payment_id: params.razorpay_payment_id,
      razorpay_signature: params.razorpay_signature,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Payment signature verification failed.");
  }

  return response.json();
}

export type CheckoutResult =
  | { type: "success"; paymentId: string; orderId: string; signature: string }
  | { type: "cancel" }
  | { type: "error"; message: string };

export async function launchRazorpayCheckout({
  orderId,
  amount,
  currency,
  keyId,
  stayTitle,
  guestName = "Guest",
  guestEmail = "guest@roam.com",
}: {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  stayTitle: string;
  guestName?: string;
  guestEmail?: string;
}): Promise<CheckoutResult> {
  posthog?.capture("booking_checkout_opened", {
    order_id: orderId,
    amount,
    currency,
  });

  const checkoutUrl = `${PAYMENT_BACKEND_URL}/checkout?order_id=${encodeURIComponent(
    orderId,
  )}&key_id=${encodeURIComponent(keyId)}&amount=${encodeURIComponent(
    amount,
  )}&currency=${encodeURIComponent(currency)}&title=${encodeURIComponent(
    stayTitle,
  )}&name=${encodeURIComponent(guestName)}&email=${encodeURIComponent(guestEmail)}`;

  try {
    const authSessionResult = await WebBrowser.openAuthSessionAsync(
      checkoutUrl,
      "roam1://payment-callback",
    );

    if (authSessionResult.type === "success" && authSessionResult.url) {
      const parsedUrl = new URL(authSessionResult.url);
      const paymentId = parsedUrl.searchParams.get("razorpay_payment_id");
      const returnedOrderId = parsedUrl.searchParams.get("razorpay_order_id");
      const signature = parsedUrl.searchParams.get("razorpay_signature");
      const cancelled = parsedUrl.searchParams.get("cancelled");

      if (cancelled === "true") {
        posthog?.capture("booking_checkout_cancelled", { order_id: orderId });
        return { type: "cancel" };
      }

      if (paymentId && returnedOrderId && signature) {
        return {
          type: "success",
          paymentId,
          orderId: returnedOrderId,
          signature,
        };
      }
    }

    // If dismissed without returning callback
    posthog?.capture("booking_checkout_cancelled", { order_id: orderId });
    return { type: "cancel" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to launch checkout.";
    posthog?.capture("booking_checkout_failed", { order_id: orderId, error: message });
    return { type: "error", message };
  }
}

