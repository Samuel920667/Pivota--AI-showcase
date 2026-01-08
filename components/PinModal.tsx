import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PinModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}

export default function PinModal({ isVisible, onClose, onSuccess, correctPin }: PinModalProps) {
  const [inputPin, setInputPin] = useState('');

  const handlePress = (num: string) => {
    if (inputPin.length < 4) {
      const newPin = inputPin + num;
      setInputPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          setTimeout(() => { onSuccess(); setInputPin(''); }, 300);
        } else {
          Vibration.vibrate();
          alert("Incorrect PIN");
          setInputPin('');
        }
      }
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.title}>Enter PIN</Text>
          <View style={styles.dotsRow}>
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={[styles.dot, inputPin.length > i && styles.dotFilled]} />
            ))}
          </View>
          <View style={styles.keypad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((val, i) => (
              <TouchableOpacity key={i} style={styles.key} onPress={() => val === '⌫' ? setInputPin(inputPin.slice(0, -1)) : handlePress(val)}>
                <Text style={styles.keyText}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, alignItems: 'center', height: '70%' },
  closeBtn: { alignSelf: 'flex-end' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 30 },
  dotsRow: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#E9D5FF' },
  dotFilled: { backgroundColor: '#6A0DAD', borderColor: '#6A0DAD' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  key: { width: '30%', height: 70, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 24, fontWeight: '600' }
});