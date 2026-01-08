import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBanking } from '../contexts/BankingContext';
import { useRouter } from 'expo-router';

export default function ChatbotScreen() {
  const { transactions, balance, incidentCounts } = useBanking();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello Alicia! I'm your Pivota AI Shield. How can I help you secure your account today?", sender: 'bot' }
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  // --- FRAUD RESPONSE ENGINE ---
  const getAIResponse = (userText: string) => {
    const text = userText.toLowerCase();
    
    if (text.includes('otp') || text.includes('code')) {
      return "⚠️ SECURITY ALERT: Never share your OTP with anyone, including Pivota staff. If someone is asking for it, they are likely attempting fraud.";
    }
    if (text.includes('unauthorized') || text.includes('recognize')) {
      return "I can help. If you don't recognize a charge, I can freeze your card immediately. Would you like me to do that?";
    }
    if (text.includes('lost') || text.includes('stolen') || text.includes('missing')) {
      return "I'm sorry to hear that. I've flagged your account. Please tap 'Security' in Settings to deactivate your physical card right away.";
    }
    if (text.includes('phishing') || text.includes('link') || text.includes('email')) {
      return "If you received a suspicious link, do not click it. Pivota will only communicate with you via this app or our official verified email.";
    }
    if (text.includes('limit')) {
      return "Setting lower daily transaction limits is a great way to stay safe. You can adjust these in your Card Settings.";
    }
    
    return "I'm monitoring your account for suspicious activity. You can ask me about 'OTP safety', 'missing cards', or 'unrecognized charges'.";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    // Simulate AI thinking and responding
    setTimeout(() => {
      const botMsg = { id: Date.now() + 1, text: getAIResponse(currentInput), sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pivota AI Assistant</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.scrollContent}
        >
          {/* AI BRIEFING CARD */}
          <View style={styles.aiBriefingCard}>
            <View style={styles.aiBriefingHeader}>
              <Ionicons name="sparkles" size={18} color="#6A0DAD" />
              <Text style={styles.aiBriefingTitle}>AI SECURITY BRIEFING</Text>
            </View>
            <Text style={styles.aiText}>
              Your account is currently <Text style={styles.bold}>Secured</Text>. 
              No unauthorized login attempts in the last 24 hours.
            </Text>
          </View>

          {/* CHAT MESSAGES */}
          {messages.map((msg) => (
            <View 
              key={msg.id} 
              style={[
                styles.bubble, 
                msg.sender === 'bot' ? styles.botBubble : styles.userBubble
              ]}
            >
              <Text style={[
                styles.msgText, 
                msg.sender === 'bot' ? styles.botText : styles.userText
              ]}>
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Ask about security, OTPs, etc..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 20 },
  aiBriefingCard: {
    backgroundColor: '#F3E8FF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 25,
    borderLeftWidth: 5,
    borderLeftColor: '#6A0DAD',
  },
  aiBriefingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiBriefingTitle: { fontSize: 11, fontWeight: '800', color: '#6A0DAD', marginLeft: 6, letterSpacing: 1 },
  aiText: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  bold: { fontWeight: '700', color: '#1A1A1A' },
  
  // New Bubble Styles
  bubble: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    maxWidth: '85%',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6A0DAD',
    borderBottomRightRadius: 2,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  botText: { color: '#1A1A1A' },
  userText: { color: '#FFF' },

  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF'
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  sendButton: {
    backgroundColor: '#6A0DAD',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  }
});