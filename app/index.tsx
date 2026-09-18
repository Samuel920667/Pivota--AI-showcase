import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

// 1. Path to your logo image
const LogoImg = require('../assets/images/images/logo.png');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start invisible

  useEffect(() => {
    // 2. The Animation Sequence
    Animated.sequence([
      // Smooth fade in over 1.5 seconds
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Hold the image on screen for 2 seconds
      Animated.delay(2000),
    ]).start(() => {
      // 3. Move to the Login form ONLY after animation finishes
      router.replace('/login');
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Ensure the status bar matches the white background */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image 
          source={LogoImg} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 300,  // Large display
    height: 300,
  },
}); 