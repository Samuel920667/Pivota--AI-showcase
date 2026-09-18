import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, Image, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ Better for cross-platform
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard'; // ✅ Import Clipboard
import { useAuth } from '../../context/AuthContext'; 

interface SettingsItemProps {
  title: string;
  subtitle?: string;
  icon: any;
  color: string;
  onPress?: () => void;
  isDestructive?: boolean;
  hideChevron?: boolean;
}

const SettingsItem = ({ title, subtitle, icon, color, onPress, isDestructive, hideChevron }: SettingsItemProps) => (
  <TouchableOpacity 
    style={styles.item} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: isDestructive ? '#FEE2E2' : color + '15' }]}>
      <Ionicons name={icon} size={20} color={isDestructive ? '#EF4444' : color} />
    </View>
    <View style={styles.textContainer}>
      <Text style={[styles.itemTitle, isDestructive && { color: '#EF4444' }]}>{title}</Text>
      {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
    </View>
    {!hideChevron && !isDestructive && (
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, userInfo } = useAuth(); 

  const getInitials = () => {
    const f = userInfo?.first_name?.[0] || "";
    const l = userInfo?.last_name?.[0] || "";
    return (f + l).toUpperCase() || "U";
  };

  // ✅ COPY FUNCTION
  const copyWalletId = async () => {
    if (userInfo?.wallet_id) {
      await Clipboard.setStringAsync(userInfo.wallet_id);
      Alert.alert("Copied", "Wallet ID copied to clipboard.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => {
          logout(); 
          router.replace('/'); 
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userInfo?.first_name} {userInfo?.last_name}
            </Text>
            
            {/* ✅ COPYABLE WALLET ID */}
            <TouchableOpacity style={styles.walletTag} onPress={copyWalletId}>
              <Text style={styles.walletText}>ID: {userInfo?.wallet_id || "N/A"}</Text>
              <Ionicons name="copy-outline" size={14} color="#6B7280" style={{marginLeft: 6}}/>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profile-details')}>
             <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* 2. SECURITY GROUP */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>SECURITY & ACCOUNT</Text>
          <View style={styles.cardGroup}>
            <SettingsItem 
                title="Personal Information" 
                subtitle="Name, Email, Phone"
                icon="person-outline" 
                color="#6A0DAD" 
                onPress={() => router.push('/profile-details')} 
            />
            <View style={styles.divider} />
            <SettingsItem 
                title="Transaction Limits" 
                subtitle="View your daily transfer cap"
                icon="speedometer-outline" 
                color="#3B82F6" 
                onPress={() => router.push('/limits' as any)} 
            />
            <View style={styles.divider} />
            <SettingsItem 
                title="Biometrics" 
                subtitle="Face ID / Fingerprint"
                icon="finger-print-outline" 
                color="#10B981" 
                onPress={() => router.push('/biometrics')} 
            />
            <View style={styles.divider} />
            <SettingsItem 
                title="Change PIN" 
                icon="lock-closed-outline" 
                color="#F59E0B" 
            />
          </View>
        </View>

        {/* 3. SUPPORT GROUP */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.cardGroup}>
            <SettingsItem 
                title="Help Center" 
                subtitle="FAQ, Live Chat"
                icon="chatbubbles-outline" 
                color="#8B5CF6" 
                onPress={() => router.push('/help-center')} 
            />
            <View style={styles.divider} />
            <SettingsItem 
                title="Legal & Policy" 
                icon="document-text-outline" 
                color="#6B7280" 
            />
          </View>
        </View>

        {/* 4. LOGOUT */}
        <View style={[styles.sectionContainer, { marginBottom: 20 }]}>
           <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Log Out</Text>
           </TouchableOpacity>
           <Text style={styles.versionText}>v1.0.2 • Pivota Secure</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' }, // Consistent bg
  
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 18, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  
  // ✅ FIXED SCROLLING
  scrollContent: { 
    padding: 20,
    paddingBottom: 100 // Extra space at bottom for scrolling
  },

  // PROFILE CARD
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E9D5FF'
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#6A0DAD' },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  
  // Wallet Tag
  walletTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  walletText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },

  editBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 20 },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#111827' },

  // SECTIONS
  sectionContainer: { marginBottom: 25 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 },
  
  cardGroup: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1
  },
  
  // ITEMS
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 60 },
  
  iconContainer: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  textContainer: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  itemSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // LOGOUT
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 15
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
  versionText: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontWeight: '500' }
});