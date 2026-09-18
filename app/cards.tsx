import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors } from '../constants/theme';
import { useBanking } from '../context/BankingContext';
import { useRouter } from 'expo-router';

export default function CardsScreen() {
  const { addCard } = useBanking();
  const router = useRouter();
  
  const [form, setForm] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const handleSave = () => {
    if (!form.number || !form.name) {
      Alert.alert("Error", "Please fill in all card details");
      return;
    }
    addCard(form);
    Alert.alert("Success", "Card added successfully!");
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Visual Card Preview */}
      <View style={styles.cardPreview}>
        <Text style={styles.cardType}>Pivota Platinum</Text>
        <Text style={styles.cardNumberDisplay}>
          {form.number ? form.number.replace(/\d{4}(?=.)/g, '$& ') : '**** **** **** ****'}
        </Text>
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardLabel}>CARD HOLDER</Text>
            <Text style={styles.cardValue}>{form.name || 'YOUR NAME'}</Text>
          </View>
          <View>
            <Text style={styles.cardLabel}>EXPIRES</Text>
            <Text style={styles.cardValue}>{form.expiry || 'MM/YY'}</Text>
          </View>
        </View>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        <Text style={styles.inputLabel}>Card Number</Text>
        <TextInput 
          style={styles.input} 
          placeholder="0000 0000 0000 0000" 
          keyboardType="number-pad"
          maxLength={16}
          onChangeText={(val) => setForm({...form, number: val})}
        />

        <Text style={styles.inputLabel}>Card Holder Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Alicia Doe"
          onChangeText={(val) => setForm({...form, name: val})}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.inputLabel}>Expiry Date</Text>
            <TextInput 
              style={styles.input} 
              placeholder="MM/YY" 
              maxLength={5}
              onChangeText={(val) => setForm({...form, expiry: val})}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>CVV</Text>
            <TextInput 
              style={styles.input} 
              placeholder="123" 
              keyboardType="number-pad" 
              maxLength={3}
              secureTextEntry
              onChangeText={(val) => setForm({...form, cvv: val})}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Add Card</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  cardPreview: {
    backgroundColor: '#1A1A1A',
    height: 200,
    borderRadius: 20,
    padding: 25,
    justifyContent: 'space-between',
    marginBottom: 30
  },
  cardType: { color: '#fff', fontSize: 16, fontWeight: 'bold', opacity: 0.8 },
  cardNumberDisplay: { color: '#fff', fontSize: 22, letterSpacing: 2, marginVertical: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 4 },
  cardValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  form: { marginTop: 10 },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, fontSize: 16 },
  row: { flexDirection: 'row' },
  saveBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 15, marginTop: 40, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});