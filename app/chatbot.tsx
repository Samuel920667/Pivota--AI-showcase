import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Internal Dependencies
import API from '../api/api'; 
import { useAuth } from '../context/AuthContext'; // ✅ FIX: Changed from useBanking to useAuth

export default function ChatbotScreen() {
  const { userInfo } = useAuth(); // ✅ FIX: Corrected Context Hook
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: `Hello ${userInfo?.first_name || 'there'}! I'm your Pivota AI Shield. How can I help you secure your account today?`, sender: 'bot' }
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    
    const userQuery = input;
    setInput('');
    setIsTyping(true);

    try {
      // 🚀 Sends query to Node.js -> Python FastAPI
      const response = await API.post('/api/transactions/chatbot', { 
        message: userQuery 
      });

      const botMsg = { 
        id: Date.now() + 1, 
        text: response.data.reply, 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      const errorMsg = { 
        id: Date.now() + 1, 
        text: "Contact Pivota Customer Care. I have no information regarding this.", // ✅ Fallback
        sender: 'bot' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pivota AI Assistant</Text>
        <TouchableOpacity>
           <Ionicons name="ellipsis-horizontal" size={24} color="#1A1A1A" />
        </TouchableOpacity>
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
          <View style={styles.aiBriefingCard}>
            <View style={styles.aiBriefingHeader}>
              <Ionicons name="shield-checkmark" size={18} color="#6A0DAD" />
              <Text style={styles.aiBriefingTitle}>SECURITY STATUS</Text>
            </View>
            <Text style={styles.aiText}>
              Your wallet is <Text style={styles.bold}>Shielded</Text>. 
              Neural Network is monitoring active sessions.
            </Text>
          </View>

          {messages.map((msg) => (
            <View key={msg.id} style={[styles.bubble, msg.sender === 'bot' ? styles.botBubble : styles.userBubble]}>
              <Text style={[styles.msgText, msg.sender === 'bot' ? styles.botText : styles.userText]}>
                {msg.text}
              </Text>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.bubble, styles.botBubble, { flexDirection: 'row', gap: 5 }]}>
              <ActivityIndicator size="small" color="#6A0DAD" />
              <Text style={styles.botText}>AI is thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Ask about security..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            editable={!isTyping}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!input.trim() || isTyping) && { backgroundColor: '#E5E7EB' }]} 
            onPress={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  aiBriefingCard: { backgroundColor: '#F3E8FF', padding: 18, borderRadius: 20, marginBottom: 25, borderLeftWidth: 5, borderLeftColor: '#6A0DAD' },
  aiBriefingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiBriefingTitle: { fontSize: 11, fontWeight: '800', color: '#6A0DAD', marginLeft: 6, letterSpacing: 1 },
  aiText: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  bold: { fontWeight: '800', color: '#1A1A1A' },
  bubble: { padding: 16, borderRadius: 22, marginBottom: 15, maxWidth: '85%' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#6A0DAD', borderBottomRightRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  botText: { color: '#1A1A1A', fontWeight: '500' },
  userText: { color: '#FFF', fontWeight: '500' },
  inputContainer: { paddingHorizontal: 20, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFF', paddingBottom: Platform.OS === 'ios' ? 35 : 20 },
  input: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 25, marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB', color: '#1A1A1A', fontSize: 16 },
  sendButton: { backgroundColor: '#6A0DAD', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' }
});