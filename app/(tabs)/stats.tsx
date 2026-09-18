import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, RefreshControl, 
  ActivityIndicator, Dimensions, Animated, Easing 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import API from '../../api/api'; 
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// Professional Color Palette
const CATEGORY_COLORS: { [key: string]: string } = {
  "Food & Dining": "#F59E0B", // Amber
  "Transport": "#3B82F6",     // Blue
  "Shopping": "#EC4899",      // Pink
  "Bills & Utilities": "#8B5CF6", // Violet
  "Transfers": "#10B981",     // Emerald
  "Others": "#9CA3AF"         // Gray
};

export default function StatsScreen() {
  const { userToken, userInfo } = useAuth(); // ✅ Get User Info for Personalization
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Stats Data
  const [inflow, setInflow] = useState(0);
  const [outflow, setOutflow] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [securityStats, setSecurityStats] = useState({ safeRate: "100%", blocked: 0 });

  // Animation Values
  const slideAnim = useRef(new Animated.Value(50)).current; // Slide up
  const fadeAnim = useRef(new Animated.Value(0)).current;   // Fade in

  const firstName = userInfo?.first_name || "User";
  const isBroke = outflow > inflow;

  const formatNaira = (num: number) => `₦${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // --- ANIMATION TRIGGER ---
  const runAnimations = () => {
    slideAnim.setValue(50);
    fadeAnim.setValue(0);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  };

  // --- FETCH DATA ---
  const fetchFinancialData = async () => {
    try {
      const token = userToken || await AsyncStorage.getItem('userToken');
      if (!token) return;

      const res = await API.get('/api/transactions/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      processTransactions(res.data);
      runAnimations(); // Trigger animation on data load
    } catch (e) {
      console.log("Stats error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processTransactions = (data: any[]) => {
    let totalIn = 0;
    let totalOut = 0;
    let successCount = 0;
    let failCount = 0;
    
    const catMap: { [key: string]: number } = {
      "Food & Dining": 0, "Transport": 0, "Shopping": 0, 
      "Bills & Utilities": 0, "Transfers": 0, "Others": 0
    };

    data.forEach(tx => {
      const amt = parseFloat(tx.amount);
      const isSuccess = tx.status === 'SUCCESS';

      if (isSuccess) successCount++;
      else failCount++;

      if (isSuccess) {
        if (tx.direction === 'CREDIT') {
          totalIn += amt;
        } else {
          totalOut += amt;
          const cat = categorizeTransaction(tx.description, tx.pretty_type);
          catMap[cat] += amt;
        }
      }
    });

    const processedCats = Object.keys(catMap)
      .map((key, index) => ({
        id: index,
        name: key,
        amount: catMap[key],
        color: CATEGORY_COLORS[key],
        percentage: totalOut > 0 ? (catMap[key] / totalOut) * 100 : 0
      }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const totalTx = successCount + failCount;
    const safeRate = totalTx > 0 ? ((successCount / totalTx) * 100).toFixed(1) : "100.0";

    setInflow(totalIn);
    setOutflow(totalOut);
    setCategories(processedCats);
    setSecurityStats({ safeRate: `${safeRate}%`, blocked: failCount });
  };

  const categorizeTransaction = (desc: string, type: string) => {
    if (!desc) return "Others";
    const d = desc.toLowerCase();
    if (d.includes('food') || d.includes('eat') || d.includes('restauran')) return "Food & Dining";
    if (d.includes('uber') || d.includes('bolt') || d.includes('fuel') || d.includes('trip')) return "Transport";
    if (d.includes('airtime') || d.includes('data') || d.includes('electric') || d.includes('bill')) return "Bills & Utilities";
    if (d.includes('shop') || d.includes('store') || d.includes('market') || d.includes('mall')) return "Shopping";
    if (type === 'Split Payment' || type === 'Transfer') return "Transfers";
    return "Others";
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFinancialData();
  }, []);

  // --- SUB-COMPONENT: ANIMATED PROGRESS BAR ---
  const AnimatedBar = ({ percentage, color }: { percentage: number, color: string }) => {
    const widthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(widthAnim, {
        toValue: percentage,
        duration: 1000,
        delay: 300, // Slight delay for effect
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // Width cannot use native driver
      }).start();
    }, [percentage]);

    return (
      <View style={styles.progressBarBg}>
        <Animated.View 
          style={[
            styles.progressBarFill, 
            { 
              backgroundColor: color,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }) 
            }
          ]} 
        />
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.headerTitle}>Financial Insights</Text>
        <Text style={styles.headerDate}>{new Date().toDateString()}</Text>
      </Animated.View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        
        {/* 🚀 ANIMATED SLIDESHOW */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView 
            horizontal 
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false} 
            style={styles.slideShowContainer}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {/* Card 1: Personalized Advice */}
            <View style={[styles.adviceCard, isBroke ? styles.brokeCard : styles.wiseCard]}>
              <View style={styles.adviceIcon}>
                <Ionicons name={isBroke ? "alert-circle" : "wallet"} size={28} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adviceTitle}>
                  {isBroke ? `Ease up, ${firstName}!` : `Spending Wisely, ${firstName}!`}
                </Text>
                <Text style={styles.adviceSub}>
                  {isBroke 
                    ? `Your outflow is ₦${(outflow - inflow).toLocaleString()} higher than your inflow. Watch your spending!` 
                    : "You are in the green zone. Great financial management!"}
                </Text>
              </View>
            </View>

            {/* Card 2: Security */}
            <View style={[styles.adviceCard, { backgroundColor: '#111827', marginLeft: 15 }]}>
              <View style={styles.adviceIcon}>
                <Ionicons name="shield-checkmark" size={28} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adviceTitle}>Security Check</Text>
                <Text style={styles.adviceSub}>
                  Your account safety score is {securityStats.safeRate}. We blocked {securityStats.blocked} potential threats.
                </Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>

        {/* SUMMARY ROW */}
        <Animated.View style={[styles.summaryRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.statCard, styles.shadowProp, { backgroundColor: '#F0FDF4' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="arrow-down-outline" size={20} color="#16A34A" />
            </View>
            <Text style={styles.statLabel}>Total Inflow</Text>
            <Text style={[styles.statAmount, { color: '#15803D' }]}>{formatNaira(inflow)}</Text>
          </View>

          <View style={[styles.statCard, styles.shadowProp, { backgroundColor: '#FEF2F2' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="arrow-up-outline" size={20} color="#DC2626" />
            </View>
            <Text style={styles.statLabel}>Total Outflow</Text>
            <Text style={[styles.statAmount, { color: '#B91C1C' }]}>{formatNaira(outflow)}</Text>
          </View>
        </Animated.View>

        {/* CATEGORIES SECTION */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{new Date().toLocaleString('default', { month: 'long' })}</Text>
            </View>
          </View>
          
          <View style={styles.categoriesContainer}>
            {categories.length === 0 ? (
              <View style={styles.emptyState}>
                  <Ionicons name="bar-chart-outline" size={48} color="#E5E7EB" />
                  <Text style={styles.emptyText}>No spending data to analyze yet.</Text>
              </View>
            ) : (
              categories.map((cat, index) => (
                <View key={cat.id} style={styles.categoryCard}>
                  {/* Icon */}
                  <View style={[styles.iconBox, { backgroundColor: cat.color + '15' }]}>
                    <Ionicons 
                       name={cat.name.includes('Food') ? "fast-food" : cat.name.includes('Trans') ? "car" : "grid"} 
                       size={18} 
                       color={cat.color} 
                    />
                  </View>
                  
                  {/* Data */}
                  <View style={styles.catContent}>
                    <View style={styles.catRow}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catAmount}>{formatNaira(cat.amount)}</Text>
                    </View>
                    
                    {/* Animated Bar */}
                    <AnimatedBar percentage={cat.percentage} color={cat.color} />
                    
                    <Text style={styles.catPercent}>{cat.percentage.toFixed(1)}% of total outflow</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </Animated.View>

        {/* BOTTOM SPACER */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' }, // Slight gray background for premium feel
  
  // HEADER
  header: { paddingHorizontal: 24, paddingVertical: 15, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  headerDate: { fontSize: 14, fontWeight: '500', color: '#6B7280', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },

  scrollContent: { padding: 20 },
  
  // SLIDESHOW
  slideShowContainer: { marginBottom: 30, overflow: 'visible' },
  adviceCard: { 
    width: width * 0.85, 
    padding: 24, 
    borderRadius: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 130, // Taller for better presence
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5
  },
  brokeCard: { backgroundColor: '#EF4444' }, 
  wiseCard: { backgroundColor: '#059669' }, 
  adviceIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  adviceTitle: { color: '#FFF', fontWeight: '800', fontSize: 18, marginBottom: 6 },
  adviceSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18 },

  // SUMMARY ROW
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
  statCard: { width: '48%', padding: 20, borderRadius: 24, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  shadowProp: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 6 },
  statAmount: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  
  // CATEGORIES
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  badge: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#374151' },

  categoriesContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  categoryCard: { flexDirection: 'row', marginBottom: 25, alignItems: 'flex-start' },
  iconBox: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  
  catContent: { flex: 1, justifyContent: 'center' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  catAmount: { fontSize: 15, fontWeight: '800', color: '#111827' },
  
  progressBarBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, width: '100%', marginBottom: 6, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4 },
  catPercent: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#9CA3AF', marginTop: 12, fontWeight: '500' },
});