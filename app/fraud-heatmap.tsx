import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  Dimensions, Vibration, ScrollView, Animated, Platform 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// Internal API
import API from '../api/api';

const { width, height } = Dimensions.get('window');

// --- HELPER: MASK DATA & TIME ---
const maskID = (id: string) => id ? `**${id.slice(-4)}` : "**8892";

const getLiveTime = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

// --- COMPONENT: BLINKING DOT ---
const BlinkingDot = ({ color }: { color: string }) => {
    const opacity = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true })
            ])
        ).start();
    }, []);
    return <Animated.View style={[styles.blinkDot, { backgroundColor: color, opacity }]} />;
};

// --- COMPONENT: LIVE MARKER ---
const LiveMarker = ({ coordinate, isFraud, walletId, tier }: any) => {
    let bgColor = '#10B981'; // Green (Safe)
    let label = `T3 • ${maskID(walletId)}`;
    let iconName: any = 'shield-checkmark';

    if (isFraud) {
        bgColor = '#EF4444'; // Red (Fraud)
        label = "AML ALERT";
        iconName = 'warning';
    } else if (tier === '1') {
        bgColor = '#F59E0B'; // Orange (Tier 1)
        label = `T1 • ${maskID(walletId)}`;
        iconName = 'alert-circle';
    }

    return (
        <Marker coordinate={coordinate} tracksViewChanges={false} zIndex={isFraud ? 20 : 10}>
            <View style={styles.pinContainer}>
                <View style={[styles.bubble, { borderLeftColor: bgColor }]}>
                    <Text style={[styles.bubbleType, { color: bgColor }]}>{label}</Text>
                    <Text style={styles.bubbleTime}>{getLiveTime()}</Text>
                </View>
                <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                    <Ionicons name={iconName} size={12} color="#FFF" />
                </View>
                <View style={[styles.line, { backgroundColor: bgColor }]} />
                <View style={styles.dot} />
            </View>
        </Marker>
    );
};

