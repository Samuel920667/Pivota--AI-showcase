import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, 
  Alert, Vibration, ScrollView, StatusBar, Clipboard, TextInput, 
  KeyboardAvoidingView, Platform, Animated 
} from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API from "../api/api"; 
import { useAuth } from "../context/AuthContext"; 

// --- ✨ ANIMATED SUCCESS ICON ---
const AnimatedSuccessIcon = ({ visible }: { visible: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    return (
        <Animated.View style={[styles.statusIcon, { transform: [{ scale: scaleAnim }], backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="checkmark-circle" size={50} color="#10B981" />
        </Animated.View>
    );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userInfo } = useAuth();
  
  // --- CORE STATES ---
  const [activeTab, setActiveTab] = useState('Transactions'); 
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<any[]>([]);
  
  // --- UI STATES ---
  const [showFilter, setShowFilter] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // --- MODAL STATES ---
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [processing, setProcessing] = useState(false);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useFocusEffect(
    useCallback(() => {
      fetchRealData();
      return () => { 
        setShowReceipt(false); 
        setShowFilter(false); 
        setShowPinModal(false);
        setPin("");
      };
    }, [activeTab])
  );

  const fetchRealData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const endpoint = activeTab === 'Transactions' 
        ? '/api/transactions/history' 
        : `/api/transactions/notifications/${userInfo?.id}`;
      
      const res = await API.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      let data = Array.isArray(res.data) ? res.data : [];

      // 🚨 LOGIC: Recipient pays -> Vanishes. Initiator tracks -> Stays until 100% complete.
      if (activeTab === 'Activities') {
          data = data.filter(item => {
              if (item.flow_type === 'INCOMING') return item.my_status === 'pending'; 
              if (item.flow_type === 'OUTGOING') return item.my_status !== 'SUCCESS'; 
              return true;
          });
      }
      setRawData(data);
    } catch (e) {
      setRawData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const d = new Date(item.created_at || item.date);
      return !isNaN(d.getTime()) && d.getMonth() === selectedMonth;
    });
  }, [rawData, selectedMonth]);

  // ✅ DATE GROUPING LOGIC (Restored)
  const groupDataByDate = (items: any[]) => {
    const groups: { [key: string]: any[] } = { Today: [], Yesterday: [], Older: [] };
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    items.forEach(item => {
      const d = new Date(item.created_at || item.date);
      if (isNaN(d.getTime())) return;
      const dStr = d.toDateString();
      if (dStr === todayStr) groups.Today.push(item);
      else if (dStr === yesterdayStr) groups.Yesterday.push(item);
      else groups.Older.push(item);
    });
    return groups;
  };

  const groupedData = groupDataByDate(filteredData);

  // --- HANDLERS ---
  const handleItemPress = (item: any) => {
    Vibration.vibrate(20);
    setSelectedItem(item);
    if (activeTab === 'Activities' && item.flow_type === 'INCOMING') {
        setShowPinModal(true);
    } else {
        setShowReceipt(true);
    }
  };

  const handleAcceptRequest = async () => {
    if (pin.length < 4) { Alert.alert("PIN Required", "Enter 4-digit PIN"); return; }
    setProcessing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await API.post('/api/transactions/accept-request', {
        userId: userInfo?.id,
        requestCode: selectedItem.request_code,
        pin: pin
      }, { headers: { Authorization: `Bearer ${token}` } });

      Alert.alert("Success", "Payment Successful!");
      setShowPinModal(false);
      setPin("");
      fetchRealData(); 
    } catch (error: any) {
      Alert.alert("Failed", error.response?.data?.error || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  // --- 🛠️ HELPER FUNCTIONS ---
  const isFailed = selectedItem?.status?.toLowerCase() === 'failed';
  
  // Clean Wallet ID
  const getCleanWalletId = (id: string) => {
      if (!id) return 'N/A';
      return id.startsWith('@') ? id : `@${id}`;
  };
  const displayWalletId = getCleanWalletId(selectedItem?.counterparty_wallet);

  // ✅ 1. LIST TIME FORMAT (HH:MM:SS)
  const formatTime24 = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-GB', { hour12: false }); // 14:30:05
  };

  // ✅ 2. RECEIPT DETAILED TIME FORMAT (HH:MM:SS.ms)
  const formatTimeDetail = (dateStr: string) => {
      const d = new Date(dateStr);
      return `${d.toLocaleTimeString('en-GB', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`;
  };

  // ✅ 3. FULL DATE FORMAT
  const getFullDate = (dateStr: string) => {
      return new Date(dateStr).toDateString(); // e.g. "Fri Jan 29 2026"
  };

  // Progress Logic
  const getProgressLabel = (progressStr: string) => {
      if (!progressStr || !progressStr.includes('/')) return null;
      const [paid, total] = progressStr.split('/').map(Number);
      const isComplete = paid === total;
      return { 
          text: isComplete ? "Completed" : `${paid} of ${total} Paid`, 
          status: isComplete ? "Success" : "Pending",
          color: isComplete ? '#10B981' : '#F59E0B' 
      };
  };
  const progressInfo = selectedItem?.progress ? getProgressLabel(selectedItem.progress) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* 🛡️ PIN MODAL */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay} keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}>
            <TouchableOpacity style={{flex:1}} activeOpacity={1} onPress={() => setShowPinModal(false)} />
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />
                <Text style={styles.sheetTitle}>Authorize Payment</Text>
                <Text style={styles.sheetSub}>
                    Pay Share: <Text style={{color: '#6A0DAD', fontWeight: '800'}}>₦{parseFloat(selectedItem?.amount || 0).toLocaleString()}</Text>
                    {"\n"}to {selectedItem?.first_name || 'Initiator'}
                </Text>
                <TextInput style={styles.pinInput} placeholder="****" placeholderTextColor="#CBD5E1" keyboardType="numeric" maxLength={4} secureTextEntry value={pin} onChangeText={setPin} autoFocus />
                <TouchableOpacity style={styles.payBtn} onPress={handleAcceptRequest} disabled={processing}>
                    {processing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payBtnText}>Confirm Payment</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={{marginTop: 15}} onPress={() => setShowPinModal(false)}>
                    <Text style={{color: '#EF4444', fontWeight: '600'}}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🧾 MATURE RECEIPT MODAL */}
      <Modal visible={showReceipt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.receipt, isFailed && styles.receiptFailedBorder]}>
            
            {/* ✨ ANIMATED HEADER */}
            {isFailed ? (
                <View style={[styles.statusIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="warning" size={50} color="#EF4444" />
                </View>
            ) : (
                <AnimatedSuccessIcon visible={showReceipt} />
            )}

            <Text style={[styles.receiptTitle, isFailed && {color: '#EF4444'}]}>
                {isFailed ? 'Transaction Failed' : 'Transaction Successful'}
            </Text>
            
            <View style={styles.receiptBody}>
                {/* 🏷️ FIXED LABEL */}
                <ReceiptRow label="Service" value={selectedItem?.pretty_type === 'SPLIT_PAY' || selectedItem?.flow_type ? "Split Payment" : (selectedItem?.pretty_type || "Transfer")} />
                
                {/* 🚦 INITIATOR TRACKING STATUS */}
                {progressInfo && (
                    <ReceiptRow label="Split Status" value={progressInfo.text} isBold color={progressInfo.color} />
                )}
                
                <ReceiptRow label="Beneficiary" value={selectedItem?.counterparty_name || selectedItem?.first_name || "User"} />
                <ReceiptRow label="Wallet ID" value={displayWalletId} />
                <ReceiptRow label="Amount" value={`₦${parseFloat(selectedItem?.amount || 0).toLocaleString()}`} isBold />
                
                <View style={styles.divider} />
                
                {/* ✅ FULL DATE & MILLISECOND TIME */}
                <ReceiptRow label="Transaction Date" value={selectedItem ? getFullDate(selectedItem.created_at || selectedItem.date) : ""} />
                <ReceiptRow label="Timestamp" value={selectedItem ? formatTimeDetail(selectedItem.created_at || selectedItem.date) : ""} />
                
                <ReceiptRow label="Reference" value={String(selectedItem?.id || 'N/A').toUpperCase()} isCopyable />
            </View>

            <TouchableOpacity style={[styles.closeBtn, isFailed && {backgroundColor: '#EF4444'}]} onPress={() => setShowReceipt(false)}>
              <Text style={styles.closeBtnText}>Close Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1A1A1A" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Activity & Logs</Text>
        <TouchableOpacity onPress={() => setShowFilter(true)}><Ionicons name="filter" size={24} color="#6A0DAD" /></TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'Transactions' && styles.activeTab]} onPress={() => setActiveTab('Transactions')}>
          <Text style={[styles.tabText, activeTab === 'Transactions' && styles.activeTabText]}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Activities' && styles.activeTab]} onPress={() => setActiveTab('Activities')}>
          <Text style={[styles.tabText, activeTab === 'Activities' && styles.activeTabText]}>Requests</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#6A0DAD" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {['Today', 'Yesterday', 'Older'].map((day, dIdx) => groupedData[day].length > 0 && (
            <View key={dIdx}>
              <Text style={styles.dayHeader}>{day}</Text>
              {groupedData[day].map((item, idx) => {
                const credit = item.direction === 'CREDIT';
                const failed = item.status?.toLowerCase() === 'failed';
                const isIncoming = item.flow_type === 'INCOMING'; 
                const isOutgoing = item.flow_type === 'OUTGOING';

                let iconName = "arrow-up";
                let iconColor = "#6A0DAD";
                let iconBg = "#F3E8FF";    
                let actionText = "";

                if (activeTab === 'Activities') {
                    if (isIncoming) {
                        iconName = "notifications"; iconColor = "#0284C7"; iconBg = "#E0F2FE"; 
                        actionText = "TAP TO PAY";
                    } else if (isOutgoing) {
                        iconName = "people"; iconColor = "#6A0DAD"; iconBg = "#F3E8FF"; 
                        actionText = item.progress ? `Progress: ${item.progress}` : "Tracking";
                    }
                } else {
                    if (credit) { iconName = "arrow-down"; iconColor = "#10B981"; iconBg = "#ECFDF5"; } 
                    if (failed) { iconName = "alert"; iconColor = "#EF4444"; iconBg = "#FEE2E2"; } 
                    if (item.pretty_type === 'Split Payment') { iconName = "people"; }
                }

                return (
                  <TouchableOpacity key={idx} style={styles.card} onPress={() => handleItemPress(item)}>
                    <View style={[styles.cardIcon, { backgroundColor: iconBg }]}>
                      <Ionicons name={iconName as any} size={22} color={iconColor} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={styles.typeText} numberOfLines={1}>
                          {activeTab === 'Activities' ? (item.description || "Request") : (item.counterparty_name || "Transfer")}
                      </Text>
                      {/* ✅ 24H TIME IN LOG */}
                      <Text style={styles.dateText}>
                          {formatTime24(item.created_at || item.date)} • {isOutgoing ? "Pending" : (item.pretty_type || "Transaction")}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.amountText, {color: '#1A1A1A'}]}>
                          {activeTab === 'Activities' ? '' : (credit ? '+' : '-')}₦{parseFloat(item.amount || 0).toLocaleString()}
                      </Text>
                      
                      {activeTab === 'Activities' && isIncoming ? (
                          <View style={styles.actionBadge}>
                              <Text style={styles.actionBadgeText}>{actionText}</Text>
                          </View>
                      ) : (
                          <View style={[styles.statusBadge, (failed || isOutgoing) && {backgroundColor: '#FEF2F2'}]}>
                              <Text style={[styles.statusBadgeText, (failed || isOutgoing) && {color: '#F59E0B'}]}>
                                  {isOutgoing ? 'PENDING' : (item.status?.toUpperCase() || 'SUCCESS')}
                              </Text>
                          </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          {filteredData.length === 0 && <Text style={styles.emptyText}>No activity found.</Text>}
        </ScrollView>
      )}

      {/* FILTER MODAL */}
      <Modal visible={showFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />
                <Text style={styles.sheetTitle}>Filter by Month</Text>
                <View style={styles.monthGrid}>
                    {months.map((m, i) => (
                        <TouchableOpacity key={m} style={[styles.monthBtn, selectedMonth === i && styles.activeMonthBtn]} onPress={() => setSelectedMonth(i)}>
                            <Text style={[styles.monthText, selectedMonth === i && {color: '#FFF'}]}>{m}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilter(false)}><Text style={{color: '#FFF', fontWeight: '800'}}>Apply Filter</Text></TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const ReceiptRow = ({ label, value, isBold, color, isCopyable }: any) => (
  <View style={styles.rRow}>
    <Text style={styles.rLabel}>{label}</Text>
    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end'}}>
        <Text style={[styles.rVal, isBold && { color: color || '#6A0DAD', fontWeight: '900' }]} numberOfLines={1} ellipsizeMode="middle">{value || '...'}</Text>
        {isCopyable && (
            <TouchableOpacity onPress={() => { Clipboard.setString(String(value)); Alert.alert("Copied", "Reference copied."); }} style={{marginLeft: 8, padding: 4}}>
                <Ionicons name="copy-outline" size={16} color="#94A3B8" />
            </TouchableOpacity>
        )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFF', elevation: 2 },
  tabText: { fontSize: 13, color: '#94A3B8', fontWeight: '700' },
  activeTabText: { color: '#6A0DAD' },
  dayHeader: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', marginVertical: 15, textTransform: 'uppercase' },
  
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 18, backgroundColor: '#F9FAFB', borderRadius: 22 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  dateText: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '500' }, 
  amountText: { fontSize: 16, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }, 
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#ECFDF5', borderRadius: 6, marginTop: 4 },
  statusBadgeText: { fontSize: 9, fontWeight: '800', color: '#10B981' },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#E0F2FE', borderRadius: 6, marginTop: 4 },
  actionBadgeText: { fontSize: 9, fontWeight: '800', color: '#0284C7' },

  loader: { flex: 1, justifyContent: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  receipt: { width: '88%', backgroundColor: '#FFF', borderRadius: 32, padding: 25, alignSelf: 'center', marginBottom: 'auto', marginTop: 'auto' },
  receiptFailedBorder: { borderWidth: 2, borderColor: '#FEE2E2' },
  statusIcon: { width: 70, height: 70, borderRadius: 35, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  receiptTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 20, color: '#1A1A1A' },
  receiptBody: { borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 10 },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15, width: '100%' },
  rRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', alignItems: 'center' },
  rLabel: { color: '#64748B', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  rVal: { fontWeight: '700', fontSize: 14, color: '#1E293B', textAlign: 'right', flexShrink: 1 },
  
  closeBtn: { marginTop: 25, backgroundColor: '#6A0DAD', padding: 18, borderRadius: 20, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontWeight: '800' },
  
  bottomSheet: { backgroundColor: '#FFF', width: '100%', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#EEE', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  sheetSub: { color: '#64748B', marginBottom: 20, textAlign: 'center' },
  pinInput: { width: '60%', borderBottomWidth: 2, borderColor: '#6A0DAD', fontSize: 28, textAlign: 'center', letterSpacing: 10, marginBottom: 25, color: '#1A1A1A', alignSelf: 'center' },
  payBtn: { backgroundColor: '#1A1A1A', width: '100%', padding: 18, borderRadius: 16, alignItems: 'center' },
  payBtnText: { color: '#FFF', fontWeight: '800' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  monthBtn: { padding: 12, width: '30%', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10 },
  activeMonthBtn: { backgroundColor: '#6A0DAD' },
  monthText: { fontWeight: '700', color: '#64748B' },
  applyBtn: { marginTop: 20, backgroundColor: '#1A1A1A', padding: 18, borderRadius: 15, alignItems: 'center' }
});