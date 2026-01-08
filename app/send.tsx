import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useBanking } from "../contexts/BankingContext";

export default function SendScreen() {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const router = useRouter();
  const { beneficiaries, sendMoney, userPin, setVerifiedRecipient } = useBanking();

  const [amount, setAmount] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [pin, setPin] = useState("");

  useFocusEffect(
    useCallback(() => {
      setAmount("");
      setAccountNo("");
      setSelectedPerson(null);
      setPin("");
      return () => setVerifiedRecipient(null);
    }, [setVerifiedRecipient])
  );

  const getRiskColor = (risk: string) => {
    if (risk === "Low") return "#10B981";
    if (risk === "Medium") return "#F59E0B";
    return "#EF4444";
  };

  const handleSend = () => {
    if (pin !== userPin) {
      Alert.alert("Security Check", "The PIN you entered is incorrect.");
      return;
    }
    const recipientName = selectedPerson ? selectedPerson.name : `Account: ${accountNo}`;
    sendMoney(parseFloat(amount), recipientName);
    Alert.alert("Transfer Successful", `₦${amount} sent to ${recipientName}`);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEATMAP MODAL */}
      <Modal visible={showHeatmap} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Regional Fraud Heatmap</Text>
                <Text style={styles.modalSubTitle}>Lagos State • Real-time Monitoring</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHeatmap(false)}>
                <Ionicons name="close-circle" size={28} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            
            {/* Zoomed in on Ikeja, Lagos (6.5965, 3.3421) */}
        <Image 
          source={{ uri: 'https://static-maps.yandex.ru/1.x/?lang=en_US&ll=3.3421,6.5965&z=14&l=map&size=600,400&pt=3.3421,6.5965,pm2rdm' }} 
          style={styles.heatmapImage} 
          resizeMode="cover"
/>            
            <View style={styles.fraudStats}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>12%</Text>
                <Text style={styles.statLabel}>Incidence Rise</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>Ikeja</Text>
                <Text style={styles.statLabel}>High Risk Hub</Text>
              </View>
            </View>

            <View style={styles.legend}>
              <Text style={styles.legendItem}>
                🔴 <Text style={{fontWeight: '800'}}>Ikeja/Computer Village:</Text> High SIM-swap risk
              </Text>
              <Text style={styles.legendItem}>
                🟡 <Text style={{fontWeight: '800'}}>Lekki/Ajah:</Text> Rising phishing activity
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {(selectedPerson || accountNo.length === 10) && (
          <View style={[styles.riskCard, { borderLeftColor: getRiskColor(selectedPerson?.risk || "Low") }]}>
            <View style={styles.riskHeader}>
              <View>
                <Text style={styles.riskUser}>{selectedPerson?.name || "Unknown Recipient"}</Text>
                <Text style={styles.riskBank}>
                  {selectedPerson?.bank || "Pivota Bank"} • {selectedPerson?.account || accountNo}
                </Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(selectedPerson?.risk || "Low") + "20" }]}>
                <Text style={[styles.riskBadgeText, { color: getRiskColor(selectedPerson?.risk || "Low") }]}>
                  {selectedPerson?.risk || "Medium"} • {selectedPerson?.score || "70%"}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.heatmapLink} onPress={() => setShowHeatmap(true)}>
              <Ionicons name="map-outline" size={16} color="#6A0DAD" />
              <Text style={styles.heatmapText}>View fraud heatmap for this area</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputCard}>
          <Text style={styles.label}>Amount to Send</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" />
          </View>
        </View>

        <View style={styles.manualInputSection}>
          <Text style={styles.sectionTitle}>Account Number</Text>
          <TextInput
            style={styles.accountInputFull}
            placeholder="Enter 10-digit Account Number"
            keyboardType="numeric"
            maxLength={10}
            value={accountNo}
            onChangeText={(txt) => {
              setAccountNo(txt);
              if (txt.length > 0) setSelectedPerson(null);
            }}
          />
        </View>

        <Text style={styles.sectionTitle}>Quick Select</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.beneficiaryScroll}>
          {beneficiaries.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.miniBeneficiary, selectedPerson?.id === item.id && styles.miniSelected]}
              onPress={() => {
                setSelectedPerson(item);
                setAccountNo("");
              }}
            >
              <View style={styles.miniAvatar}>
                <Text style={styles.miniAvatarText}>{item.name.charAt(0)}</Text>
              </View>
              <Text style={styles.miniName}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.pinSection}>
          <Text style={styles.sectionTitle}>Transaction PIN</Text>
          <TextInput
            style={styles.pinInput}
            placeholder="****"
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
            value={pin}
            onChangeText={setPin}
          />
          <Text style={styles.pinHint}>Enter your 4-digit security PIN to authorize</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.sendBtn, (!amount || pin.length < 4) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!amount || pin.length < 4}
        >
          <Text style={styles.sendBtnText}>Securely Send ₦{amount || "0"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "90%", backgroundColor: "#FFF", borderRadius: 24, padding: 20, alignItems: "center" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSubTitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  heatmapImage: { width: '100%', height: 300, borderRadius: 20, backgroundColor: '#E5E7EB', marginTop: 10 },
  fraudStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: 15, padding: 15, backgroundColor: '#F9FAFB', borderRadius: 16 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#EF4444' },
  statLabel: { fontSize: 10, color: '#6B7280', textTransform: 'uppercase' },
  legend: { width: '100%', paddingHorizontal: 5 },
  legendItem: { fontSize: 13, color: '#4B5563', marginBottom: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#FFF" },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 20 },
  riskCard: { backgroundColor: "#FFF", padding: 15, borderRadius: 16, marginBottom: 20, borderLeftWidth: 5, elevation: 2 },
  riskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  riskUser: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  riskBank: { fontSize: 12, color: "#6B7280" },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  riskBadgeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  heatmapLink: { flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  heatmapText: { color: "#6A0DAD", fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
  inputCard: { backgroundColor: "#FFF", padding: 20, borderRadius: 20, marginBottom: 20, alignItems: "center" },
  label: { fontSize: 13, color: "#6B7280", marginBottom: 5 },
  amountRow: { flexDirection: "row", alignItems: "center" },
  currencySymbol: { fontSize: 24, fontWeight: "700", marginRight: 5 },
  amountInput: { fontSize: 32, fontWeight: "800", color: "#1A1A1A", minWidth: 100 },
  manualInputSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10, color: "#1A1A1A" },
  accountInputFull: { backgroundColor: "#FFF", padding: 15, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", fontSize: 16 },
  beneficiaryScroll: { marginBottom: 25 },
  miniBeneficiary: { alignItems: "center", marginRight: 20, padding: 10, borderRadius: 12 },
  miniSelected: { backgroundColor: "#F3E8FF", borderWidth: 1, borderColor: "#6A0DAD" },
  miniAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center", marginBottom: 5 },
  miniAvatarText: { fontWeight: "700", color: "#4B5563" },
  miniName: { fontSize: 12, color: "#1A1A1A" },
  pinSection: { backgroundColor: "#FFF", padding: 20, borderRadius: 16, marginBottom: 20 },
  pinInput: { borderBottomWidth: 2, borderBottomColor: "#6A0DAD", textAlign: "center", fontSize: 24, letterSpacing: 10, padding: 10, width: "50%", alignSelf: "center" },
  pinHint: { textAlign: "center", color: "#9CA3AF", fontSize: 12, marginTop: 10 },
  footer: { padding: 20, backgroundColor: "#FFF" },
  sendBtn: { backgroundColor: "#6A0DAD", padding: 18, borderRadius: 16, alignItems: 'center' },
  sendBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});