import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBanking } from '../../contexts/BankingContext';

const ActionBtn = ({ icon, label, color, iconColor, onPress }: any) => (
  <TouchableOpacity style={styles.actionBtnContainer} onPress={onPress}>
    <View style={[styles.actionIconCircle, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color={iconColor} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const { balance, transactions } = useBanking();
  const [hideBalance, setHideBalance] = useState(false);
  const router = useRouter();

  const recentTransactions = transactions.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.push('/settings' as any)}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop' }} 
                style={styles.avatar} 
              />
            </TouchableOpacity>
            <View style={styles.nameColumn}>
              <Text style={styles.greeting}>Hi, Alicia 👋</Text>
              <Text style={styles.welcomeText}>Your Pivota Shield is active.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
            <View style={styles.redDot} />
          </TouchableOpacity>
        </View>

        {/* BALANCE CARD */}
{/* BALANCE CARD */}
<View style={styles.balanceCard}>
  <View style={styles.balanceHeader}>
    <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
    {/* FIXED: The toggle button */}
    <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
      <Ionicons 
        name={hideBalance ? "eye-off-outline" : "eye-outline"} 
        size={22} 
        color="rgba(255,255,255,0.7)" 
      />
    </TouchableOpacity>
  </View>
  
  <View style={styles.balanceRow}>
    {/* FIXED: The conditional text */}
    <Text style={styles.balanceAmount}>
      {hideBalance ? "****" : `₦${balance.toLocaleString()}`}
    </Text>
    
    <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert("Add Money", "Transfer to: 3081234567")}>
      <Ionicons name="add-outline" size={20} color="#6A0DAD" />
      <Text style={styles.addBtnText}>Add</Text>
    </TouchableOpacity>
  </View>

  <View style={styles.accountBadge}>
    <Text style={styles.accountText}>Pivota Bank • 3081234567</Text>
  </View>
</View>
        {/* MAIN ACTIONS - UPDATED ICONS */}
        <View style={styles.actionRow}>
          <ActionBtn 
            icon="arrow-up-circle-outline" 
            label="Send" 
            color="#E1F5FE" 
            iconColor="#0288D1" 
            onPress={() => router.push('/send' as any)} 
          />
          <ActionBtn 
            icon="arrow-down-circle-outline" 
            label="Request" 
            color="#E8F5E9" 
            iconColor="#2E7D32" 
            onPress={() => router.push('/request' as any)} 
          />
          <ActionBtn 
            icon="pie-chart-outline" 
            label="Split" 
            color="#F3E8FF" 
            iconColor="#6A0DAD" 
            onPress={() => router.push('/split' as any)} 
          />
          <ActionBtn 
            icon="shield-checkmark-outline" 
            label="Heatmap" 
            color="#FEE2E2" 
            iconColor="#EF4444" 
            onPress={() => router.push('/fraud-map' as any)} 
          />
        </View>

        {/* RECENT ACTIVITY - UPDATED ICONS */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/transactions' as any)}>
               <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((item: any) => (
            <View key={item.id} style={styles.transactionItem}>
              <View style={styles.transIconBox}>
                <Ionicons 
                  name={item.amount > 0 ? "arrow-down-outline" : "arrow-up-outline"} 
                  size={20} 
                  color={item.amount > 0 ? "#10B981" : "#6A0DAD"} 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.transName}>{item.type}</Text>
                <Text style={styles.transDate}>{item.date}</Text>
              </View>
              <Text style={[styles.transAmount, { color: item.amount > 0 ? "#10B981" : "#1A1A1A" }]}>
                {item.amount > 0 ? '+' : ''}₦{Math.abs(item.amount).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FLOATING CHATBOT BUTTON */}
      <TouchableOpacity 
        style={styles.floatingAiBtn} 
        onPress={() => router.push('/chatbot' as any)}
      >
        <Ionicons name="sparkles-outline" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  nameColumn: { justifyContent: 'center' },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  welcomeText: { fontSize: 13, color: '#6B7280' },
  iconCircle: { width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  redDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 1.5, borderColor: '#FFF' },
  balanceCard: { backgroundColor: '#6A0DAD', padding: 22, borderRadius: 24, marginBottom: 25 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceAmount: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  addBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 5 },
  addBtnText: { color: '#6A0DAD', fontWeight: '700', fontSize: 14 },
  accountBadge: { marginTop: 15, backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 10, alignSelf: 'flex-start' },
  accountText: { color: '#FFF', fontSize: 11 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  actionBtnContainer: { alignItems: 'center' },
  actionIconCircle: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  activitySection: { flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { color: '#6A0DAD', fontWeight: '700' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 10 },
  transIconBox: { width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  transName: { fontSize: 14, fontWeight: '700' },
  transDate: { fontSize: 11, color: '#9CA3AF' },
  transAmount: { fontSize: 15, fontWeight: '800' },
  floatingAiBtn: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, backgroundColor: '#6A0DAD', borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 }
});