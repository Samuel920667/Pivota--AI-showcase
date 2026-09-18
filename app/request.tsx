import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Modal, Keyboard, Vibration, Alert,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import API from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function RequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userInfo } = useAuth();

  // --- DATA STATE ---
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  
  // --- UI STATE ---
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [sending, setSending] = useState(false);
  
  // --- FLOW STATE ---
  const [step, setStep] = useState(1); // 1 = Form, 2 = PIN, 3 = Success
  const [pin, setPin] = useState("");

  // --- 0. GET LOCATION (For Heatmap Verification) ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
    })();
  }, []);

  // --- 1. SEARCH USERS ---
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    // Reset selection if user types again
    if (selectedPerson && text !== `${selectedPerson.first_name} ${selectedPerson.last_name}`) {
        setSelectedPerson(null);
    }
    
    if (text.length < 3) {
        setSearchResults([]);
        return;
    }

    setLoadingSearch(true);
    try {
        let token = await AsyncStorage.getItem('userToken');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Use the lookup endpoint
        const res = await API.get(`/api/transactions/lookup/${text}`, config);
        
        const results = Array.isArray(res.data) ? res.data : [res.data];
        
        // 🛑 FILTER OUT SELF (Cannot request from myself)
        const filtered = results.filter((u: any) => u.id !== userInfo?.id);
        
        setSearchResults(filtered);
    } catch (error) {
        console.log("Search Error:", error);
    } finally {
        setLoadingSearch(false);
    }
  };

  const selectUser = (user: any) => {
      Keyboard.dismiss();
      const displayName = `${user.first_name} ${user.last_name}`;
      setSearchQuery(displayName);
      setSelectedPerson(user);
      setSearchResults([]);
  };

  // --- 2. VALIDATION & REVIEW ---
  const handleReview = () => {
    // Strict Validation
    if (!selectedPerson) {
        return Alert.alert("Required", "Please search and select a recipient.");
    }
    if (selectedPerson.id === userInfo?.id) {
        return Alert.alert("Error", "You cannot request money from yourself.");
    }
    if (!amount || parseFloat(amount) <= 0) {
        return Alert.alert("Required", "Please enter a valid amount.");
    }
    if (!description.trim()) {
        return Alert.alert("Required", "Please enter a reason for this request.");
    }
    
    // Proceed to PIN Step
    setPin("");
    setStep(2);
  };

  // --- 3. FINAL SUBMIT (WITH PIN & LOCATION) ---
  const handleFinalSubmit = async () => {
    if (pin.length !== 4) {
        Vibration.vibrate();
        return Alert.alert("Invalid PIN", "Enter valid 4-digit PIN");
    }

    setSending(true);

    try {
        let token = await AsyncStorage.getItem('userToken');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Call the Request Endpoint
        await API.post('/api/transactions/request', {
            initiatorId: userInfo?.id,
            targetUserId: selectedPerson.id,
            amount: parseFloat(amount),
            description: description.trim(),
            pin: pin,
            lat: location?.lat || 0, // Send location for Heatmap check
            lon: location?.lon || 0
        }, config);

        setStep(3); // Show Success Modal

    } catch (error: any) {
        console.log("Request Error:", error);
        Alert.alert("Request Failed", error.response?.data?.error || "Transaction Failed");
        setStep(1); // Go back to start on failure
    } finally {
        setSending(false);
    }
  };

  return (
    // ✅ FIX 1: Wrap Main Screen in KeyboardAvoidingView
    <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
    >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar style="dark" backgroundColor="#FFF" />

                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="close" size={28} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Request Money</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    
                    {/* RECIPIENT SEARCH */}
                    <Text style={styles.label}>Who owes you money?</Text>
                    <View style={styles.searchSection}>
                        <View style={styles.inputWrapper}>
                            <TextInput 
                                style={styles.input}
                                placeholder="Search Name, Wallet ID..."
                                value={searchQuery}
                                onChangeText={handleSearch}
                                autoCapitalize="none"
                                placeholderTextColor="#9CA3AF"
                            />
                            {loadingSearch && <ActivityIndicator style={styles.inputIcon} size="small" color="#6A0DAD" />}
                        </View>

                        {/* RESULTS DROPDOWN */}
                        {searchResults.length > 0 && (
                            <View style={styles.resultsList}>
                                {searchResults.map((user, index) => (
                                    <TouchableOpacity key={index} style={styles.resultItem} onPress={() => selectUser(user)}>
                                        <View style={styles.avatarCircle}><Text style={styles.avatarText}>{user.first_name[0]}</Text></View>
                                        <View>
                                            <Text style={styles.resultName}>{user.first_name} {user.last_name}</Text>
                                            <Text style={styles.resultId}>@{user.wallet_id}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* VERIFIED USER CARD (Shown after selection) */}
                    {selectedPerson && (
                        <View style={[styles.riskCard, { borderLeftColor: '#10B981' }]}>
                            <View style={styles.riskHeader}>
                                <View>
                                    <Text style={styles.riskUser}>{selectedPerson.first_name} {selectedPerson.last_name}</Text>
                                    <Text style={styles.riskBank}>@{selectedPerson.wallet_id}</Text>
                                </View>
                                <View style={[styles.riskBadge, { backgroundColor: '#DCFCE7' }]}>
                                    <Text style={[styles.riskBadgeText, { color: '#166534' }]}>Verified</Text>
                                </View>
                            </View>
                            
                            <TouchableOpacity style={styles.heatmapLink} onPress={() => router.push('/fraud-map')}>
                                <Ionicons name="map-outline" size={14} color="#6A0DAD" />
                                <Text style={styles.heatmapText}>Check Fraud Heatmap</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* AMOUNT INPUT */}
                    <Text style={[styles.label, { marginTop: 25 }]}>Amount (₦)</Text>
                    <TextInput
                        style={[styles.input, { fontSize: 24, fontWeight: '700', height: 60 }]}
                        placeholder="0.00"
                        placeholderTextColor="#C0C0C0"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
                    />

                    {/* REASON INPUT */}
                    <Text style={[styles.label, { marginTop: 25 }]}>Reason <Text style={{color: '#EF4444'}}>*</Text></Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 15 }]}
                        placeholder="E.g., Dinner split, Urgent help..."
                        placeholderTextColor="#9CA3AF"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />

                    {/* CONTINUE BUTTON */}
                    <TouchableOpacity 
                        style={[styles.continueBtn, (!amount || !selectedPerson || !description.trim()) && { opacity: 0.6 }]} 
                        onPress={handleReview}
                        disabled={!amount || !selectedPerson || !description.trim()}
                    >
                        <Text style={styles.btnText}>Continue</Text>
                    </TouchableOpacity>

                </ScrollView>

                {/* --- CONFIRMATION & PIN MODAL --- */}
                <Modal visible={step === 2} transparent animationType="slide" statusBarTranslucent>
                    {/* ✅ FIX 2: KeyboardAvoidingView INSIDE Modal for PIN Input */}
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                        style={{ flex: 1 }}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.bottomSheet}>
                                <View style={styles.dragHandle} />
                                <Text style={styles.sheetTitle}>Confirm Request</Text>
                                
                                {/* Summary Box */}
                                <View style={styles.summaryBox}>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Requesting</Text>
                                        <Text style={styles.summaryValue}>₦{Number(amount).toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>From</Text>
                                        <Text style={styles.summaryValue}>{selectedPerson?.first_name} {selectedPerson?.last_name}</Text>
                                    </View>
                                    <View style={[styles.summaryRow, {borderBottomWidth:0}]}>
                                        <Text style={styles.summaryLabel}>Reason</Text>
                                        <Text style={[styles.summaryValue, {color: '#6A0DAD', maxWidth: '60%'}]} numberOfLines={1}>{description}</Text>
                                    </View>
                                </View>

                                {/* PIN Input */}
                                <Text style={styles.pinLabel}>Enter PIN to Confirm</Text>
                                <TextInput 
                                    style={styles.pinInput}
                                    placeholder="* * * *"
                                    placeholderTextColor="#D1D5DB"
                                    secureTextEntry
                                    keyboardType="numeric"
                                    maxLength={4}
                                    value={pin}
                                    onChangeText={setPin}
                                    autoFocus
                                />

                                {/* Actions */}
                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep(1)}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.confirmBtn, (pin.length < 4 || sending) && {opacity: 0.5}]} 
                                        onPress={handleFinalSubmit}
                                        disabled={pin.length < 4 || sending}
                                    >
                                        {sending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Send Request</Text>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* --- SUCCESS MODAL --- */}
                <Modal visible={step === 3} transparent animationType="fade" statusBarTranslucent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.successCard}>
                            <View style={styles.successIcon}><Ionicons name="paper-plane" size={40} color="#FFF" /></View>
                            <Text style={styles.successTitle}>Request Sent!</Text>
                            <Text style={styles.successDesc}>
                                Your request for ₦{Number(amount).toLocaleString()} has been sent to {selectedPerson?.first_name}.
                                {"\n\n"}Status: <Text style={{fontWeight:'700', color: '#F59E0B'}}>PENDING</Text>
                            </Text>
                            <TouchableOpacity style={styles.successBtn} onPress={() => { setStep(1); router.replace('/(tabs)'); }}>
                                <Text style={styles.successBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </View>
        </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  backBtn: { padding: 5 },
  content: { padding: 24 },
  label: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, color: '#1A1A1A', width: '100%' },
  inputIcon: { position: 'absolute', right: 15 },
  
  // Search Results
  searchSection: { zIndex: 10 },
  resultsList: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: '#FFF', borderRadius: 12, elevation: 5, padding: 5, maxHeight: 200, borderWidth: 1, borderColor: '#E5E7EB' },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#6A0DAD' },
  resultName: { fontWeight: '700', fontSize: 15, color: '#1A1A1A' },
  resultId: { fontSize: 12, color: '#6B7280' },

  // Risk Card
  riskCard: { backgroundColor: "#FFF", padding: 15, borderRadius: 16, marginTop: 15, marginBottom: 5, borderLeftWidth: 5, borderWidth: 1, borderColor: '#F3F4F6' },
  riskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  riskUser: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  riskBank: { fontSize: 12, color: "#6B7280" },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  riskBadgeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  
  heatmapLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  heatmapText: { color: "#6A0DAD", fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },

  continueBtn: { backgroundColor: '#6A0DAD', marginTop: 40, padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#6A0DAD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, textAlign: 'center', color: '#1A1A1A' },
  
  summaryBox: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 15, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  summaryLabel: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  summaryValue: { fontWeight: '700', color: '#1A1A1A', fontSize: 15, textAlign: 'right' },

  pinLabel: { textAlign: 'center', fontWeight: '700', color: '#374151', marginBottom: 10 },
  pinInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 15, textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: '800', marginBottom: 5, color: '#1A1A1A' },

  modalActions: { flexDirection: 'row', gap: 15, marginTop: 10, marginBottom: 20 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelText: { fontWeight: '700', color: '#4B5563' },
  confirmBtn: { flex: 1, backgroundColor: '#6A0DAD', padding: 16, borderRadius: 14, alignItems: 'center' },

  // Success Modal
  successCard: { backgroundColor: '#FFF', margin: 20, borderRadius: 24, padding: 30, alignItems: 'center', alignSelf: 'center', top: '-20%', width: '85%' },
  successIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#6A0DAD', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  successTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10, color: '#1A1A1A' },
  successDesc: { textAlign: 'center', color: '#6B7280', lineHeight: 20, marginBottom: 20, fontSize: 14 },
  successBtn: { backgroundColor: '#F3E8FF', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  successBtnText: { color: '#6A0DAD', fontWeight: '700' }
});