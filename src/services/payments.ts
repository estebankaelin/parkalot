import type { PriceQuote } from '@/domain/types';

export type PaymentResult = { ok: true; reference: string } | { ok: false; message: string };

export type PaymentService = {
  /** Zeigt dem Mieter das Zahlungsformular und belastet den Betrag. */
  pay(quote: PriceQuote): Promise<PaymentResult>;
  /** Wird im UI angezeigt, solange keine echte Zahlung angebunden ist. */
  isTestMode: boolean;
};

/**
 * Platzhalter bis Stripe angebunden ist. Die echte Zahlung braucht ein Backend,
 * das den PaymentIntent erstellt, und das Stripe-Konto von parkalot.
 */
export const testPaymentService: PaymentService = {
  isTestMode: true,
  async pay() {
    return { ok: true, reference: `test_${Date.now().toString(36)}` };
  },
};
