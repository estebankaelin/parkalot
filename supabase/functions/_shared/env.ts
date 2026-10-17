import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@23';

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Umgebungsvariable ${name} fehlt`);
  return value;
}

/** SUPABASE_PUBLISHABLE_KEYS und SUPABASE_SECRET_KEYS sind JSON-Objekte, wir nehmen "default". */
function defaultKey(name: string): string {
  return JSON.parse(required(name)).default;
}

export function userClient(authorization: string) {
  return createClient(required('SUPABASE_URL'), defaultKey('SUPABASE_PUBLISHABLE_KEYS'), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
}

/** Umgeht Row Level Security, nur serverseitig verwenden. */
export function adminClient() {
  return createClient(required('SUPABASE_URL'), defaultKey('SUPABASE_SECRET_KEYS'), {
    auth: { persistSession: false },
  });
}

export const stripe = new Stripe(required('STRIPE_SECRET_KEY'), {
  httpClient: Stripe.createFetchHttpClient(),
});

export const stripeWebhookSecret = () => required('STRIPE_WEBHOOK_SECRET');
