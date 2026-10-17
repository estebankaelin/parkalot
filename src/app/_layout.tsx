import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { PaymentsProvider } from '@/components/payments-provider';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PaymentsProvider>
        <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="index" options={{ title: 'parkalot' }} />
          <Stack.Screen name="spot/[id]" options={{ title: 'Parkplatz' }} />
          <Stack.Screen name="checkout/[id]" options={{ title: 'Buchen' }} />
          <Stack.Screen
            name="booking/[id]"
            options={{ title: 'Gebucht', headerBackVisible: false, gestureEnabled: false }}
          />
        </Stack>
      </PaymentsProvider>
    </ThemeProvider>
  );
}
