import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView,
  Alert, ScrollView, Modal, ActivityIndicator, Keyboard, TouchableWithoutFeedback, 
  Vibration, Image, Animated, KeyboardAvoidingView, Platform, Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// ✅ API & Context
import API from "../api/api"; 
import { useAuth } from "../context/AuthContext"; 

export default function SendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userInfo, logout } = useAuth(); 
  
  // --- UI STATES ---
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  // --- DATA STATES ---
  const [amount, setAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [pin, setPin] = useState("");
  
  const [userBalance, setUserBalance] = useState(0); 
  const [receiptData, setReceiptData] = useState<any>(null);
  const viewShotRef = useRef<View>(null); 
  const scaleValue = useRef(new Animated.Value(0)).current; 

  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinError, setPinError] = useState(""); 
  const MAX_ATTEMPTS = 5; 
  
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]); 
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshBackendData();
      requestLocationPermission();
      return () => {
          setSearchResults([]);
          setPin("");
          setPinError("");
      };
    }, []) 
  );

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: location.coords.latitude, lon: location.coords.longitude });
      }
    } catch (error) { console.log("Location Error:", error); }
  };

  const resetForm = () => {
    setAmount("");
    setSearchQuery("");
    setPin("");
    setSelectedPerson(null);
    setSearchResults([]);
    setShowConfirmModal(false);
    setShowPinModal(false);
    setShowReceipt(false);
    setPinAttempts(0); 
    setPinError(""); 
    setReceiptData(null);
    scaleValue.setValue(0);
  };

  const fullReset = () => { resetForm(); };

  const refreshBackendData = async () => {
    setPageLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
          const profileRes = await API.get('/api/user/profile', config);
          const serverData = profileRes.data.data || profileRes.data; 
          if (serverData && serverData.wallet_balance !== undefined) {
              setUserBalance(parseFloat(serverData.wallet_balance));
          }
      } catch (e) { console.log("Profile Sync Error"); }

      try {
          const benRes = await API.get('/api/transactions/beneficiaries', config);
          if (Array.isArray(benRes.data)) {
              const uniquePeople = benRes.data.filter((item:any, index:number, self:any[]) =>
                index === self.findIndex((t) => (t.wallet_id === item.wallet_id))
              );
              setBeneficiaries(uniquePeople);
          }
      } catch (e) { console.log("Beneficiary Sync Error"); }

    } catch (error) {
      console.log("General Data Error");
    } finally {
        setPageLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (selectedPerson && text !== selectedPerson.name) setSelectedPerson(null);
    if (!text || text.length < 2) { setSearchResults([]); return; }

    setLoadingSearch(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const localMatches = beneficiaries.filter(b => {
        const name = b.first_name ? `${b.first_name} ${b.last_name}` : b.counterparty_name;
        return (name || "").toLowerCase().includes(text.toLowerCase()) || 
               (b.wallet_id || "").toLowerCase().includes(text.toLowerCase()) ||
               (b.phone_number || "").includes(text);
      }).map(item => ({
          id: item.id || item.counterparty_id,
          first_name: item.first_name, 
          last_name: item.last_name,
          wallet_id: item.wallet_id,
          recipient_account: item.phone_number,
          source: 'Recent'
      }));

      let globalMatches: any[] = [];
      if (text.length >= 3) {
          try {
             const res = await API.get(`/api/transactions/lookup/${text}`, config);
             if (Array.isArray(res.data)) {
                 globalMatches = res.data.filter((u:any) => u.id !== userInfo?.id).map((u:any) => ({
                        id: u.id,
                        first_name: u.first_name,
                        last_name: u.last_name,
                        wallet_id: u.wallet_id,
                        recipient_account: u.phone_number,
                        source: 'Pivota User'
                    }));
             }
          } catch (e) {}
      }

      const combined = [...localMatches];
      globalMatches.forEach(globalUser => {
          const exists = combined.find(local => local.wallet_id === globalUser.wallet_id);
          if (!exists) combined.push(globalUser);
      });
      setSearchResults(combined);
    } catch (err) { console.log(err); } finally { setLoadingSearch(false); }
  };

  const selectUser = async (user: any) => {
    Keyboard.dismiss();
    const targetId = user.id || user.counterparty_id;
    if (!targetId) { Alert.alert("Error", "Invalid User Data"); return; }

    let displayName = "";
    if (user.first_name) displayName = `${user.first_name} ${user.last_name || ""}`;
    else displayName = user.counterparty_name || "Unknown";

    setSearchQuery(displayName);
    setSearchResults([]); 
    setSecurityStatus("Scanning...");

    try {
        const check = await API.post('/api/transactions/report-fraud', {
            reporter_wallet: user.wallet_id,
            threat_type: "Pre-Transfer Scan"
        });
        const isSafe = check.data.status === "Verified Safe";
        setSecurityStatus(isSafe ? "✅ Trusted User" : "⚠️ High Risk");

        setSelectedPerson({
            id: targetId,
            name: displayName,
            wallet_id: user.wallet_id,
            account: user.recipient_account,
            risk: isSafe ? "Low" : "High"
        });
    } catch (e) {
        setSecurityStatus("⚠️ Offline Check");
        setSelectedPerson({
            id: targetId,
            name: displayName,
            wallet_id: user.wallet_id,
            account: user.recipient_account,
            risk: "Unknown"
        });
    }
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) return Alert.alert("Invalid Amount", "Please enter a valid amount.");
    if (!selectedPerson) return Alert.alert("Select Recipient", "Please search and select a user.");
    
    // Check balance against Database figure
    if (parseFloat(amount) > userBalance) {
        return Alert.alert("Insufficient Funds", `Your balance is ₦${userBalance.toLocaleString()}`);
    }

    // ✅ FIX: Instead of blocking, we show a CHOICE alert if risk is high
    if (selectedPerson.risk === 'High') {
      Alert.alert(
        "Security Warning",
        "Pivota AI has flagged this recipient as High Risk. Do you wish to proceed with extreme caution?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Proceed Anyway", onPress: () => setShowConfirmModal(true) }
        ]
      );
    } else {
      // Normal flow for low risk
      setShowConfirmModal(true);
    }
  };

  const triggerCelebration = () => {
    Animated.spring(scaleValue, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
  };

  const shareReceiptFile = async () => {
    try {
        if (viewShotRef.current) {
            const uri = await captureRef(viewShotRef, { format: "jpg", quality: 0.9, result: "tmpfile" });
            await Sharing.shareAsync(uri, { dialogTitle: 'Share Receipt' });
        }
    } catch (error) { Alert.alert("Error", "Could not generate receipt image."); }
  };

  const handleFinalSend = async () => {
    setSending(true);
    setPinError(""); 
    
    try {
      let token = await AsyncStorage.getItem('userToken');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const payload = {
        senderId: userInfo?.id,
        receiverId: selectedPerson.id,
        amount: parseFloat(amount),
        lat: userLocation?.lat || 0,
        lon: userLocation?.lon || 0,
        pin: String(pin).trim()
      };

      const response = await API.post('/api/transactions/transfer', payload, config);

      const txData = response.data.data;
      setReceiptData(txData); 
      setPinAttempts(0);
      setShowPinModal(false);
      setShowReceipt(true);
      setTimeout(() => triggerCelebration(), 300); 
      refreshBackendData(); 

    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Transaction Failed";
      const status = error.response?.status;

      // ✅ FIX: Only logout if explicit PIN failure exceeds attempts
      if (status === 403 && (errorMsg.includes("PIN") || errorMsg.includes("pin"))) {
          const newAttempts = pinAttempts + 1;
          setPinAttempts(newAttempts);
          Vibration.vibrate();

          if (newAttempts >= MAX_ATTEMPTS) {
              setShowPinModal(false);
              Alert.alert("Locked", "Too many incorrect attempts.", [{ text: "Log Out", onPress: () => logout() }]);
          } else {
              setPinError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} left.`);
              setPin(""); // Clear pin, stay on screen
          }
      } 
      // ✅ FIX: Do NOT logout on 400 (Bad Request) or 404 (User Not Found)
      else if (status === 400 || status === 404) {
          Alert.alert("Error", errorMsg);
          setPin(""); 
      }
      // ✅ FIX: Only logout on 401 (Session truly dead)
      else if (status === 401) { 
          Alert.alert("Session Expired", "Please restart to login again.");
      }
      else { 
          Alert.alert("Failed", errorMsg); 
          setPin(""); 
      }
    } finally { setSending(false); }
  };

  return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <StatusBar style="dark" backgroundColor="#F8F9FB" translucent={true} />

                {/* --- PIN MODAL (Fixed Retry Logic) --- */}
                <Modal visible={showPinModal} transparent animationType="slide" statusBarTranslucent={true} onRequestClose={() => setShowPinModal(false)}>
                    <TouchableOpacity style={styles.modalOverlayBottom} activeOpacity={1} onPress={() => Keyboard.dismiss()}>
                        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 20 }]}> 
                            <View style={styles.dragHandle} />
                            <Text style={styles.sheetTitle}>Enter PIN</Text>
                            <Text style={styles.sheetSub}>Enter your 4-digit PIN to confirm.</Text>

                            <TextInput
                                style={[styles.sheetPinInput, pinError ? {borderColor: '#EF4444', color:'#EF4444'} : {}]}
                                placeholder="* * * *"
                                placeholderTextColor={pinError ? "#FCA5A5" : "#CCC"}
                                keyboardType="numeric"
                                secureTextEntry
                                maxLength={4}
                                value={pin}
                                onChangeText={(text) => { setPin(text); setPinError(""); }}
                                autoFocus={true} 
                            />
                            
                            {pinError ? (
                                <View style={styles.warningBubble}>
                                    <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                                    <Text style={styles.warningText}>{pinError}</Text>
                                </View>
                            ) : <View style={{height: 45}} />}

                            <TouchableOpacity
                                style={[styles.sheetBtn, (pin.length < 4 || sending) && { opacity: 0.5 }]}
                                onPress={handleFinalSend}
                                disabled={pin.length < 4 || sending}
                            >
                                {sending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sheetBtnText}>Pay ₦{Number(amount).toLocaleString()}</Text>}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* CONFIRM MODAL */}
                <Modal visible={showConfirmModal} transparent animationType="fade" statusBarTranslucent={true} onRequestClose={() => setShowConfirmModal(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.alertBox}>
                            <View style={[styles.alertIcon, {backgroundColor: '#F3E8FF'}]}>
                                <Ionicons name="wallet" size={30} color="#6A0DAD" />
                            </View>
                            <Text style={styles.alertTitle}>Confirm Transfer</Text>
                            <View style={styles.balanceCheckRow}><Text style={styles.balanceLabel}>Current Balance:</Text><Text style={styles.balanceValue}>₦{userBalance.toLocaleString()}</Text></View>
                            <View style={styles.balanceCheckRow}><Text style={styles.balanceLabel}>Sending Amount:</Text><Text style={[styles.balanceValue, {color: '#EF4444'}]}>-₦{parseFloat(amount).toLocaleString()}</Text></View>
                            <View style={styles.separator} />
                            <View style={styles.verifiedUserBox}>
                                <Text style={styles.verifiedName}>{selectedPerson?.name}</Text>
                                <Text style={styles.verifiedDetail}>{selectedPerson?.wallet_id}</Text>
                            </View>
                            <View style={styles.alertRow}>
                                <TouchableOpacity style={styles.alertBtnCancel} onPress={() => setShowConfirmModal(false)}><Text style={styles.alertBtnTextCancel}>Cancel</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.alertBtnConfirm} onPress={() => { setShowConfirmModal(false); setTimeout(() => setShowPinModal(true), 300); }}>
                                    <Text style={styles.alertBtnTextConfirm}>Proceed</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* RECEIPT MODAL */}
                <Modal visible={showReceipt} animationType="slide" statusBarTranslucent={true} onRequestClose={() => fullReset()}>
                    <SafeAreaView style={styles.receiptContainer}>
                        <View collapsable={false} ref={viewShotRef} style={styles.receiptCard}>
                            <Animated.View style={[styles.receiptHeader, { transform: [{ scale: scaleValue }] }]}>
                                <Image source={{ uri: 'https://via.placeholder.com/150/6A0DAD/FFFFFF?text=Pivota' }} style={styles.logo} resizeMode="contain" />
                                <Ionicons name="checkmark-circle" size={60} color="#10B981" style={{ marginTop: 10 }} />
                                <Text style={styles.receiptTitle}>Success!</Text>
                            </Animated.View>
                            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Status</Text><Text style={[styles.receiptValue, {color: '#10B981'}]}>{receiptData?.status || "SUCCESS"}</Text></View>
                            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Transaction No</Text><Text style={styles.receiptValue}>{receiptData?.transaction_no?.slice(0, 15)}...</Text></View>
                            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Session ID</Text><Text style={styles.receiptValue}>{receiptData?.session_id || "N/A"}</Text></View>
                            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Date</Text><Text style={styles.receiptValue}>{receiptData?.date ? new Date(receiptData.date).toLocaleString() : "Just Now"}</Text></View>
                            <View style={[styles.receiptRow, {borderBottomWidth:0}]}><Text style={styles.receiptLabel}>Amount</Text><Text style={[styles.receiptValue, {fontSize: 22, color: '#6A0DAD'}]}>₦{Number(receiptData?.amount || amount).toLocaleString()}</Text></View>
                        </View>
                        <View style={styles.receiptActions}>
                            <TouchableOpacity style={styles.shareBtn} onPress={shareReceiptFile}><Ionicons name="share-outline" size={24} color="#FFF" /><Text style={styles.shareBtnText}>Share</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => { fullReset(); router.replace("/(tabs)"); }}><Text style={styles.closeBtnText}>Done</Text></TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </Modal>

                {/* HEATMAP MODAL */}
                <Modal visible={showHeatmap} transparent animationType="slide" statusBarTranslucent={true} onRequestClose={() => setShowHeatmap(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Fraud Heatmap</Text><TouchableOpacity onPress={() => setShowHeatmap(false)}><Ionicons name="close" size={24} color="#000"/></TouchableOpacity></View>
                            <View style={{width: '100%', height: 300, backgroundColor: '#E5E7EB', borderRadius: 20, alignItems: 'center', justifyContent: 'center'}}>
                                <Text>Live Map Loading...</Text>
                            </View>
                            <Text style={styles.heatmapCaption}>Analyzing transaction risk for this region.</Text>
                        </View>
                    </View>
                </Modal>

                {/* MAIN CONTENT */}
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#1A1A1A" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Send Money</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.inputCard}>
                        <Text style={styles.label}>Amount to Send</Text>
                        <View style={styles.amountRow}>
                            <Text style={styles.currencySymbol}>₦</Text>
                            <TextInput 
                                style={styles.amountInput} 
                                value={amount} 
                                onChangeText={setAmount} 
                                keyboardType="numeric" 
                                placeholder="0.00" 
                                placeholderTextColor="#C0C0C0" 
                            />
                        </View>
                        <Text style={[styles.balanceHint, parseFloat(amount || "0") > userBalance && {color: '#EF4444'}]}>
                            {pageLoading ? "Syncing..." : `Balance: ₦${userBalance.toLocaleString()}`}
                        </Text>
                    </View>

                    <View style={styles.manualInputSection}>
                        <Text style={styles.sectionTitle}>Recipient</Text>
                        <View style={styles.searchRow}>
                            <TextInput style={styles.searchInput} placeholder="Name, Wallet ID, or Phone..." value={searchQuery} onChangeText={handleSearch} autoCapitalize="none" />
                            <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch(searchQuery)} disabled={loadingSearch}>{loadingSearch ? <ActivityIndicator color="#FFF" /> : <Ionicons name="search" size={24} color="#FFF" />}</TouchableOpacity>
                        </View>
                        <Text style={styles.helperText}>Type at least 3 characters to search.</Text>
                        {searchResults.length > 0 && (
                            <View style={styles.suggestionsBox}>
                                {searchResults.map((user, index) => (
                                    <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => selectUser(user)}>
                                        <View style={styles.suggestionAvatar}><Text style={styles.suggestionInitials}>{user.first_name?.[0]}</Text></View>
                                        <View style={{flex: 1}}><Text style={styles.suggestionName}>{user.first_name} {user.last_name}</Text><Text style={styles.suggestionId}>@{user.wallet_id}</Text></View>
                                        {user.source === 'Pivota User' && (<View style={styles.sourceBadge}><Text style={styles.sourceText}>Found</Text></View>)}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {selectedPerson && (
                        <View style={[styles.riskCard, { borderLeftColor: selectedPerson.risk === 'High' ? '#EF4444' : '#10B981' }]}>
                            <View style={styles.riskHeader}>
                                <View><Text style={styles.riskUser}>{selectedPerson.name}</Text><Text style={styles.riskBank}>{selectedPerson.wallet_id}</Text></View>
                                <View style={[styles.riskBadge, { backgroundColor: selectedPerson.risk === 'High' ? '#FEE2E2' : '#DCFCE7' }]}>
                                    <Text style={[styles.riskBadgeText, { color: selectedPerson.risk === 'High' ? '#B91C1C' : '#166534' }]}>
                                        {securityStatus || "Checking..."}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.heatmapLink} onPress={() => router.push('/fraud-heatmap')}><Ionicons name="map-outline" size={16} color="#6A0DAD" /><Text style={styles.heatmapText}>Check Location Safety</Text></TouchableOpacity>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>Recent</Text>
                    {beneficiaries.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.beneficiaryScroll}>
                            {beneficiaries.map((item, index) => (
                                <TouchableOpacity key={index} style={styles.miniBeneficiary} onPress={() => selectUser(item)}>
                                    <View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>{item.first_name?.[0] || "?"}</Text></View>
                                    <Text style={styles.miniName} numberOfLines={1}>{item.first_name || item.counterparty_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : <Text style={{color: '#9CA3AF', marginBottom: 20}}>No recent transfers</Text>}
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                    <TouchableOpacity style={[styles.sendBtn, (!amount || !selectedPerson) && { opacity: 0.5 }]} onPress={handleProceed} disabled={!amount || !selectedPerson}><Text style={styles.sendBtnText}>Proceed</Text></TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 20, paddingHorizontal: 20, backgroundColor: "#FFF" },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 20 },
  inputCard: { backgroundColor: "#FFF", padding: 20, borderRadius: 20, marginBottom: 20, alignItems: "center" },
  label: { fontSize: 13, color: "#6B7280", marginBottom: 5 },
  amountRow: { flexDirection: "row", alignItems: "center", height: 60 },
  currencySymbol: { fontSize: 24, fontWeight: "700", marginRight: 5 },
  amountInput: { fontSize: 32, fontWeight: "800", color: "#1A1A1A", minWidth: 100, height: 60, paddingVertical: 0 },
  balanceHint: { fontSize: 12, color: "#6B7280", marginTop: 5 },
  manualInputSection: { marginBottom: 25, zIndex: 10 }, 
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10, color: "#1A1A1A" },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, backgroundColor: "#FFF", padding: 15, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", fontSize: 16 },
  searchBtn: { width: 56, height: 56, backgroundColor: '#6A0DAD', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  suggestionsBox: { position: 'absolute', top: 85, left: 0, right: 0, backgroundColor: '#FFF', borderRadius: 12, elevation: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, padding: 5, maxHeight: 250, zIndex: 99 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  suggestionAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  suggestionInitials: { color: '#6A0DAD', fontWeight: '700', fontSize: 16 },
  suggestionName: { fontWeight: '700', color: '#1A1A1A', fontSize: 14 },
  suggestionId: { fontSize: 12, color: '#6B7280' },
  sourceBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  sourceText: { fontSize: 10, color: '#4338CA', fontWeight: '700' },
  helperText: { fontSize: 11, color: '#9CA3AF', marginTop: 5, marginLeft: 5 },
  riskCard: { backgroundColor: "#FFF", padding: 15, borderRadius: 16, marginBottom: 20, borderLeftWidth: 5, elevation: 2 },
  riskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  riskUser: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  riskBank: { fontSize: 12, color: "#6B7280" },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  riskBadgeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  heatmapLink: { flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  heatmapText: { color: "#6A0DAD", fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalOverlayBottom: { flex: 1, justifyContent: "flex-end" }, 
  alertBox: { width: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 25, alignItems: 'center' },
  alertIcon: { width: 60, height: 60, backgroundColor: '#F3E8FF', borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  alertTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  balanceCheckRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 5 },
  balanceLabel: { color: '#6B7280' },
  balanceValue: { fontWeight: '700', color: '#1A1A1A' },
  errorText: { color: '#EF4444', fontWeight: '700', marginBottom: 10, fontSize: 13 },
  separator: { height: 1, backgroundColor: '#F3F4F6', width: '100%', marginVertical: 10 },
  verifiedUserBox: { backgroundColor: '#F9FAFB', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  verifiedName: { fontSize: 18, fontWeight: '700', color: '#6A0DAD' },
  verifiedDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  alertRow: { flexDirection: 'row', gap: 10, width: '100%' },
  alertBtnCancel: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  alertBtnConfirm: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#6A0DAD', alignItems: 'center' },
  alertBtnTextCancel: { color: '#4B5563', fontWeight: '600' },
  alertBtnTextConfirm: { color: '#FFF', fontWeight: '600' },
  bottomSheet: { backgroundColor: "#FFF", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, alignItems: "center", paddingBottom: 40 },
  dragHandle: { width: 50, height: 5, backgroundColor: "#E5E7EB", borderRadius: 10, marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: "700", marginBottom: 5, color: '#1A1A1A' },
  sheetSub: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  sheetPinInput: { width: "70%", borderBottomWidth: 2, borderBottomColor: "#6A0DAD", fontSize: 32, textAlign: "center", padding: 10, letterSpacing: 10, marginBottom: 10, color: '#1A1A1A' },
  sheetBtn: { backgroundColor: "#6A0DAD", width: "100%", padding: 18, borderRadius: 16, alignItems: "center" },
  sheetBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  errorContainer: { height: 45, justifyContent: 'center', marginBottom: 10, width: '100%' },
  warningBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignSelf: 'center' },
  warningText: { color: '#B91C1C', marginLeft: 6, fontWeight: '600', fontSize: 13 },
  receiptContainer: { flex: 1, backgroundColor: '#6A0DAD', justifyContent: 'center', padding: 20 },
  receiptCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 20 },
  receiptHeader: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 100, height: 50, marginBottom: 10 },
  receiptTitle: { fontSize: 24, fontWeight: '800', color: '#10B981', marginTop: 5 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  receiptLabel: { color: '#6B7280', fontSize: 14 },
  receiptValue: { fontWeight: '700', color: '#1A1A1A', fontSize: 14 },
  receiptActions: { flexDirection: 'row', gap: 15 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B5CF6', padding: 15, borderRadius: 15 },
  shareBtnText: { color: '#FFF', fontWeight: '700', marginLeft: 8 },
  closeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15 },
  closeBtnText: { color: '#6A0DAD', fontWeight: '700' },
  modalContent: { width: "90%", backgroundColor: "#FFF", borderRadius: 24, padding: 20, alignItems: "center" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  heatmapCaption: { textAlign: 'center', color: '#6B7280', fontSize: 12 },
  beneficiaryScroll: { marginBottom: 25 },
  miniBeneficiary: { alignItems: "center", marginRight: 20, padding: 10, borderRadius: 12, width: 80 },
  miniAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5E7EB', justifyContent: "center", alignItems: "center", marginBottom: 5 },
  miniAvatarText: { fontWeight: "700", color: "#4B5563" },
  miniName: { fontSize: 11, color: "#1A1A1A", textAlign: 'center' },
  footer: { paddingHorizontal: 20, backgroundColor: "#FFF" },
  sendBtn: { backgroundColor: "#6A0DAD", padding: 18, borderRadius: 16, alignItems: 'center' },
  sendBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});