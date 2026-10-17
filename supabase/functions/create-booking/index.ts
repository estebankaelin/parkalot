// Legt eine ausstehende Buchung an und erstellt dazu die Stripe-Zahlung.
// Die App zeigt danach das Stripe Payment Sheet mit dem zurückgegebenen clientSecret.
import { adminClient, stripe, userClient } from '../_shared/env.ts';
import { corsHeaders, json } from '../_shared/http.ts';

type Body = { spotId?: string; days?: string[]; licensePlate?: string };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const PLATE = /^[A-Z]{2} \d{1,6}$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Nur POST' }, 405);

  const authorization = req.headers.get('Authorization');
  if (!authorization) return json({ error: 'Nicht angemeldet' }, 401);

  const body = (await req.json().catch(() => ({}))) as Body;
  const days = Array.isArray(body.days) ? body.days.filter((d) => DAY.test(d)) : [];
  if (!body.spotId || days.length === 0 || !body.licensePlate || !PLATE.test(body.licensePlate)) {
    return json({ error: 'Ungültige Buchungsdaten' }, 400);
  }

  const { data: booking, error } = await userClient(authorization)
    .rpc('create_pending_booking', {
      p_spot_id: body.spotId,
      p_days: days,
      p_license_plate: body.licensePlate,
    })
    .single<{ id: string; total_rappen: number }>();

  if (error) {
    if (error.code === '23P01') return json({ error: error.message }, 409);
    if (error.code === '28000') return json({ error: error.message }, 401);
    if (error.code === 'P0002') return json({ error: error.message }, 404);
    console.error('create_pending_booking', error);
    return json({ error: 'Buchung fehlgeschlagen' }, 500);
  }

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: booking.total_rappen,
      currency: 'chf',
      automatic_payment_methods: { enabled: true },
      metadata: { booking_id: booking.id },
    },
    { idempotencyKey: `booking-${booking.id}` },
  );

  const { error: updateError } = await adminClient()
    .from('bookings')
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq('id', booking.id);
  if (updateError) {
    console.error('stripe_payment_intent_id speichern', updateError);
    await stripe.paymentIntents.cancel(paymentIntent.id);
    return json({ error: 'Buchung fehlgeschlagen' }, 500);
  }

  return json({ bookingId: booking.id, clientSecret: paymentIntent.client_secret });
});
