import { StripeProvider } from '@stripe/stripe-react-native';
import type { ReactElement } from 'react';

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function PaymentsProvider({ children }: { children: ReactElement }) {
  if (!publishableKey) return children;
  return (
    <StripeProvider publishableKey={publishableKey} urlScheme="parkalot">
      {children}
    </StripeProvider>
  );
}
