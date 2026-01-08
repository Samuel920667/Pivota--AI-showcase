import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Share, // Fixes "Cannot find name Share"
  SafeAreaView // Fixes "Cannot find name SafeAreaView"
} from 'react-native';
import { useBanking } from '../contexts/BankingContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AccountDetailsScreen() {
  const { userPin, resetPin, balance } = useBanking();
  const [tempPin, setTempPin] = useState('');
  const router = useRouter();
  
  
  // Function to handle the account sharing
  const onShare = async () => {
    try {
      await Share.share({
        message: `Pivota Account Details\nName: Alicia\nAccount: 0123456789\nBank: Pivota Trust Node`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
    };
  // Mock User Data
  const userData = {
    accountName: "Alicia Doe",
    accountNumber: "0123456789",
    bankName: "Pivota Bank",
    phoneNumber: "+234 801 234 5678",
    userId: "PIV-9920-X"
  };

const handleUpdate = () => {
  if (tempPin.length === 4) {
    resetPin(tempPin);
    alert("PIN Updated Successfully!");
    setTempPin('');
  } else {
    alert("Please enter a 4-digit PIN");
  }
};

  const handleCopy = (text: string) => {
    // You could use Clipboard.setStringAsync(text) here later!
    alert(`Copied: ${text}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <DetailItem label="BANK NAME" value={userData.bankName} />
          <DetailItem 
            label="ACCOUNT NUMBER" 
            value={userData.accountNumber} 
            copyable 
            onCopy={() => handleCopy(userData.accountNumber)} 
          />
          <DetailItem label="ACCOUNT NAME" value={userData.accountName} />
          <DetailItem label="PHONE NUMBER" value={userData.phoneNumber} />
          <DetailItem label="USER ID" value={userData.userId} />
        </View>

        <TouchableOpacity 
          style={styles.shareBtn}
          onPress={() => Share.share({ message: `My Account Details: ${userData.bankName} - ${userData.accountNumber}` })}
        >
          <Ionicons name="share-social-outline" size={20} color="#FFF" />
          <Text style={styles.shareBtnText}>Share Details</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Helper Component for rows
function DetailItem({ label, value, copyable, onCopy }: any) {
  return (
    <View style={styles.detailRow}>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {copyable && (
        <TouchableOpacity onPress={onCopy}>
          <Ionicons name="copy-outline" size={20} color="#6A0DAD" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20 },
  infoCard: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 16, color: '#1A1A1A', fontWeight: '600' },
  shareBtn: { backgroundColor: '#6A0DAD', flexDirection: 'row', padding: 18, borderRadius: 15, marginTop: 30, justifyContent: 'center', alignItems: 'center' },
  shareBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 }
});