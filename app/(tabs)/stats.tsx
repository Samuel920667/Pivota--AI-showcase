import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/theme';
import { SPENDING_CATEGORIES } from '../../mocks/data';

export default function StatsScreen() {
  const formatNaira = (num: number) => `₦${num.toLocaleString()}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Insights</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.statLabel}>Inflow</Text>
            <Text style={[styles.statAmount, { color: Colors.success }]}>{formatNaira(850000)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
            <Text style={styles.statLabel}>Outflow</Text>
            <Text style={[styles.statAmount, { color: Colors.danger }]}>{formatNaira(320500)}</Text>
          </View>
        </View>

        {/* Spending Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Categories</Text>
          {SPENDING_CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={[styles.iconBox, { backgroundColor: cat.color + '20' }]}>
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.catName}>{cat.name}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                </View>
              </View>
              <Text style={styles.catAmount}>{formatNaira(cat.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Fraud Metrics Summary */}
        <View style={[styles.section, styles.fraudSummary]}>
          <Text style={styles.sectionTitle}>Security Health</Text>
          <View style={styles.fraudRow}>
            <Text style={styles.fraudText}>Safe Transactions</Text>
            <Text style={styles.fraudValue}>98.2%</Text>
          </View>
          <View style={styles.fraudRow}>
            <Text style={styles.fraudText}>Blocked Threats</Text>
            <Text style={[styles.fraudValue, { color: Colors.danger }]}>14</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  scrollContent: { padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { width: '48%', padding: 16, borderRadius: 16 },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  statAmount: { fontSize: 18, fontWeight: '700' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 15, color: Colors.text },
  categoryCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  progressBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, marginTop: 8 },
  progressBarFill: { height: 6, borderRadius: 3 },
  catAmount: { fontSize: 14, fontWeight: '700', marginLeft: 10 },
  fraudSummary: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20 },
  fraudRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  fraudText: { color: '#4B5563', fontSize: 14 },
  fraudValue: { fontWeight: '700', fontSize: 14 }
});