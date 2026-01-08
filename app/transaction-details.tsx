import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';


export default function TransactionDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Extract params (with fallbacks for safety)
  const amount = params.amount || '0';
  const recipient = params.type || 'Recipient';
  const status = params.status || 'Completed';
  const bank = params.bank || 'Pivota Bank';
  const refCode = `PIV-${Math.floor(100000 + Math.random() * 900000)}`;

  const onShare = async () => {
    try {
      await Share.share({
        message: `Pivota Transaction Success!\nSent: ₦${Number(amount).toLocaleString()}\nTo: ${recipient}\nBank: ${bank}\nRef: ${refCode}\nSecured by Pivota Guard.`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="close" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.receiptCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          
          <Text style={styles.successText}>Transaction Successful</Text>
          <Text style={styles.amountText}>₦{Number(amount).toLocaleString()}</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Recipient</Text>
            <Text style={styles.value}>{recipient}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Bank</Text>
            <Text style={styles.value}>{bank}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Ref Number</Text>
            <Text style={styles.value}>{refCode}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
          <Ionicons name="share-outline" size={22} color="#FFF" />
          <Text style={styles.shareBtnText}>Share Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.doneBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20, alignItems: 'center' },
  receiptCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  iconContainer: { alignItems: 'center', marginBottom: 15 },
  successText: { fontSize: 16, color: '#10B981', fontWeight: '600', textAlign: 'center' },
  amountText: { fontSize: 36, fontWeight: '800', textAlign: 'center', marginVertical: 15, color: '#1A1A1A' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20, borderStyle: 'dashed', borderWidth: 1, borderRadius: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  label: { color: '#6B7280', fontSize: 14 },
  value: { color: '#1A1A1A', fontSize: 14, fontWeight: '600' },
  shareBtn: { backgroundColor: Colors.primary || '#6A0DAD', width: '100%', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 30 },
  shareBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  doneBtn: { marginTop: 20, padding: 10 },
  doneBtnText: { color: '#6B7280', fontWeight: '600' }
});