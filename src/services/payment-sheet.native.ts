import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

import type { PaymentSheetResult } from '@/services/payment-sheet';

/** Zeigt das Stripe Payment Sheet (Karte, Apple Pay, Google Pay, TWINT). */
export async function payWithPaymentSheet(clientSecret: string): Promise<PaymentSheetResult> {
  const init = await initPaymentSheet({
    merchantDisplayName: 'parkalot',
    paymentIntentClientSecret: clientSecret,
    // TWINT leitet zur TWINT-App weiter und kommt über diese URL zurück.
    returnURL: 'parkalot://stripe-redirect',
  });
  if (init.error) return { status: 'error', message: init.error.message };

  const result = await presentPaymentSheet();
  if (!result.error) return { status: 'paid' };
  if (result.error.code === 'Canceled') return { status: 'cancelled' };
  return { status: 'error', message: result.error.message };
}
