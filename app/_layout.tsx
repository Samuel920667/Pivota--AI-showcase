import { Stack, useRouter, useSegments, useRootNavigationState, Slot } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../context/AuthContext'; 
import { BankingProvider } from '../context/BankingContext'; 

// ✅ FIX: Keep the splash screen visible while we fetch resources
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  // Ignore error if already hidden
}

const RootLayoutNav = () => {
  const { userToken, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // 1. Wait for Navigation to be ready
    if (isLoading) return;
    if (!rootNavigationState?.key) return;

    // 2. Identify Current Route (Safely)
    const currentRoute = segments?.[0] || 'login'; 

    // 3. Define Public Routes
    const publicRoutes = ['login', 'signup', 'forgot-password', 'onboarding'];
    const isPublicRoute = publicRoutes.includes(currentRoute);

    // 4. Redirect Logic
    if (!userToken && !isPublicRoute) {
      // 🔴 Not Logged In -> Go to Login
      router.replace('/login');
    } else if (userToken && isPublicRoute) {
      // 🟢 Logged In -> Go to Dashboard
      router.replace('/(tabs)');
    }
    
    // Note: We removed SplashScreen.hideAsync() from here to prevent the race condition error.
    // It is now handled in the RootLayout component below.

  }, [userToken, isLoading, segments, rootNavigationState]);

  // Loading Indicator (Shown while checking token)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
        <ActivityIndicator size="large" color="#6A0DAD" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="login">
      {/* Auth Screens */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="otp-verification" options={{ headerShown: false }} />
      
      {/* Main App */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* Features */}
      <Stack.Screen name="chatbot" options={{ presentation: 'modal' }} />
      
      {/* ✅ FIX: Renamed from 'fraud-map' to 'fraud-heatmap' to match your file name */}
      <Stack.Screen name="fraud-heatmap" options={{ title: 'Fraud Heatmap', headerShown: true }} />
      
      <Stack.Screen name="send" />
      <Stack.Screen name="request" />
      <Stack.Screen name="accept-request" />
      <Stack.Screen name="split" />
      <Stack.Screen name="add-money" />
      
      {/* Utils */}
      <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
      <Stack.Screen name="transaction-details" options={{ presentation: 'modal' }} />
      <Stack.Screen name="transactions" options={{ headerShown: true, title: 'History' }} />
    </Stack>
  );
};

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Artificially wait a moment to ensure fonts/auth load smoothly
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // ✅ FIX: This callback triggers when the Root View is laid out
  // This is the ONLY safe place to hide the Splash Screen
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <BankingProvider>
          <RootLayoutNav />
        </BankingProvider>
      </AuthProvider>
    </View>
  );
}