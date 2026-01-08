import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useBanking } from '../contexts/BankingContext';

export default function SplitBillScreen() {
  const router = useRouter();
  const { beneficiaries } = useBanking();
  
  // States
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [manualAccount, setManualAccount] = useState('');
  const [participants, setParticipants] = useState<any[]>([]); 

  // THE WIPER: Resets the screen when entering/leaving
  useFocusEffect(
    useCallback(() => {
      return () => {
        setAmount('');
        setNote('');
        setManualAccount('');
        setParticipants([]);
      };
    }, [])
  );

  const toggleParticipant = (person: any) => {
    const exists = participants.find(p => p.id === person.id);
    if (exists) {
      setParticipants(participants.filter(p => p.id !== person.id));
    } else {
      setParticipants([...participants, person]);
    }
  };

  const addManualUser = () => {
    if (manualAccount.length < 10) {
      Alert.alert("Invalid Number", "Please enter a 10-digit account number.");
      return;
    }
    const newUser = { 
      id: Math.random().toString(), 
      name: `User (${manualAccount.slice(-4)})`, 
      img: 'https://i.pravatar.cc/150?u=' + manualAccount 
    };
    setParticipants([...participants, newUser]);
    setManualAccount('');
  };

  const handleSplit = () => {
    if (!amount || participants.length === 0) {
      Alert.alert('Missing Info', 'Please enter an amount and select at least one person.');
      return;
    }
    Alert.alert('Success', `Split request for ₦${amount} sent!`);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Split Bill</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* AMOUNT INPUT */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Total Amount</Text>
          <View style={styles.amountWrapper}>
            <Text style={styles.currency}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* MANUAL ADD */}
        <Text style={styles.sectionTitle}>Add by Account Number</Text>
        <View style={styles.addParticipantRow}>
          <TextInput 
            style={styles.manualAddInput}
            placeholder="Enter 10-digit number..."
            value={manualAccount}
            onChangeText={setManualAccount}
            keyboardType="numeric"
            maxLength={10}
          />
          <TouchableOpacity style={styles.addIconBtn} onPress={addManualUser}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* FRIENDS SELECTOR */}
        <Text style={[styles.sectionTitle, {marginTop: 20}]}>Select Beneficiaries</Text>
        <View style={styles.friendsGrid}>
          {beneficiaries.map((friend) => {
            const isSelected = participants.find(p => p.id === friend.id);
            return (
              <TouchableOpacity 
                key={friend.id} 
                style={[styles.friendItem, isSelected && styles.friendSelected]}
                onPress={() => toggleParticipant(friend)}
              >
                <Image source={{ uri: friend.image || 'https://i.pravatar.cc/150' }} style={styles.friendImg} />
                <Text style={[styles.friendName, isSelected && styles.friendNameSelected]} numberOfLines={1}>
                  {friend.name}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SUMMARY */}
        {participants.length > 0 && amount ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              Each pays: <Text style={{fontWeight: '800', color: '#6A0DAD'}}>
                ₦{(parseFloat(amount) / (participants.length + 1)).toLocaleString()}
              </Text>
            </Text>
            <Text style={styles.summarySub}>(You + {participants.length} others)</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.splitBtn} onPress={handleSplit}>
          <Text style={styles.splitBtnText}>Send Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  inputContainer: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 10 },
  amountWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 20, height: 60, elevation: 1 },
  currency: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginRight: 10 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 15 },
  addParticipantRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  manualAddInput: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  addIconBtn: { backgroundColor: '#6A0DAD', width: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  friendsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  friendItem: { alignItems: 'center', width: '21%' },
  friendImg: { width: 50, height: 50, borderRadius: 25, marginBottom: 5, borderWidth: 2, borderColor: 'transparent' },
  friendSelected: { opacity: 1 },
  friendName: { fontSize: 11, color: '#4B5563', fontWeight: '500', textAlign: 'center' },
  friendNameSelected: { color: '#6A0DAD', fontWeight: '700' },
  checkBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#6A0DAD', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  summaryBox: { marginTop: 30, backgroundColor: '#F3E8FF', padding: 20, borderRadius: 16, alignItems: 'center' },
  summaryText: { fontSize: 16, color: '#1A1A1A', fontWeight: '600' },
  summarySub: { fontSize: 12, color: '#6B7280', marginTop: 5 },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  splitBtn: { backgroundColor: '#6A0DAD', paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 3 },
  splitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});