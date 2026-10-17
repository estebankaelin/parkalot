import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { BookingsProvider } from '@/state/bookings';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <BookingsProvider>
        <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="index" options={{ title: 'parkalot' }} />
          <Stack.Screen name="spot/[id]" options={{ title: 'Parkplatz' }} />
          <Stack.Screen name="checkout/[id]" options={{ title: 'Buchen' }} />
          <Stack.Screen
            name="booking/[id]"
            options={{ title: 'Gebucht', headerBackVisible: false, gestureEnabled: false }}
          />
        </Stack>
      </BookingsProvider>
    </ThemeProvider>
  );
}
