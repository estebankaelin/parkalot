import { loadStripe, type Stripe } from '@stripe/stripe-js';

export type PaymentSheetResult =
  | { status: 'paid' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null> | undefined;

/** Stripe.js wird erst beim ersten Bezahlen geladen. */
function getStripe() {
  if (!publishableKey) return Promise.resolve(null);
  stripePromise ??= loadStripe(publishableKey, { locale: 'de' });
  return stripePromise;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration>,
  text?: string,
) {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  if (text) node.textContent = text;
  return node;
}

const buttonStyle: Partial<CSSStyleDeclaration> = {
  padding: '14px',
  borderRadius: '12px',
  border: 'none',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
};

/**
 * Browser-Vorschau: Stripe Payment Element als Overlay, als Ersatz für das Payment Sheet der App.
 * Weiterleitungen (z.B. TWINT) kehren auf die Buchungsseite zurück, die auf die Bestätigung wartet.
 */
export async function payWithPaymentSheet(
  clientSecret: string,
  bookingId: string,
): Promise<PaymentSheetResult> {
  const stripe = await getStripe();
  if (!stripe) return { status: 'error', message: 'Bezahlen ist in dieser Vorschau nicht eingerichtet.' };

  const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const backdrop = element('div', {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: '1000',
  });
  const sheet = element('div', {
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: '20px 16px 24px',
    borderRadius: '16px 16px 0 0',
    background: dark ? '#212225' : '#ffffff',
    color: dark ? '#ffffff' : '#000000',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  });
  const title = element('div', { fontSize: '18px', fontWeight: '600' }, 'Bezahlen');
  const mount = element('div', {});
  const message = element('div', { fontSize: '14px', color: '#e5484d' });
  const pay = element(
    'button',
    { ...buttonStyle, background: '#208AEF', color: '#ffffff' },
    'Jetzt bezahlen',
  );
  const cancel = element(
    'button',
    { ...buttonStyle, background: 'transparent', color: dark ? '#B0B4BA' : '#60646C' },
    'Abbrechen',
  );
  sheet.append(title, mount, message, pay, cancel);
  backdrop.append(sheet);
  document.body.append(backdrop);

  const elements = stripe.elements({
    clientSecret,
    appearance: { theme: dark ? 'night' : 'stripe' },
  });
  elements.create('payment').mount(mount);

  // Zurück auf /booking/<id>, relativ zur Checkout-Seite, damit es auch unter einem Unterpfad klappt.
  const returnUrl = new URL(`../booking/${bookingId}`, window.location.href).href;

  return new Promise<PaymentSheetResult>((resolve) => {
    const close = (result: PaymentSheetResult) => {
      backdrop.remove();
      resolve(result);
    };
    cancel.onclick = () => close({ status: 'cancelled' });
    pay.onclick = async () => {
      pay.disabled = true;
      pay.textContent = 'Zahlung läuft …';
      message.textContent = '';
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });
      if (!error) return close({ status: 'paid' });
      pay.disabled = false;
      pay.textContent = 'Jetzt bezahlen';
      message.textContent = error.message ?? 'Die Zahlung hat nicht geklappt.';
    };
  });
}
