import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BankLimitsScreen() {
  const router = useRouter();

  // Mock data for the demo
  const [dailyLimit, setDailyLimit] = useState(500000);
  const spentToday = 125000;

  const handleIncreaseRequest = () => {
    Alert.alert(
      "Limit Increase", 
      "Our AI is analyzing your transaction history. You will receive an update in 2-5 minutes.",
      [{ text: "Understood" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Limits</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section: Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>DAILY SPENDING PROGRESS</Text>
          <Text style={styles.amountText}>
            ₦{spentToday.toLocaleString()} <Text style={styles.limitTotal}>/ ₦{dailyLimit.toLocaleString()}</Text>
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${(spentToday / dailyLimit) * 100}%` }]} />
          </View>
          <Text style={styles.helperText}>You have ₦{(dailyLimit - spentToday).toLocaleString()} left for today.</Text>
        </View>

        {/* Section: Individual Limits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Limits</Text>
          
          <LimitRow 
            icon="card-outline" 
            title="POS & Web" 
            desc="Daily limit for card transactions" 
            amount="₦200,000" 
          />
          <LimitRow 
            icon="swap-horizontal-outline" 
            title="Transfers" 
            desc="Daily bank-to-bank transfers" 
            amount="₦300,000" 
          />
          <LimitRow 
            icon="cash-outline" 
            title="ATM Withdrawal" 
            desc="Daily cash limit" 
            amount="₦100,000" 
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.requestButton} onPress={handleIncreaseRequest}>
          <Text style={styles.requestButtonText}>Request Limit Increase</Text>
          <Ionicons name="trending-up" size={20} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Limits are determined by your Identity Tier and AI-calculated Trust Score.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper Component
const LimitRow = ({ icon, title, desc, amount }: any) => (
  <View style={styles.limitRow}>
    <View style={styles.limitIconBg}>
      <Ionicons name={icon} size={20} color="#6A0DAD" />
    </View>
    <View style={{ flex: 1, marginLeft: 15 }}>
      <Text style={styles.limitTitle}>{title}</Text>
      <Text style={styles.limitDesc}>{desc}</Text>
    </View>
    <Text style={styles.limitAmount}>{amount}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  backBtn: { padding: 8 },
  content: { padding: 20 },
  
  statusCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginBottom: 30, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statusLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 },
  amountText: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 15 },
  limitTotal: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  progressContainer: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  progressBar: { height: '100%', backgroundColor: '#6A0DAD', borderRadius: 5 },
  helperText: { fontSize: 12, color: '#6B7280' },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 15 },
  limitRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 12 },
  limitIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  limitTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  limitDesc: { fontSize: 12, color: '#9CA3AF' },
  limitAmount: { fontSize: 15, fontWeight: '700', color: '#6A0DAD' },

  requestButton: { backgroundColor: '#6A0DAD', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 18, gap: 10 },
  requestButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  footerNote: { textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginTop: 20, lineHeight: 16, paddingHorizontal: 20 }
});