import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import API from '../api/api'; 

export default function AuthScreen() {
  const { login, isLoading } = useAuth();
  
  // Modes: "login" or "signup"
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState(1); 
  const totalSteps = 5;
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false); 

  // --- FORM DATA ---
  const [loginInput, setLoginInput] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nin, setNin] = useState('');
  const [bvn, setBvn] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');

  const clearError = () => setFieldError(null);

  // --- 1. HANDLE LOGIN ---
  const handleLogin = async () => {
    clearError();
    if (!loginInput.trim() || !loginPass.trim()) {
      return setFieldError("Please enter your credentials");
    }

    try {
      // Calls the login function from AuthContext
      await login(loginInput, loginPass);
    } catch (error: any) {
      console.log("❌ UI Login Error:", error);
      const msg = error.response?.data?.error || "Login failed. Please check your credentials.";
      setFieldError(msg);
    }
  };

  // --- WIZARD NAVIGATION ---
  const nextStep = () => {
    clearError();
    if (step === 1) { 
        if (!firstName.trim() || !lastName.trim()) return setFieldError("Names are required");
        setStep(2);
    } else if (step === 2) { 
        if (!email.includes('@') || phone.length < 10) return setFieldError("Invalid contact details");
        setStep(3);
    } else if (step === 3) { 
        if (nin.length > 0 && nin.length !== 11) return setFieldError("NIN must be 11 digits");
        if (bvn.length > 0 && bvn.length !== 11) return setFieldError("BVN must be 11 digits");
        setStep(4);
    } else if (step === 4) { 
        if (password.length < 6) return setFieldError("Password min 6 chars");
        setStep(5);
    }
  };

  const prevStep = () => { clearError(); setStep(step - 1); };

  // --- 2. HANDLE DIRECT SIGNUP ---
  const handleDirectSignup = async () => {
    if (pin.length !== 4) return setFieldError("PIN must be exactly 4 digits");

    setLocalLoading(true);
    setFieldError(null);

    try {
        console.log("🔵 UI: Attempting Direct Register...");
        
        // ✅ FIXED: Added '/api/auth' prefix to match backend
        await API.post('/api/auth/register', {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone_number: phone,
            password: password,
            transaction_pin: pin,
            nin: nin,
            bvn: bvn
        });

        console.log("✅ UI: Account Created. Auto-logging in...");
        Alert.alert("Success", "Account created successfully!");

        // Auto Login
        await login(email, password);

    } catch (error: any) {
        console.log("❌ UI Signup Error:", error);
        const msg = error.response?.data?.error || "Connection Failed. Check Server.";
        setFieldError(msg);
        Alert.alert("Error", msg);
    } finally {
        setLocalLoading(false);
    }
  };

  const progressWidth = (step / totalSteps) * 100;
  const isBusy = isLoading || localLoading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.title}>
                {mode === 'login' ? 'Log into your account' : 'Create Account'}
            </Text>
            <Text style={styles.subtitle}>
                {mode === 'login' ? 'Enter your details below' : 'Follow the steps to get started'}
            </Text>

            {mode === 'signup' && (
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progressWidth}%` }]} />
                </View>
            )}
          </View>

          {/* ================= LOGIN FORM ================= */}
          {mode === 'login' && (
            <>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Enter your Mobile No. / Email</Text>
                    <TextInput 
                        style={[styles.input, fieldError && styles.inputError]} 
                        placeholder="e.g. 08012345678" 
                        value={loginInput} 
                        onChangeText={(t) => {setLoginInput(t); clearError();}} 
                        autoCapitalize="none"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput 
                        style={[styles.input, fieldError && styles.inputError]} 
                        placeholder="Enter password" 
                        value={loginPass} 
                        onChangeText={(t) => {setLoginPass(t); clearError();}} 
                        secureTextEntry
                        placeholderTextColor="#9CA3AF"
                    />
                    {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
                </View>

                <TouchableOpacity 
                    style={[styles.primaryBtn, isBusy && {opacity: 0.7}]} 
                    onPress={handleLogin}
                    disabled={isBusy}
                >
                    {isBusy ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Sign In</Text>}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>You don't have one? </Text>
                    <TouchableOpacity onPress={() => {setMode('signup'); setStep(1); clearError();}}>
                        <Text style={styles.link}>Create Account</Text>
                    </TouchableOpacity>
                </View>
            </>
          )}

          {/* ================= SIGNUP WIZARD ================= */}
          {mode === 'signup' && (
            <>
                {step === 1 && (
                    <View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>First Name</Text>
                            <TextInput style={styles.input} placeholder="e.g. John" value={firstName} onChangeText={setFirstName}/>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Last Name</Text>
                            <TextInput style={styles.input} placeholder="e.g. Doe" value={lastName} onChangeText={setLastName}/>
                        </View>
                    </View>
                )}
                {step === 2 && (
                    <View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput style={styles.input} placeholder="john@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput style={styles.input} placeholder="080..." value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
                        </View>
                    </View>
                )}
                {step === 3 && (
                    <View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>NIN (National ID)</Text>
                            <TextInput style={styles.input} placeholder="11-digit NIN" value={nin} onChangeText={(t) => setNin(t.replace(/[^0-9]/g, ''))} maxLength={11} keyboardType="number-pad"/>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>BVN (Bank Verification)</Text>
                            <TextInput style={styles.input} placeholder="11-digit BVN" value={bvn} onChangeText={(t) => setBvn(t.replace(/[^0-9]/g, ''))} maxLength={11} keyboardType="number-pad"/>
                        </View>
                        <View style={styles.infoBox}>
                            <Ionicons name="lock-closed" size={14} color="#6A0DAD" />
                            <Text style={styles.infoText}>Your identity is encrypted and secure.</Text>
                        </View>
                    </View>
                )}
                {step === 4 && (
                    <View>
                         <View style={styles.inputGroup}>
                            <Text style={styles.label}>Create Password</Text>
                            <TextInput style={styles.input} placeholder="Min 6 characters" value={password} onChangeText={setPassword} secureTextEntry/>
                        </View>
                    </View>
                )}
                {step === 5 && (
                    <View>
                         <View style={styles.inputGroup}>
                            <Text style={styles.label}>Create Transaction PIN</Text>
                            <TextInput 
                                style={[styles.input, {textAlign: 'center', fontSize: 24, letterSpacing: 10, color: '#6A0DAD', fontWeight: 'bold'}]} 
                                placeholder="****" 
                                value={pin} 
                                onChangeText={(t) => setPin(t.replace(/[^0-9]/g, ''))} 
                                secureTextEntry keyboardType="numeric" maxLength={4}
                            />
                        </View>
                    </View>
                )}

                {fieldError && (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                        <Text style={styles.errorText}>{fieldError}</Text>
                    </View>
                )}

                <View style={styles.wizardNav}>
                    {step > 1 ? (
                        <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.backBtn} onPress={() => setMode('login')}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    )}

                    {step < 5 ? (
                         <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                            <Text style={styles.btnText}>Next</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                         </TouchableOpacity>
                    ) : (
                         <TouchableOpacity 
                            style={[styles.finishBtn, isBusy && {opacity: 0.7}]} 
                            onPress={handleDirectSignup}
                            disabled={isBusy}
                         >
                            {isBusy ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Create Account</Text>}
                         </TouchableOpacity>
                    )}
                </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  progressContainer: { height: 6, backgroundColor: '#F3E8FF', borderRadius: 10, marginTop: 20, width: '100%', overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#6A0DAD', borderRadius: 10 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#6A0DAD', borderRadius: 12, padding: 16, fontSize: 16, color: '#1A1A1A' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F3E8FF', padding: 10, borderRadius: 8, marginTop: -10, marginBottom: 10 },
  infoText: { color: '#6A0DAD', fontSize: 12, fontWeight: '600' },
  errorBox: { flexDirection: 'row', alignItems: 'center', marginTop: -10, marginBottom: 20, gap: 5 },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#6A0DAD', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  wizardNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 },
  backBtn: { padding: 10 },
  cancelText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  nextBtn: { backgroundColor: '#6A0DAD', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 10 },
  finishBtn: { backgroundColor: '#6A0DAD', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', gap: 10, flex: 1, marginLeft: 20 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#6B7280', fontSize: 14 },
  link: { color: '#6A0DAD', fontSize: 14, fontWeight: '800' },
});