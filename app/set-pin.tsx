import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useBanking } from '../context/BankingContext';
import { useRouter } from 'expo-router';

export default function SetPin() {
  const [pin, setPinInput] = useState('');
  const { setPin } = useBanking();
  const router = useRouter();

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) setPinInput(prev => prev + num);
  };

  const savePin = () => {
    if (pin.length === 4) {
      setPin(pin);
      Alert.alert("Success", "Transaction PIN created!");
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Transaction PIN</Text>
      <Text style={styles.subtitle}>You will use this to authorize all transfers</Text>
      
      <View style={styles.dotsContainer}>
        {[1, 2, 3, 4].map((_, i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((val, i) => (
          <TouchableOpacity 
            key={i} 
            style={styles.key} 
            onPress={() => val === '⌫' ? setPinInput(pin.slice(0, -1)) : handleNumberPress(val)}
          >
            <Text style={styles.keyText}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={savePin}>
        <Text style={styles.btnText}>Set PIN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#6B7280', marginBottom: 40 },
  dotsContainer: { flexDirection: 'row', gap: 20, marginBottom: 50 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#6A0DAD' },
  dotFilled: { backgroundColor: '#6A0DAD' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20 },
  key: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 24, fontWeight: '600' },
  btn: { marginTop: 40, backgroundColor: '#6A0DAD', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});