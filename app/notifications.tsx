import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBanking } from '../contexts/BankingContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const { transactions } = useBanking();
  const [activeTab, setActiveTab] = useState('Transactions');

  // Logic to separate "Money movement" from "Requests/Splits"
  const filteredData = transactions.filter(item => {
    if (activeTab === 'Transactions') {
      return item.type.includes('Transfer') || item.type.includes('Deposit');
    }
    return item.type.includes('Split') || item.type.includes('Request');
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity & Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* TABS SWITCHER */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Transactions' && styles.activeTab]} 
          onPress={() => setActiveTab('Transactions')}
        >
          <Text style={[styles.tabText, activeTab === 'Transactions' && styles.activeTabText]}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Activities' && styles.activeTab]} 
          onPress={() => setActiveTab('Activities')}
        >
          <Text style={[styles.tabText, activeTab === 'Activities' && styles.activeTabText]}>Activities</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons 
                name={item.type.includes('Transfer') ? "arrow-up-circle" : "people-circle"} 
                size={24} color="#6A0DAD" 
              />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.typeText}>{item.type}</Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amountText}>₦{item.amount.toLocaleString()}</Text>
              <Text style={[styles.statusText, { color: item.status === 'Pending' ? '#F59E0B' : '#10B981' }]}>
                {item.status}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  activeTabText: { color: '#6A0DAD' },
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 15, backgroundColor: '#F9FAFB', borderRadius: 16 },
  cardIcon: { width: 45, height: 45, backgroundColor: '#EEE', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeText: { fontSize: 15, fontWeight: '600' },
  dateText: { fontSize: 12, color: '#9CA3AF' },
  amountText: { fontSize: 16, fontWeight: '700' },
  statusText: { fontSize: 12, fontWeight: '600' }
});