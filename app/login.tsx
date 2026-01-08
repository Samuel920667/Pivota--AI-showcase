import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert 
} from 'react-native';
import { Colors } from '../constants/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState(''); 
  const router = useRouter();

  const handleAuth = () => {
    if (isLogin) {
      router.replace('/(tabs)' as any);
    } else {
      router.push('/otp-verification' as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.logo}>Pivota</Text>
            <Text style={styles.welcomeTitle}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.subtitle}>Secure banking for the modern Nigerian</Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput style={styles.input} placeholder="John Doe" />
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="08012345678" 
                    keyboardType="phone-pad" 
                    onChangeText={setPhone}
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>BVN or NIN</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="222XXXXXXXX" 
                    keyboardType="number-pad" 
                    maxLength={11}
                    onChangeText={setIdNumber}
                  />
                </View>
              </>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput style={styles.input} placeholder="name@example.com" keyboardType="email-address" />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput style={styles.input} placeholder="Min. 8 characters" secureTextEntry />
              {isLogin && (
                <TouchableOpacity 
                  onPress={() => Alert.alert("Reset Password", "A reset link has been sent to your email.")}
                  style={{ alignSelf: 'flex-end', marginTop: 5 }}
                >
                  <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth}>
              <Text style={styles.primaryBtnText}>{isLogin ? 'Sign In' : 'Get Started'}</Text>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity style={styles.biometricBtn} onPress={() => Alert.alert("Biometrics", "Authenticate with FaceID/Fingerprint")}>
                <Ionicons name="finger-print" size={28} color={Colors.primary} />
                <Text style={styles.biometricText}>Login with Biometrics</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Text style={{ color: Colors.primary, fontWeight: '700' }}>
                  {isLogin ? 'Sign Up' : 'Log In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 30, flexGrow: 1, justifyContent: 'center' },
  headerSection: { marginBottom: 30 },
  logo: { fontSize: 32, fontWeight: '900', color: Colors.primary, marginBottom: 10 },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 5 },
  form: { gap: 15 },
  inputWrapper: { gap: 5 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', padding: 14, borderRadius: 14, fontSize: 15 },
  primaryBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  toggleBtn: { alignItems: 'center', marginTop: 10 },
  toggleText: { color: '#6B7280', fontSize: 14 },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10
  },
  biometricText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14
  },
});