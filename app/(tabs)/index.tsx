import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  Alert, Image, RefreshControl, Modal, Share, ActivityIndicator, Dimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Internal Dependencies
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext'; 

const { width } = Dimensions.get('window');

// --- 1. PRECISE DATE FORMATTER (24H + Milliseconds) ---
const formatDate = (dateString: string) => {
    if (!dateString) return "Processing...";
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return "Unknown";

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    // 24-Hour Format with Seconds & Milliseconds
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');

    // Result: Jan 28, 14:45:12.345
    return `${month} ${day}, ${hours}:${minutes}:${seconds}.${ms}`;
};

const formatStatus = (status: string) => {
    if (!status) return "";
    const lower = status.toLowerCase();
    if (lower === 'success') return "Successful";
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

// --- ACTION BUTTON COMPONENT ---
const ActionBtn = ({ icon, label, color, iconColor, onPress }: any) => (
  <TouchableOpacity style={styles.actionBtnContainer} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.actionIconCircle, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color={iconColor} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

// --- PROFESSIONAL QUICK TIPS DATA ---
const PROMO_ITEMS = [
    { 
        id: 1, 
        title: "Pivota AI Shield", 
        desc: "Real-time fraud detection active.", 
        color: "#F0F9FF", 
        icon: "shield-checkmark", 
        iconColor: "#0284C7" // Professional Blue
    },
    { 
        id: 2, 
        title: "Smart Splitting", 
        desc: "Track shared expenses effortlessly.", 
        color: "#FAF5FF", 
        icon: "pie-chart", 
        iconColor: "#7E22CE" // Professional Purple
    },
    { 
        id: 3, 
        title: "Instant Settlements", 
        desc: "Zero-latency transfers verified.", 
        color: "#ECFDF5", 
        icon: "flash", 
        iconColor: "#059669" // Professional Green
    },
];

const PromoCarousel = () => {
    const scrollRef = useRef<ScrollView>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => {
                const nextIndex = prev === PROMO_ITEMS.length - 1 ? 0 : prev + 1;
                scrollRef.current?.scrollTo({ x: nextIndex * (width - 40), animated: true });
                return nextIndex;
            });
        }, 5000); // 5 Seconds per slide for readability
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.promoContainer}>
            <ScrollView 
                ref={scrollRef} 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false} 
            >
                {PROMO_ITEMS.map((item) => (
                    <View key={item.id} style={[styles.promoCard, { backgroundColor: item.color, width: width - 40 }]}>
                        <View style={[styles.promoIcon, { backgroundColor: '#FFFFFF' }]}>
                            <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={[styles.promoTitle, { color: '#1F2937' }]}>{item.title}</Text>
                            <Text style={styles.promoDesc}>{item.desc}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

export default function Dashboard() {
  const router = useRouter();
  const { userToken, userInfo, logout } = useAuth();
  
  // --- UI STATES ---
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false); 
  const [showAccountModal, setShowAccountModal] = useState(false); 
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // 🛡️ SECURITY STATUS
  const [securityStatus, setSecurityStatus] = useState("Verifying Security...");
  const [isScanning, setIsScanning] = useState(true);
  const [riskColor, setRiskColor] = useState("#6A0DAD");

  // --- DATA STATES ---
  const [firstName, setFirstName] = useState(userInfo?.first_name || "User");
  const [lastName, setLastName] = useState(userInfo?.last_name || "");
  const [balance, setBalance] = useState(userInfo?.wallet_balance || 0);
  const [walletId, setWalletId] = useState(userInfo?.wallet_id || "Loading..."); 
  const [phoneNumber, setPhoneNumber] = useState(userInfo?.phone_number || "..."); 
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const hasCheckedRequests = useRef(false);
  const hasShownWelcome = useRef(false);

  // --- CORE FETCH LOGIC ---
  const fetchDashboardData = useCallback(async () => {
    setIsScanning(true);
    setSecurityStatus("Verifying Security...");
    setRiskColor("#6A0DAD");

    try {
      // 1. Load Profile Image
      try {
        const savedImage = await AsyncStorage.getItem('lastProfileImage');
        if (savedImage) setProfileImage(savedImage);
      } catch (e) { console.log("Image Load Error", e); }

      let token = userToken;
      if (!token) token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };

      // A. Profile & Balance
      const profileRes = await API.get('/api/user/profile', config);
      if (profileRes.data) {
        const data = profileRes.data.data || profileRes.data; 
        
        const fName = data.first_name || userInfo?.first_name || "User";
        const lName = data.last_name || userInfo?.last_name || "";
        
        setFirstName(fName);
        setLastName(lName);
        setBalance(parseFloat(String(data.wallet_balance || 0)));
        setWalletId(data.wallet_id || "Generating...");
        setPhoneNumber(data.phone_number || "N/A");

        if (!hasShownWelcome.current && !userInfo?.wallet_id && data.wallet_id) {
            setShowWelcomeModal(true);
            hasShownWelcome.current = true;
        }
      }

      // B. Transaction History
      const txRes = await API.get('/api/transactions/history', config); 
      if (txRes.data && Array.isArray(txRes.data)) {
        setTransactions(txRes.data.map((item: any) => ({
            id: item.transaction_ref,
            type: item.counterparty_name || item.description || "Transaction", 
            rawDate: item.created_at, 
            amount: parseFloat(item.amount),
            direction: item.direction, 
            status: item.status,
            // Add additional fields for request identification
            transaction_type: item.transaction_type || 'transfer',
            request_id: item.request_id || null,
            initiator_id: item.initiator_id || null,
            recipient_id: item.recipient_id || null
        })));
      }

      // C. 🛡️ LIVE SECURITY ANALYSIS
      try {
          const heatmapRes = await API.get('/api/transactions/heatmap', config);
          const hasHighRisk = heatmapRes.data && Array.isArray(heatmapRes.data) 
            ? heatmapRes.data.some((p: any) => p.hotspot_level === 'High') 
            : false;
          
          setTimeout(() => {
              setIsScanning(false);
              if (hasHighRisk) {
                  setSecurityStatus("Security Alert: High Risk");
                  setRiskColor("#EF4444");
              } else {
                  setSecurityStatus("Environment Secure");
                  setRiskColor("#10B981");
              }
          }, 1800);
      } catch (err) {
          setIsScanning(false);
          setSecurityStatus("System Protected");
          setRiskColor("#6B7280");
      }

    } catch (error) {
      console.log("Dashboard Fetch Error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [userToken, userInfo]);

  // --- REQUEST POLLING - UPDATED TO EXCLUDE INITIATOR ---
  const checkForRequests = async () => {
      if (!userInfo?.id) return;
      try {
          let token = await AsyncStorage.getItem('userToken');
          if (!token) return;
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const notifRes = await API.get(`/api/transactions/notifications/${userInfo.id}`, config);
          
          if (notifRes.data && notifRes.data.length > 0) {
              // Filter out requests where current user is the initiator
              const incomingRequests = notifRes.data.filter((request: any) => {
                  // Check if current user is NOT the initiator
                  // Assuming request has initiator_id field
                  const isInitiator = request.initiator_id === userInfo.id || 
                                     request.requestor_id === userInfo.id;
                  return !isInitiator && request.status === 'pending';
              });
              
              if (incomingRequests.length > 0) {
                  setPendingRequest(incomingRequests[0]); 
                  setShowRequestModal(true);          
              } else {
                  // Clear any pending request if current user is the initiator
                  setPendingRequest(null);
                  setShowRequestModal(false);
              }
          }
      } catch (e) { console.log("Request check error:", e); }
  };

  useFocusEffect(
    useCallback(() => {
        if (!userToken) return;
        fetchDashboardData();
        const interval = setInterval(() => { 
            if (userToken) {
                fetchDashboardData(); 
                checkForRequests();
            }
        }, 12000);
        return () => clearInterval(interval);
    }, [userToken, fetchDashboardData])
  );

  const onRefresh = () => { 
    setRefreshing(true); 
    fetchDashboardData(); 
    checkForRequests(); 
  };
  
  const copyToClipboard = async (text: string) => { 
    await Clipboard.setStringAsync(text); 
    Alert.alert("Copied!");
  };
  
  const handleShareDetails = async () => { 
    try { 
      await Share.share({ 
        message: `Pivota Account: ${firstName} ${lastName}\nID: ${walletId}` 
      }); 
    } catch (e) {} 
  };
  
  const handleLogout = () => { 
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" }, 
      { text: "Log Out", style: "destructive", onPress: () => logout() }
    ]); 
  };

  const getStatusColor = (status: string) => {
      const s = status?.toUpperCase();
      if (s === 'SUCCESS') return '#10B981';
      if (s === 'PENDING') return '#F59E0B';
      if (s === 'FAILED') return '#EF4444';
      return '#6B7280';
  };

  const isModalOpen = showAccountModal || showWelcomeModal || showRequestModal;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style={isModalOpen ? "light" : "dark"} backgroundColor={isModalOpen ? "rgba(0,0,0,0.5)" : "#F8F9FB"} translucent={true} />

      {/* --- INCOMING REQUEST MODAL - ONLY SHOWS TO RECIPIENT, NOT INITIATOR --- */}
      <Modal visible={showRequestModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
            <View style={styles.popupCard}>
                <TouchableOpacity style={styles.closePopup} onPress={() => setShowRequestModal(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
                <View style={styles.popupIcon}>
                  <Ionicons name="notifications" size={32} color="#6A0DAD" />
                </View>
                <Text style={styles.popupTitle}>Money Request</Text>
                <Text style={styles.popupDesc}>
                  <Text style={{fontWeight:'700'}}>
                    {pendingRequest?.first_name} {pendingRequest?.last_name}
                  </Text> is requesting money.
                </Text>
                <Text style={styles.popupAmount}>
                  ₦{Number(pendingRequest?.total_amount).toLocaleString()}
                </Text>
                <Text style={styles.popupReason}>
                  {pendingRequest?.description ? `"${pendingRequest.description}"` : ""}
                </Text>
                <TouchableOpacity style={styles.linkBtn} onPress={() => { 
                  setShowRequestModal(false); 
                  router.push({ 
                    pathname: "/accept-request", 
                    params: { 
                      id: pendingRequest?.request_code, 
                      amount: pendingRequest?.total_amount, 
                      name: `${pendingRequest?.first_name} ${pendingRequest?.last_name}`, 
                      reason: pendingRequest?.description 
                    } 
                  }); 
                }}>
                    <Text style={styles.linkBtnText}>View Request</Text>
                    <Ionicons name="arrow-forward" size={16} color="#6A0DAD" />
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* --- ACCOUNT DETAILS MODAL --- */}
      <Modal animationType="fade" transparent visible={showAccountModal} onRequestClose={() => setShowAccountModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowAccountModal(false)} />
          <View style={styles.accountModalContent}>
            <View style={styles.accountModalHeader}>
              <Text style={styles.accountModalTitle}>Account Details</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <View>
                    <Text style={styles.detailLabel}>BANK NAME</Text>
                    <Text style={styles.detailValue}>Pivota Bank</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View>
                    <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
                    <Text style={styles.detailValue}>{phoneNumber}</Text>
                  </View>
                  <TouchableOpacity onPress={() => copyToClipboard(phoneNumber)} style={styles.copyIconBtn}>
                    <Ionicons name="copy-outline" size={20} color="#6A0DAD" />
                  </TouchableOpacity>
                </View>
                <View style={styles.detailRow}>
                  <View>
                    <Text style={styles.detailLabel}>ACCOUNT NAME</Text>
                    <Text style={styles.detailValue}>{firstName} {lastName}</Text>
                  </View>
                </View>
                <View style={[styles.detailRow, {borderBottomWidth: 0}]}>
                  <View>
                    <Text style={styles.detailLabel}>WALLET ID</Text>
                    <Text style={[styles.detailValue, {color: '#6A0DAD'}]}>{walletId}</Text>
                  </View>
                  <TouchableOpacity onPress={() => copyToClipboard(walletId)} style={styles.copyIconBtn}>
                    <Ionicons name="copy-outline" size={20} color="#6A0DAD" />
                  </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareDetails}>
              <Ionicons name="share-social-outline" size={20} color="#FFF" style={{marginRight: 8}}/>
              <Text style={styles.shareBtnText}>Share Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- WELCOME MODAL --- */}
      <Modal animationType="slide" transparent visible={showWelcomeModal} onRequestClose={() => setShowWelcomeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderIcon}>
              <Ionicons name="sparkles" size={40} color="#6A0DAD" />
            </View>
            <Text style={styles.modalTitle}>Welcome, {firstName}!</Text>
            <Text style={styles.modalSubtitle}>Your secure wallet is ready.</Text>
            <View style={styles.idContainer}>
                <Text style={styles.idLabel}>YOUR PIVOTA ID</Text>
                <TouchableOpacity style={styles.idBox} onPress={() => copyToClipboard(walletId)}>
                    <Text style={styles.idText}>{walletId}</Text>
                    <Ionicons name="copy-outline" size={20} color="#6A0DAD" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowWelcomeModal(false)}>
              <Text style={styles.modalCloseText}>Let's Go!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6A0DAD" />
      }>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.profileButton}
              activeOpacity={0.7}
              onPress={() => router.push('/profile-details')}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profileInitials}>{firstName?.[0] || "U"}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.nameColumn}>
              <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
              <View style={styles.securityRow}>
                  {isScanning ? (
                      <ActivityIndicator size="small" color="#6A0DAD" style={{ transform: [{ scale: 0.6 }], marginRight: -4 }} />
                  ) : (
                      <Ionicons name="shield-checkmark" size={14} color={riskColor} />
                  )}
                  <Text style={[styles.welcomeText, { color: riskColor, fontWeight: '700' }]}>{securityStatus}</Text>
              </View>
            </View>
          </View>

          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- BALANCE CARD --- */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
              <Ionicons name={hideBalance ? "eye-off-outline" : "eye-outline"} size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.4}>
              {hideBalance ? "****" : `₦${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-money' as any)}>
              <Ionicons name="add-outline" size={20} color="#6A0DAD" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.accountBadge} onPress={() => setShowAccountModal(true)}>
            <Text style={styles.accountText}>Account Details</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFF" style={{marginLeft: 5}} />
          </TouchableOpacity>
        </View>

        {/* --- MAIN ACTIONS --- */}
        <View style={styles.actionRow}>
          <ActionBtn icon="arrow-up-circle-outline" label="Send" color="#E1F5FE" iconColor="#0288D1" onPress={() => router.push('/send')} />
          <ActionBtn icon="arrow-down-circle-outline" label="Request" color="#E8F5E9" iconColor="#2E7D32" onPress={() => router.push('/request')} />
          <ActionBtn icon="pie-chart-outline" label="Split" color="#F3E8FF" iconColor="#6A0DAD" onPress={() => router.push('/split')} />
          <ActionBtn icon="shield-checkmark-outline" label="Heatmap" color="#FEE2E2" iconColor="#EF4444" onPress={() => router.push('/fraud-heatmap')} />
        </View>

        {/* --- RECENT ACTIVITY - SHOWS ALL TRANSACTIONS FOR EVERYONE --- */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/notifications')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <View style={{alignItems: 'center', marginTop: 20}}>
              <Text style={{color: '#9CA3AF'}}>No recent transactions</Text>
            </View>
          ) : (
             transactions.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={[styles.transIconBox, { 
                    backgroundColor: item.direction === 'CREDIT' ? '#DCFCE7' : '#FEE2E2' 
                  }]}>
                    <Ionicons 
                      name={item.direction === 'CREDIT' ? "arrow-down" : "arrow-up"} 
                      size={20} 
                      color={item.direction === 'CREDIT' ? "#166534" : "#B91C1C"} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.transName}>{item.type}</Text>
                      {/* ✅ PRECISE 24H TIME + MILLISECONDS */}
                      <Text style={styles.transDate}>{formatDate(item.rawDate)}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={[
                      styles.transAmount, 
                      { color: item.direction === 'CREDIT' ? "#10B981" : "#1A1A1A" }
                    ]}>
                      {item.direction === 'CREDIT' ? '+' : '-'}₦{Math.abs(item.amount).toLocaleString()}
                    </Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColor(item.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        { color: getStatusColor(item.status) }
                      ]}>
                        {formatStatus(item.status)}
                      </Text>
                    </View>
                  </View>
                </View>
             ))
          )}
        </View>

        {/* ✅ NEW: PROFESSIONAL QUICK TIPS */}
        <View style={styles.adSection}>
            <Text style={styles.sectionTitle}>Quick Tips</Text>
            <PromoCarousel />
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.floatingAiBtn} onPress={() => router.push('/chatbot')}>
        <Ionicons name="sparkles-outline" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  scrollContent: { padding: 20, paddingBottom: 110 }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  
  profileButton: { marginRight: 5 },
  profileImage: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#F3E8FF' },
  profilePlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F3E8FF' },
  profileInitials: { color: '#4338CA', fontWeight: '700', fontSize: 20 },

  nameColumn: { justifyContent: 'center' },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  welcomeText: { fontSize: 12 },
  iconCircle: { width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  balanceCard: { backgroundColor: '#6A0DAD', padding: 22, borderRadius: 24, marginBottom: 25 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceAmount: { color: '#FFF', fontSize: 32, fontWeight: '800', flex: 1, marginRight: 10 },
  addBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 5 },
  addBtnText: { color: '#6A0DAD', fontWeight: '700', fontSize: 14 },
  accountBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignSelf: 'flex-start' },
  accountText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  actionBtnContainer: { alignItems: 'center' },
  actionIconCircle: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  activitySection: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { color: '#6A0DAD', fontWeight: '700' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 10 },
  transIconBox: { width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  transName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  transDate: { fontSize: 11, color: '#9CA3AF' },
  transAmount: { fontSize: 15, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  floatingAiBtn: { position: 'absolute', bottom: 100, right: 25, width: 60, height: 60, backgroundColor: '#6A0DAD', borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  accountModalContent: { width: '90%', backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 10 },
  accountModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  accountModalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  detailsCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  detailLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#1A1A1A', fontWeight: '700' },
  copyIconBtn: { padding: 8, backgroundColor: '#F3E8FF', borderRadius: 8 },
  shareBtn: { flexDirection: 'row', backgroundColor: '#6A0DAD', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  shareBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  popupCard: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 25, alignItems: 'center', elevation: 10 },
  closePopup: { position: 'absolute', top: 15, right: 15, padding: 5 },
  popupIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  popupTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  popupDesc: { textAlign: 'center', color: '#6B7280', marginVertical: 5 },
  popupAmount: { fontSize: 28, fontWeight: '800', color: '#6A0DAD', marginVertical: 10 },
  popupReason: { fontSize: 14, fontStyle: 'italic', color: '#4B5563', marginBottom: 20 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#6A0DAD' },
  linkBtnText: { color: '#6A0DAD', fontWeight: '700', fontSize: 16 },
  idContainer: { width: '100%', marginBottom: 25 },
  idLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, textAlign: 'center', letterSpacing: 1 },
  idBox: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB' },
  idText: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  modalCloseBtn: { backgroundColor: '#6A0DAD', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 14, width: '100%', alignItems: 'center' },
  modalCloseText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  modalHeaderIcon: { marginBottom: 20, backgroundColor: '#F3E8FF', padding: 15, borderRadius: 50 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 25 },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center', elevation: 10 },
  
  // ✅ STYLES FOR PROFESSIONAL QUICK TIPS
  adSection: { marginTop: 10 },
  promoContainer: { marginTop: 10 },
  promoCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginRight: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  promoIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  promoTitle: { fontWeight: '800', fontSize: 14, marginBottom: 2 },
  promoDesc: { color: '#6B7280', fontSize: 12, fontWeight: '500' },
});