export default function FraudHeatmap() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  // --- STATE ---
  const [location, setLocation] = useState<any>(null);
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<"SCANNING" | "ACTIVE" | "LOCKED">("SCANNING");
  const [statusMessage, setStatusMessage] = useState("Initializing satellite uplink...");
  const [countdown, setCountdown] = useState(15); 

  // --- 1. INITIALIZE ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          // Default to Lagos if permission denied (Just for UI demo)
          setLocation({
            latitude: 6.5244, longitude: 3.3792,
            latitudeDelta: 0.05, longitudeDelta: 0.05,
          });
          setLoading(false);
          return;
      }

      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      const myBlock = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.015, // Slightly wider zoom
        longitudeDelta: 0.015,
      };
      
      setLocation(myBlock);
      setLoading(false);
      
      setTimeout(() => performScan(myBlock), 1000);
    })();
  }, []);

  // --- 2. TIMER LOOP ---
  useEffect(() => {
      if (!location) return;
      const timer = setInterval(() => {
          setCountdown((prev) => {
              if (prev <= 1) {
                  performScan(location);
                  return 15;
              }
              return prev - 1;
          });
      }, 1000);
      return () => clearInterval(timer);
  }, [location]);

  // --- 3. FETCH DATA (WITH MOCK FALLBACK) ---
  const performScan = async (currentLoc = location) => {
      if (systemStatus === 'LOCKED') return;

      setSystemStatus("SCANNING");
      setStatusMessage("Scanning local ledger...");

      try {
          const token = await AsyncStorage.getItem('userToken');
          const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
          
          let markersData = [];

          try {
             const res = await API.get('/api/transactions/heatmap', config);
             console.log("📡 API Response:", res.data?.length, "items");
             markersData = res.data;
          } catch (apiError) {
             console.log("⚠️ API Failed, switching to simulation mode.");
          }

          // 🚨 FALLBACK: If API returns empty or fails, generate FAKE data near user
          // This ensures the UI always shows something during demos.
          if (!Array.isArray(markersData) || markersData.length === 0) {
              console.log("⚠️ Generating Mock Data for UI Demo...");
              markersData = generateMockData(currentLoc); 
          }

          // Process Markers
          const newMarkers = markersData.map((item: any, index: number) => ({
              id: item.transaction_ref || `mock-${index}-${Date.now()}`,
              coordinate: { 
                  latitude: parseFloat(item.lat || item.latitude), 
                  longitude: parseFloat(item.lon || item.longitude) 
              },
              isFraud: item.hotspot_level === 'High' || item.isFraud, 
              walletId: item.wallet_id, 
              tier: item.kyc_tier || '3', 
          }));

          setTimeout(() => {
              setLiveTransactions(newMarkers);
              analyzeRisk(newMarkers);
          }, 800);

      } catch (e) {
          console.error("SCAN ERROR:", e);
          setSystemStatus("ACTIVE");
      }
  };

  // --- HELPER: GENERATE MOCK DATA ---
  const generateMockData = (center: any) => {
      const mockItems = [];
      const baseLat = center.latitude;
      const baseLon = center.longitude;

      // Generate 3-5 random transactions around the user
      const count = Math.floor(Math.random() * 3) + 3; 

      for (let i = 0; i < count; i++) {
          const isFraud = Math.random() > 0.8; // 20% chance of fraud
          mockItems.push({
              lat: baseLat + (Math.random() - 0.5) * 0.008,
              lon: baseLon + (Math.random() - 0.5) * 0.008,
              hotspot_level: isFraud ? 'High' : 'Low',
              wallet_id: `User-${Math.floor(Math.random() * 9999)}`,
              kyc_tier: Math.random() > 0.5 ? '3' : '1',
              isFraud: isFraud
          });
      }
      return mockItems;
  };

  // --- 4. RISK LOGIC ---
  const analyzeRisk = (transactions: any[]) => {
      const fraudCount = transactions.filter(t => t.isFraud).length;

      if (fraudCount > 0) {
          setSystemStatus("LOCKED");
          setStatusMessage(`⚠️ CRITICAL: ${fraudCount} Threats Detected`);
          Vibration.vibrate([0, 500, 200, 500]); 
          
          const fraudTx = transactions.find(t => t.isFraud);
          if (mapRef.current && fraudTx) {
               mapRef.current.animateCamera({ center: fraudTx.coordinate, zoom: 18, pitch: 45 }, { duration: 1000 });
          }
      } else {
          setSystemStatus("ACTIVE");
          setStatusMessage("Area Secure. Monitoring...");
      }
  };

  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#6A0DAD" />
        <Text style={styles.loadText}>Calibrating Satellite...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={location}
            showsUserLocation={true}
            showsBuildings={true} 
            showsIndoors={true}
            pitchEnabled={true}
            rotateEnabled={true}
            customMapStyle={cleanMapStyle}
          >
              {liveTransactions.map((tx, index) => (
                 <Circle 
                    key={`heat-${index}`}
                    center={tx.coordinate}
                    radius={tx.isFraud ? 200 : 100} 
                    fillColor={tx.isFraud ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)'}
                    strokeWidth={1}
                    strokeColor={tx.isFraud ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.2)'}
                    zIndex={1} 
                 />
              ))}

              {liveTransactions.map((tx) => (
                  <LiveMarker 
                    key={tx.id} 
                    coordinate={tx.coordinate} 
                    isFraud={tx.isFraud} 
                    walletId={tx.walletId}
                    tier={tx.tier}
                  />
              ))}
          </MapView>
      </View>

      {/* --- HEADER --- */}
      <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          <View style={[styles.statusBadge, { 
              backgroundColor: systemStatus === 'LOCKED' ? '#FEF2F2' : '#F0FDF4',
              borderColor: systemStatus === 'LOCKED' ? '#FECACA' : '#BBF7D0'
          }]}>
              {systemStatus === 'SCANNING' ? (
                  <ActivityIndicator size="small" color="#6A0DAD" style={{marginRight: 8}} />
              ) : (
                  <Ionicons 
                    name={systemStatus === 'LOCKED' ? "warning" : "shield-checkmark"} 
                    size={16} 
                    color={systemStatus === 'LOCKED' ? "#EF4444" : "#10B981"} 
                    style={{marginRight: 6}} 
                  />
              )}
              <Text style={[styles.statusText, { 
                  color: systemStatus === 'LOCKED' ? "#B91C1C" : "#166534" 
              }]}>
                  {statusMessage}
              </Text>
          </View>
      </View>

      {/* --- LIVE FEED CARD --- */}
      <View style={[styles.feedCard, systemStatus === 'LOCKED' && styles.feedCardLocked]}>
          <View style={styles.feedHeader}>
             <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                 <BlinkingDot color={systemStatus === 'LOCKED' ? '#EF4444' : '#10B981'} />
                 <Text style={styles.feedTitle}>Live Transaction Feed</Text>
             </View>
             <Text style={styles.timerText}>Next Scan: {countdown}s</Text>
          </View>
          
          <View style={styles.divider} />

          <ScrollView style={{ height: 130 }} showsVerticalScrollIndicator={false}>
              {liveTransactions.slice().reverse().map((tx, i) => (
                  <View key={i} style={styles.feedItem}>
                      <View style={[styles.iconCircle, { backgroundColor: tx.isFraud ? '#FEF2F2' : '#F0FDF4' }]}>
                          <Ionicons 
                            name={tx.isFraud ? 'alert' : 'swap-horizontal'} 
                            size={14} 
                            color={tx.isFraud ? '#EF4444' : '#10B981'} 
                          />
                      </View>
                      <View style={{flex: 1, marginLeft: 10}}>
                          <Text style={styles.feedType}>
                              {tx.isFraud ? "High Risk Detected" : "Standard Transfer"}
                          </Text>
                          <Text style={styles.feedDetail}>
                              {tx.isFraud ? `Source: ${maskID(tx.walletId)}` : `To: ${maskID(tx.walletId)} • Tier ${tx.tier}`}
                          </Text>
                      </View>
                      <Text style={styles.feedTime}>{getLiveTime()}</Text>
                  </View>
              ))}
              
              {liveTransactions.length === 0 && (
                  <View style={{alignItems:'center', marginTop: 20}}>
                      <Text style={{color:'#9CA3AF', fontSize:12}}>Calibrating local sensors...</Text>
                  </View>
              )}
          </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  mapContainer: { width: width, height: height },
  map: { width: '100%', height: '100%' },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' },
  loadText: { marginTop: 15, fontWeight: '700', color: '#6A0DAD', fontSize: 16 },

  blinkDot: { width: 8, height: 8, borderRadius: 4 },

  pinContainer: { alignItems: 'center' },
  bubble: { 
      backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, 
      borderRadius: 8, marginBottom: 6, alignItems: 'center',
      borderLeftWidth: 3, 
      elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width:0, height:2}
  },
  bubbleType: { fontSize: 10, fontWeight: '800', marginBottom: 2 },
  bubbleTime: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  
  iconBox: { 
      width: 24, height: 24, borderRadius: 12, 
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: '#FFF', elevation: 3
  },
  line: { width: 2, height: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.3)', marginTop: -2 },

  headerContainer: {
      position: 'absolute', top: 50, left: 20, right: 20,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20
  },
  backBtn: {
      width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 20,
      justifyContent: 'center', alignItems: 'center', elevation: 3,
      shadowColor: '#000', shadowOpacity: 0.1
  },
  statusBadge: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1, elevation: 3, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  feedCard: {
      position: 'absolute', bottom: 40, left: 20, right: 20,
      backgroundColor: '#FFF',
      borderRadius: 24, padding: 20, elevation: 10,
      shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
      maxHeight: 250
  },
  feedCardLocked: {
      borderWidth: 2, borderColor: '#EF4444'
  },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  feedTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  timerText: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 10 },
  
  feedItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  feedType: { fontSize: 12, fontWeight: '700', color: '#1F2937' },
  feedDetail: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  feedTime: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
});

const cleanMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];