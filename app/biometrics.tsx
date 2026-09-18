import React, { useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform, ScrollView, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function BiometricsComingSoon() {
  const router = useRouter();

  // Animation Values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // 1. Pulse Animation (Continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Entrance Animation (Once)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backBtn}
            activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Animated Icon Group */}
        <Animated.View style={[styles.iconGroup, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.iconContainer}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.iconCircle}>
              <Ionicons name="finger-print-outline" size={64} color="#6A0DAD" />
            </View>
            {/* Small floating lock icon */}
            <View style={styles.floatingLock}>
               <Ionicons name="lock-closed" size={16} color="#FFF" />
            </View>
          </View>
        </Animated.View>

        {/* Badge */}
        <Animated.View style={[styles.badge, { opacity: fadeAnim }]}>
          <Text style={styles.badgeText}>COMING SOON</Text>
        </Animated.View>

        {/* Text Content */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.title}>Biometric Enclave</Text>
            <Text style={styles.description}>
            We are currently calibrating our <Text style={{fontWeight: '700', color: '#111827'}}>Advanced Liveness Detection</Text> engine. 
            Soon, you'll be able to authorize million-naira transfers with just a glance.
            </Text>
        </Animated.View>

        {/* Feature List */}
        <Animated.View style={[styles.featureList, { opacity: fadeAnim }]}>
          <FeatureRow icon="scan-outline" text="Zero-Latency Face Unlock" delay={100} />
          <FeatureRow icon="shield-checkmark-outline" text="Anti-Spoofing AI Surveillance" delay={200} />
          <FeatureRow icon="lock-closed-outline" text="Hardware-Backed KeyStore" delay={300} />
        </Animated.View>

        {/* Bottom Spacer for Scrolling */}
        <View style={{ height: 100 }} />

      </ScrollView>

      {/* FIXED FOOTER BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.back()}
            activeOpacity={0.8}
        >
        <Text style={styles.buttonText}>Return to Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Helper Component for Feature Rows
const FeatureRow = ({ icon, text, delay }: { icon: any, text: string, delay: number }) => {
    // simple fade in for rows
    const rowFade = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        Animated.timing(rowFade, {
            toValue: 1,
            duration: 500,
            delay: delay,
            useNativeDriver: true
        }).start();
    }, []);

    return (
        <Animated.View style={[styles.featureRow, { opacity: rowFade }]}>
            <View style={styles.checkCircle}>
                <Ionicons name={icon} size={20} color="#10B981" />
            </View>
            <Text style={styles.featureText}>{text}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 10,
    zIndex: 10
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#F3F4F6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // SCROLL CONTENT
  scrollContent: { 
    flexGrow: 1, 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 20
  },
  
  // Icon Styles
  iconGroup: {
      alignItems: 'center',
      marginBottom: 35,
      marginTop: 20
  },
  iconContainer: { 
    width: 120,
    height: 120,
    alignItems: 'center', 
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E8FF', // Light purple
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 4,
    borderColor: '#FFF', // White border creates "floating" effect
    shadowColor: "#6A0DAD",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10
  },
  pulseRing: { 
    position: 'absolute', 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    backgroundColor: '#F3E8FF',
    opacity: 0.4,
    zIndex: 1
  },
  floatingLock: {
      position: 'absolute',
      right: 10,
      top: 10,
      backgroundColor: '#10B981', // Green
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3,
      borderWidth: 2,
      borderColor: '#FFF'
  },

  // Typography & Badge
  badge: { 
    backgroundColor: '#111827', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 30, 
    marginBottom: 25 
  },
  badgeText: { 
    color: '#FFF', 
    fontSize: 11, 
    fontWeight: '800', 
    letterSpacing: 2 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#111827', 
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -1
  },
  description: { 
    textAlign: 'center', 
    color: '#6B7280', 
    fontSize: 16, 
    lineHeight: 26, 
    marginBottom: 40,
    maxWidth: '95%'
  },

  // Features
  featureList: { 
    width: '100%', 
    gap: 16 
  },
  featureRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    padding: 18, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  checkCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#DCFCE7', // Light green
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16
  },
  featureText: { 
    color: '#1F2937', 
    fontWeight: '700',
    fontSize: 15
  },

  // Fixed Footer
  footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 30 : 20,
      backgroundColor: '#FFF',
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6'
  },
  button: { 
    backgroundColor: '#111827', // Dark/Black theme
    width: '100%', 
    paddingVertical: 18, 
    borderRadius: 18, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  buttonText: { 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: 16 
  }
});
