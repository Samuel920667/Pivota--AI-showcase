import { Stack } from 'expo-router';
// Adjust "../context" to "../contexts" if your folder has an 's'
import { BankingProvider } from '../contexts/BankingContext'; 

export default function RootLayout() {
  return (
    <BankingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-money" options={{ presentation: 'modal' }} />
      </Stack>
    </BankingProvider>
  );
}