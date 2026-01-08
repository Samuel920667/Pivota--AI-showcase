import React from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView } from 'react-native';
import { Colors } from '../constants/theme';
import { SPENDING_CATEGORIES } from '../mocks/data';

export default function StatisticsScreen() {
  const formatNaira = (num: number) => `₦${num.toLocaleString()}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Summary Cards Row */}
        <View style={styles.summaryRow}>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.statLabel}>Total Sent</Text>
            <Text style={[styles.statAmount, { color: '#EF4444' }]}>{formatNaira(350000)}</Text>
            <Text style={styles.statSub}>12 transactions</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
            <Text style={styles.statLabel}>Received</Text>
            <Text style={[styles.statAmount, { color: '#22C55E' }]}>{formatNaira(850000)}</Text>
            <Text style={styles.statSub}>5 transactions</Text>
          </View>
        </View>

        {/* Spending Breakdown Section */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Spending Breakdown</Text>
          
          {/* Custom Bar Chart */}
          <View style={styles.chartContainer}>
            {SPENDING_CATEGORIES.map((cat) => (
              <View key={cat.id} style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { height: cat.percentage * 2, backgroundColor: cat.color }]} />
                <Text style={styles.chartLabel}>{cat.percentage}%</Text>
              </View>
            ))}
          </View>

          {/* Legend List */}
          {SPENDING_CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </View>
              <Text style={styles.categoryAmount}>{formatNaira(cat.amount)}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { width: '48%', padding: 15, borderRadius: 20 },
  statLabel: { fontSize: 13, color: '#4B5563', marginBottom: 5 },
  statAmount: { fontSize: 18, fontWeight: 'bold' },
  statSub: { fontSize: 11, color: '#6B7280', marginTop: 5 },
  breakdownSection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  chartContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'flex-end', 
    height: 150, 
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  chartBarWrapper: { alignItems: 'center' },
  chartBar: { width: 30, borderRadius: 8 },
  chartLabel: { fontSize: 10, marginTop: 5, color: '#6B7280' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 15 },
  categoryName: { fontSize: 15, fontWeight: '500' },
  categoryAmount: { fontSize: 15, fontWeight: '600' },
});