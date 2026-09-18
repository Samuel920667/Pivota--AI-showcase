import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ActivityIndicator, Alert, Modal, Vibration, ScrollView, 
  StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function AcceptRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const insets = useSafeAreaInsets(); 
  const { userInfo, refreshUserData } = useAuth(); // ✅ Get refresh function
  
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // --- STATE FOR REAL BACKEND DATA ---
  const [requestData, setRequestData] = useState({
      amount: 0,
      name: "",
      reason: "",
      initiatorId: ""
  });
  
  const [receiptData, setReceiptData] = useState<any>(null);

  // --- 1. GET REAL DATA FROM BACKEND ---
  useEffect(() => {
      fetchFreshDetails();
  }, [params.id, params.request_code]);

  const fetchFreshDetails = async () => {
      try {
          // 1. Optimistic Init (Try to use params first)
          let initialAmount = parseFloat(String(params.amount || params.share_amount || "0").replace(/[^0-9.]/g, ''));
          
          setRequestData({
              amount: initialAmount || 0,
              name: String(params.name || "User"),
              reason: String(params.reason || "Payment"),
              initiatorId: String(params.initiator_id || "")
          });

          // 2. FETCH FROM BACKEND TO BE SURE
          const token = await AsyncStorage.getItem('userToken');
          const userId = userInfo?.id;
          const myId = String(userId || "").trim();
          
          const res = await API.get(`/api/transactions/notifications/${userId}`, { 
              headers: { Authorization: `Bearer ${token}` } 
          });

          const targetCode = String(params.id || params.request_code || "");
          const freshItem = res.data.find((item: any) => 
              String(item.request_code) === targetCode || 
              String(item.id) === targetCode
          );

          if (freshItem) {
              const realAmount = parseFloat(freshItem.total_amount || freshItem.amount || "0");
              const senderId = String(freshItem.sender_id || freshItem.initiator_id || "").trim();
              
              // 🛡️ INITIATOR GUARD: Never show the payment screen to the person who SENT the request
              if (senderId === myId && senderId !== "") {
                  router.replace('/(tabs)');
                  return;
              }

              setRequestData({
                  amount: realAmount,
                  name: `${freshItem.first_name || ""} ${freshItem.last_name || ""}`.trim() || freshItem.counterparty_name || "Pivota User",
                  reason: freshItem.description || "Payment Request",
                  initiatorId: senderId
              });
          }
      } catch (e) {
          console.log("Error fetching fresh details:", e);
      } finally {
          setFetchingData(false);
      }
  };

  // --- 2. CALCULATIONS ---
  const walletBalance = parseFloat(String(userInfo?.wallet_balance || 0));
  const isInsufficient = walletBalance < requestData.amount;

  // --- 3. PAY LOGIC ---
  const handleAccept = async () => {
      if (requestData.amount <= 0) return Alert.alert("Error", "Invalid amount. Please refresh.");
      if (pin.length !== 4) return Alert.alert("PIN Required", "Please enter your 4-digit PIN.");
      if (isInsufficient) return Alert.alert("Insufficient Funds", "Please top up your wallet first.");

      setLoading(true);
      try {
          let token = await AsyncStorage.getItem('userToken');
          const config = { headers: { Authorization: `Bearer ${token}` } };
          
          const response = await API.post('/api/transactions/accept-request', {
              userId: userInfo?.id,
              requestCode: params.id || params.request_code, 
              pin: pin
          }, config);
          
          // ✅ UPDATE WALLET BALANCE INSTANTLY AT THE BACKEND
          if (refreshUserData) {
              await refreshUserData();
          }

          // Mature Receipt Data
          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
          
          setReceiptData({
              amount: requestData.amount,
              date: now.toDateString(),
              time: timeString,
              recipient: requestData.name,
              ref: (params.id || params.request_code || response.data.transaction_ref || "REF-ID").toString().toUpperCase()
          });

          Vibration.vibrate(50);
          setShowSuccess(true);
          
      } catch (error: any) {
          Alert.alert("Payment Failed", error.response?.data?.error || "Transaction failed.");
      } finally {
          setLoading(false);
      }
  };

  const closeReceipt = () => {
      setShowSuccess(false);
      router.replace('/(tabs)'); 
  };

  const handleDecline = async () => {
    Alert.alert("Decline Request?", "This will be marked as a failed transaction.", [
        { text: "Cancel", style: "cancel" },
        { text: "Decline", style: "destructive", onPress: async () => {
            try {
                let token = await AsyncStorage.getItem('userToken');
                await API.post('/api/transactions/request/decline', { userId: userInfo?.id, requestCode: params.id || params.request_code }, { headers: { Authorization: `Bearer ${token}` } });
                router.replace('/(tabs)');
            } catch (e) { console.log(e); }
        }}
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Review Request</Text>
         <View style={{width: 24}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        {/* SUMMARY CARD */}
        <View style={styles.summaryBox}>
            <View style={styles.iconHeader}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{(requestData.name || "U").charAt(0)}</Text>
                </View>
                <Text style={styles.payTitle}>Payment Request</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount to Pay</Text>
                {fetchingData && requestData.amount === 0 ? (
                    <ActivityIndicator size="small" color="#6A0DAD" />
                ) : (
                    <Text style={styles.summaryValueBig}>
                        ₦{requestData.amount > 0 ? requestData.amount.toLocaleString() : "0.00"}
                    </Text>
                )}
            </View>
            <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Requested By</Text>
                <Text style={styles.summaryValue}>{requestData.name}</Text>
            </View>
            <View style={[styles.summaryRow, {borderBottomWidth:0}]}>
                <Text style={styles.summaryLabel}>For</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>{requestData.reason}</Text>
            </View>
        </View>

        {isInsufficient && (
            <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>Insufficient Balance (₦{walletBalance.toLocaleString()})</Text>
            </View>
        )}

        {/* 🔢 PIN INPUT POP-UP AREA */}
        <View style={styles.pinSection}>
            <Text style={styles.pinLabel}>Enter PIN to Confirm</Text>
            <TextInput 
                style={styles.pinInput}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                value={pin}
                onChangeText={setPin}
                placeholder="• • • •"
                placeholderTextColor="#D1D5DB"
                editable={!loading} 
            />
        </View>

      </ScrollView>

      {/* ACTIONS */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={10}>
          <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                  <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                  style={[styles.payBtn, (isInsufficient || loading || requestData.amount === 0) && { opacity: 0.6 }]} 
                  onPress={handleAccept}
                  disabled={isInsufficient || loading || requestData.amount === 0}
              >
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payText}>Pay Now</Text>}
              </TouchableOpacity>
          </View>
      </KeyboardAvoidingView>

      {/* 🧾 MATURE SUCCESS RECEIPT MODAL */}
      <Modal visible={showSuccess} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.receiptCard}>
                <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={40} color="#FFF" />
                </View>
                <Text style={styles.receiptHeader}>Transaction Successful</Text>
                <Text style={styles.receiptSub}>Your share has been settled.</Text>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Total Paid</Text>
                    <Text style={styles.rValueBig}>₦{requestData.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Beneficiary</Text>
                    <Text style={styles.rValue}>{requestData.name}</Text>
                </View>
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Date</Text>
                    <Text style={styles.rValue}>{receiptData?.date}</Text>
                </View>
                <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Timestamp</Text>
                    <Text style={styles.rValue}>{receiptData?.time}</Text>
                </View>
                <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Ref</Text>
                    <Text style={styles.rValue}>{receiptData?.ref}</Text>
                </View>

                <TouchableOpacity style={styles.doneBtn} onPress={closeReceipt}>
                    <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  backBtn: { padding: 5 },
  content: { padding: 24 },
  summaryBox: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 25, marginBottom: 25, borderWidth: 1, borderColor: '#F3F4F6' },
  iconHeader: { alignItems: 'center', marginBottom: 20 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#6A0DAD' },
  payTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: '#E5E7EB', width: '100%', marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  summaryLabel: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  summaryValue: { fontWeight: '700', color: '#1A1A1A', fontSize: 16, textAlign: 'right', flex: 1 },
  summaryValueBig: { fontWeight: '900', color: '#6A0DAD', fontSize: 22 },
  pinSection: { marginTop: 10, alignItems: 'center' },
  pinLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 15 },
  pinInput: { backgroundColor: '#FFF', width: '100%', height: 60, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 10, textAlign: 'center', fontSize: 28, letterSpacing: 8, fontWeight: '800', color: '#1A1A1A' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 15, borderRadius: 12, marginBottom: 25, gap: 10 },
  errorText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 15, paddingHorizontal: 24, backgroundColor: '#FFF' },
  declineBtn: { flex: 1, backgroundColor: '#FFF', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' },
  declineText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
  payBtn: { flex: 2, backgroundColor: '#6A0DAD', padding: 18, borderRadius: 16, alignItems: 'center', elevation: 2 },
  payText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  receiptCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  successIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#D1FAE5' },
  receiptHeader: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 5 },
  receiptSub: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  receiptDivider: { width: '100%', height: 1, backgroundColor: '#F3F4F6', marginBottom: 20 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  rLabel: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  rValue: { color: '#1F2937', fontSize: 15, fontWeight: '700' },
  rValueBig: { color: '#6A0DAD', fontSize: 18, fontWeight: '900' },
  doneBtn: { marginTop: 20, backgroundColor: '#1A1A1A', width: '100%', padding: 16, borderRadius: 14, alignItems: 'center' },
  doneText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});