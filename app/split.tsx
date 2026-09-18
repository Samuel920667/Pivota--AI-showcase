import React, { useState, useCallback, useRef } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, 
  SafeAreaView, Alert, ActivityIndicator, Animated, Vibration, Modal, 
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Internal Imports (Verify your paths)
import API from "../api/api"; 
import { useAuth } from "../context/AuthContext"; 

export default function SplitBillScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userInfo } = useAuth();
  
  // --- UI & DATA STATES ---
  const [amount, setAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]); 
  const [recentBeneficiaries, setRecentBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");

  // --- THE WIPER (Initial Data & Reset) ---
  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
      return () => {
        setAmount('');
        setParticipants([]);
        setSearchResults([]);
        setSearchQuery('');
        setPin("");
      };
    }, [])
  );

  const fetchInitialData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await API.get('/api/transactions/beneficiaries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentBeneficiaries(res.data);
    } catch (e) { console.log("Init fetch error"); }
  };

  // --- 📡 BACKEND SEARCH ---
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 3) { setSearchResults([]); return; }
    
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await API.get(`/api/transactions/lookup/${text}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filtered = res.data.filter((u: any) => 
        u.id !== userInfo?.id && !participants.some(p => p.id === u.id)
      );
      setSearchResults(filtered);
    } catch (e) { console.log("Search error", e); }
    finally { setLoading(false); }
  };

  // --- GROUP MANAGEMENT (ADD/REMOVE) ---
  const toggleParticipant = (person: any) => {
    const exists = participants.find(p => p.id === (person.id || person.counterparty_id));
    if (exists) {
      // ✅ REMOVAL: Tap again to remove person from group
      setParticipants(participants.filter(p => p.id !== (person.id || person.counterparty_id)));
      Vibration.vibrate(10);
    } else {
      // ✅ ADD: Create consistent object structure
      const newMember = {
        id: person.id || person.counterparty_id,
        first_name: person.first_name || person.counterparty_name?.split(' ')[0],
        wallet_id: person.wallet_id
      };
      setParticipants([...participants, newMember]);
      Vibration.vibrate(30);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleInitiate = () => {
    if (!amount || parseFloat(amount) <= 0) return Alert.alert("Error", "Enter a valid amount.");
    if (participants.length === 0) return Alert.alert("Error", "Add at least one person.");
    setShowPinModal(true);
  };

  const submitSplitRequest = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const payload = {
        initiatorId: userInfo?.id,
        totalAmount: parseFloat(amount),
        participants: participants.map(p => p.id),
        pin: String(pin).trim(), // ✅ FIXED: Trimming string
        description: `Split among ${participants.length + 1} people`
      };

      await API.post('/api/transactions/split', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Alert.alert("Success", "Split request sent. Money stays in your wallet until all members approve.");
      setShowPinModal(false);
      router.back();
    } catch (error: any) {
      Alert.alert("Security Error", error.response?.data?.error || "Check PIN");
      setPin("");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🛡️ PIN BOTTOM SHEET (Unified Design) */}
      <Modal visible={showPinModal} transparent animationType="slide" statusBarTranslucent={true}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPinModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.bottomSheetContainer}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.dragHandle} />
                <Text style={styles.sheetTitle}>Authorize Split</Text>
                <Text style={styles.sheetSub}>Confirming split with {participants.length} friends.</Text>

                <TextInput 
                  style={styles.sheetPinInput} 
                  secureTextEntry 
                  keyboardType="numeric" 
                  maxLength={4} 
                  value={pin}
                  onChangeText={setPin}
                  autoFocus
                  placeholder="* * * *"
                />

                <TouchableOpacity 
                  style={[styles.confirmBtn, (pin.length < 4 || loading) && { opacity: 0.5 }]} 
                  onPress={submitSplitRequest} 
                  disabled={pin.length < 4 || loading}
                >
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Initiate Group Split</Text>}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#6A0DAD" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Split Bill</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* AMOUNT CARD */}
        <View style={styles.amountCard}>
          <Text style={styles.label}>Total Group Bill</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6A0DAD" />
          <TextInput style={styles.searchInput} placeholder="Search friends to add..." value={searchQuery} onChangeText={handleSearch} />
          {loading && <ActivityIndicator size="small" color="#6A0DAD" />}
        </View>

        {/* SEARCH RESULTS OVERLAY */}
        {searchResults.length > 0 && (
          <View style={styles.resultsBox}>
            {searchResults.map(u => (
              <TouchableOpacity key={u.id} style={styles.resRow} onPress={() => toggleParticipant(u)}>
                <View style={styles.avatarMini}><Text style={styles.avatarTxt}>{u.first_name?.[0]}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resName}>{u.first_name} {u.last_name}</Text>
                  <Text style={styles.resId}>@{u.wallet_id}</Text>
                </View>
                <Ionicons name="add-circle" size={24} color="#6A0DAD" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* RECENT BENEFICIARIES (Selling Point UI) */}
        <Text style={styles.sectionTitle}>Recent Beneficiaries</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
          {recentBeneficiaries.map((friend) => {
            const isSelected = participants.find(p => p.id === (friend.id || friend.counterparty_id));
            return (
              <TouchableOpacity key={friend.id || friend.counterparty_id} style={styles.miniFriend} onPress={() => toggleParticipant(friend)}>
                <View style={[styles.avatarCircle, isSelected && styles.avatarSelected]}>
                  <Text style={[styles.avatarCircleText, isSelected && {color: '#FFF'}]}>{friend.first_name?.[0] || '?'}</Text>
                </View>
                <Text style={styles.miniName} numberOfLines={1}>{friend.first_name || friend.counterparty_name}</Text>
                {isSelected && <View style={styles.checkBadge}><Ionicons name="checkmark" size={10} color="#FFF" /></View>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* REMOVABLE CHIPS / CURRENT GROUP */}
        {participants.length > 0 && (
          <View style={styles.groupSection}>
            <Text style={styles.sectionTitle}>Splitting With</Text>
            <View style={styles.chipRow}>
              {participants.map(p => (
                <TouchableOpacity key={p.id} style={styles.chip} onPress={() => toggleParticipant(p)}>
                  <Text style={styles.chipText}>{p.first_name}</Text>
                  <Ionicons name="close-circle" size={16} color="#FFF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* DYNAMIC BREAKDOWN */}
        {participants.length > 0 && amount && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Breakdown per person</Text>
            <Text style={styles.summaryValue}>₦{(parseFloat(amount) / (participants.length + 1)).toLocaleString()}</Text>
            <Text style={styles.summarySub}>Total includes you + {participants.length} others</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={[styles.mainBtn, (!amount || participants.length === 0) && { opacity: 0.6 }]} 
          onPress={handleInitiate}
          disabled={!amount || participants.length === 0}
        >
          <Text style={styles.mainBtnText}>Review & Send Requests</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: '#FFF', paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#6A0DAD' },
  scrollContent: { padding: 20 },
  amountCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 24, alignItems: 'center', elevation: 4, shadowColor: '#6A0DAD', shadowOpacity: 0.1, shadowRadius: 10 },
  label: { fontSize: 13, color: '#6B7280', marginBottom: 5 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currency: { fontSize: 32, fontWeight: '800', color: '#1A1A1A' },
  amountInput: { fontSize: 42, fontWeight: '800', color: '#6A0DAD', minWidth: 100 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 15, marginTop: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 15, height: 56, borderWidth: 1, borderColor: '#F3E8FF', marginVertical: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  resultsBox: { backgroundColor: '#FFF', borderRadius: 16, marginTop: -15, marginBottom: 20, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  resRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatarMini: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { color: '#6A0DAD', fontWeight: '700' },
  resName: { fontWeight: '700', color: '#1A1A1A' },
  resId: { fontSize: 12, color: '#6B7280' },
  recentScroll: { flexDirection: 'row', marginBottom: 25 },
  miniFriend: { alignItems: 'center', marginRight: 20, width: 60 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  avatarCircleText: { fontWeight: '700', color: '#6A0DAD' },
  avatarSelected: { backgroundColor: '#6A0DAD' },
  miniName: { fontSize: 11, color: '#1A1A1A', textAlign: 'center' },
  checkBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#10B981', borderRadius: 10, padding: 2 },
  groupSection: { marginTop: 10, marginBottom: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { backgroundColor: '#6A0DAD', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, gap: 5 },
  chipText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  summaryBox: { backgroundColor: '#F3E8FF', padding: 25, borderRadius: 24, alignItems: 'center' },
  summaryLabel: { color: '#6A0DAD', fontSize: 12, fontWeight: '600', marginBottom: 5 },
  summaryValue: { fontSize: 32, fontWeight: '800', color: '#1A1A1A' },
  summarySub: { color: '#6B7280', fontSize: 11, marginTop: 10 },
  footer: { padding: 20, backgroundColor: '#FFF' },
  mainBtn: { backgroundColor: '#6A0DAD', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContainer: { width: '100%' },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, alignItems: 'center' },
  dragHandle: { width: 50, height: 5, backgroundColor: '#E5E7EB', borderRadius: 10, marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 5 },
  sheetSub: { fontSize: 13, color: '#6B7280', marginBottom: 25, textAlign: 'center' },
  sheetPinInput: { width: '70%', borderBottomWidth: 2, borderBottomColor: '#6A0DAD', fontSize: 36, textAlign: 'center', letterSpacing: 15, marginBottom: 30, color: '#1A1A1A' },
  confirmBtn: { backgroundColor: '#6A0DAD', width: '100%', padding: 20, borderRadius: 16, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});