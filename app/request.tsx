import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RequestScreen() {
  const router = useRouter();
  const [accNumber, setAccNumber] = useState('');
  const [amount, setAmount] = useState('');

  const handleRequest = () => {
    if (accNumber.length < 10) {
      Alert.alert("Invalid Account", "Please enter a valid 10-digit account number.");
      return;
    }
    Alert.alert("Request Sent", `Your request for ₦${amount} has been sent!`);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Money</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Recipient Account Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 10-digit account number"
          keyboardType="numeric"
          maxLength={10}
          value={accNumber}
          onChangeText={setAccNumber}
        />

        <Text style={[styles.label, { marginTop: 24 }]}>Amount (₦)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <TouchableOpacity 
          style={[styles.requestBtn, (!accNumber || !amount) && { opacity: 0.6 }]} 
          onPress={handleRequest}
          disabled={!accNumber || !amount}
        >
          <Text style={styles.btnText}>Send Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// 2. STYLES: Added all missing properties here
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: { 
    padding: 24 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#6B7280', 
    marginBottom: 10 
  },
  input: { 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 16, 
    padding: 18, 
    fontSize: 16,
    color: '#1A1A1A'
  },
  requestBtn: { 
    backgroundColor: '#6A0DAD', 
    marginTop: 40, 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  btnText: { 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: 16 
  },
  // Adding these just in case they are referenced elsewhere
  scrollContent: { padding: 20 },
  floatingAiBtn: {}
});