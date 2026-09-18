import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBanking } from '../context/BankingContext';
import { useRouter } from 'expo-router';

export default function AddMoney() {
  const [amount, setAmount] = useState('');
  const router = useRouter();
  
  // Combine these into one clean line
  const { deposit } = useBanking(); 

  const handleDeposit = () => {
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid number");
      return;
    }

    // This handles BOTH the balance and the transaction list
    deposit(amountNum); 
    
    Alert.alert("Success", `₦${amountNum.toLocaleString()} added successfully`);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
        <Text style={{fontSize: 24}}>✕</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.label}>Enter Amount to Add</Text>
        <TextInput 
          style={styles.input} 
          placeholder="₦ 0.00" 
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
          autoFocus
        />
        <TouchableOpacity style={styles.btn} onPress={handleDeposit}>
          <Text style={styles.btnText}>Deposit Funds</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  closeBtn: { padding: 20, alignSelf: 'flex-start' },
  content: { paddingHorizontal: 30, flex: 1, justifyContent: 'center' },
  label: { fontSize: 18, fontWeight: '600', marginBottom: 15, textAlign: 'center' },
  input: { 
    backgroundColor: '#F9FAFB', 
    padding: 25, 
    borderRadius: 20, 
    fontSize: 32, 
    fontWeight: 'bold', 
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  btn: { backgroundColor: '#6A0DAD', padding: 20, borderRadius: 15, marginTop: 25, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});