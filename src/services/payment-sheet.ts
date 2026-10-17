export type PaymentSheetResult =
  | { status: 'paid' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/** Das Stripe-SDK gibt es nur in der App, nicht in der Browser-Vorschau. */
export async function payWithPaymentSheet(_clientSecret: string): Promise<PaymentSheetResult> {
  return { status: 'error', message: 'Bezahlen geht nur in der App, nicht im Browser.' };
}
