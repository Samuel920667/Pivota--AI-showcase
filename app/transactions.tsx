import React from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView } from 'react-native';
import { Colors } from '../constants/theme';

const MOCK_TRANSACTIONS = [
  { id: '1', name: 'Netflix Subscription', amount: -4500, date: '02 Jan 2026', status: 'Success' },
  { id: '2', name: 'Salary Credit', amount: 450000, date: '01 Jan 2026', status: 'Success' },
  { id: '3', name: 'Electricity Bill', amount: -12000, date: '30 Dec 2025', status: 'Pending' },
  { id: '4', name: 'Jumia Order', amount: -25000, date: '28 Dec 2025', status: 'Failed' },
];

export default function TransactionsPage() {
  const renderItem = ({ item }: any) => (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={styles.amountBox}>
        <Text style={[styles.amount, { color: item.amount > 0 ? Colors.success : Colors.text }]}>
          {item.amount > 0 ? '+' : ''}₦{Math.abs(item.amount).toLocaleString()}
        </Text>
        <Text style={[styles.status, { color: item.status === 'Failed' ? Colors.danger : Colors.textMuted }]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={MOCK_TRANSACTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  amountBox: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '700' },
  status: { fontSize: 12, marginTop: 4 },
});