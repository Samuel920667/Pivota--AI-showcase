import React, { useState, useEffect, useRef } from 'react'; // Added useEffect and useRef
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function OTPVerification() {
  const [code, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const router = useRouter();
  const inputs = useRef<Array<TextInput | null>>([]);

  // Timer logic for the Resend button
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResendOTP = () => {
    setTimer(30);
    Alert.alert("Code Resent", "A new 4-digit code has been sent to your phone.");
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length === 4) {
      // In demo mode, any 4 digits work!
      router.replace('/(tabs)'); 
    } else {
      Alert.alert("Incomplete", "Please enter the 4-digit code.");
    }
  };

  const handleChangeText = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus move to next input
    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Verify Identity</Text>
        <Text style={styles.subtitle}>We sent a code to your device. Please enter it below to secure your account.</Text>

        <View style={styles.otpContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
                ref={(ref) => { inputs.current[index] = ref; }}              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
          <Text style={styles.verifyBtnText}>Verify & Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity disabled={timer > 0} onPress={handleResendOTP}>
          <Text style={[styles.resendText, { color: timer > 0 ? '#9CA3AF' : '#6A0DAD' }]}>
            {timer > 0 ? `Resend code in ${timer}s` : "Didn't get a code? Resend"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  backBtn: { padding: 20 },
  content: { paddingHorizontal: 30, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  otpContainer: { flexDirection: 'row', gap: 15, marginBottom: 40 },
  otpInput: { 
    width: 60, height: 65, borderRadius: 15, backgroundColor: '#F9FAFB', 
    textAlign: 'center', fontSize: 24, fontWeight: 'bold', borderWidth: 1.5, borderColor: '#E5E7EB' 
  },
  verifyBtn: { backgroundColor: '#6A0DAD', width: '100%', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  verifyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  resendText: { fontSize: 14, fontWeight: '600' }
});