// Empfängt Stripe-Ereignisse und bestätigt oder storniert die zugehörige Buchung.
// Im Stripe-Dashboard auf payment_intent.succeeded, payment_intent.payment_failed und
// payment_intent.canceled abonnieren.
import Stripe from 'npm:stripe@23';

import { adminClient, stripe, stripeWebhookSecret } from '../_shared/env.ts';
import { json } from '../_shared/http.ts';

const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return json({ error: 'Signatur fehlt' }, 400);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      stripeWebhookSecret(),
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error('Ungültige Webhook-Signatur', err);
    return json({ error: 'Ungültige Signatur' }, 400);
  }

  const db = adminClient();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const { data: confirmed, error } = await db.rpc('confirm_booking', {
        p_payment_intent_id: paymentIntent.id,
      });
      if (error) {
        console.error('confirm_booking', error);
        return json({ error: 'Bestätigung fehlgeschlagen' }, 500);
      }
      if (!confirmed) {
        // Reservation war abgelaufen und die Tage sind wieder frei: Geld zurück.
        await stripe.refunds.create(
          { payment_intent: paymentIntent.id },
          { idempotencyKey: `refund-${paymentIntent.id}` },
        );
      }
      break;
    }
    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled': {
      const { error } = await db.rpc('cancel_booking_for_payment', {
        p_payment_intent_id: event.data.object.id,
      });
      if (error) {
        console.error('cancel_booking_for_payment', error);
        return json({ error: 'Stornierung fehlgeschlagen' }, 500);
      }
      break;
    }
  }

  return json({ received: true });
});
