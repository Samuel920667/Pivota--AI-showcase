import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Linking, Modal, Platform, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpCenter() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  // --- CONFIGURATION ---
  const SUPPORT_EMAILS = "chellaseniueta1@gmail.com,odumosuaby@gmail.com,peterssamuel428@gmail.com";
  
  const AGENTS = [
    { name: "Alicia", number: "2349067094071", role: "Customer Success" },
    { name: "Excellent", number: "2348050509820", role: "Technical Support" },
    { name: "Samuel", number: "2348069010564", role: "Billing Specialist" }
  ];

  // --- ACTIONS ---
  const handleWhatsApp = (number: string) => {
    const url = `https://wa.me/${number}`;
    Linking.openURL(url).catch(() => 
      Alert.alert("Error", "WhatsApp is not installed on this device.")
    );
    setModalVisible(false);
  };

  const handleEmail = () => {
    const url = `mailto:${SUPPORT_EMAILS}?subject=Pivota Support Request`;
    Linking.openURL(url).catch(() => 
      Alert.alert("Error", "No email app found.")
    );
  };

  const openChatbot = (initialQuery?: string) => {
    // Navigate to Chatbot and pass the question as a param if needed
    // Assuming /chatbot can handle params, otherwise just push
    router.push({ pathname: "/chatbot", params: { query: initialQuery } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backBtn}
            activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION */}
        <View style={styles.hero}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="chatbubbles" size={40} color="#6A0DAD" />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>Our team is online 24/7 to assist you.</Text>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionLabel}>CONTACT US</Text>
        
        <SupportCard 
          icon="logo-whatsapp" 
          title="Live Chat" 
          desc="Talk to a support agent now" 
          color="#10B981"
          onPress={() => setModalVisible(true)}
        />
        
        <SupportCard 
          icon="mail-outline" 
          title="Email Support" 
          desc="Send a message to the team" 
          color="#3B82F6"
          onPress={handleEmail}
        />

        {/* FAQ SECTION */}
        <View style={styles.faqSection}>
            <Text style={[styles.sectionLabel, { marginTop: 30 }]}>FREQUENT QUESTIONS</Text>
            
            <View style={styles.cardGroup}>
                <FaqItem 
                    question="How do I reset my transaction PIN?" 
                    onPress={() => openChatbot("How do I reset my transaction PIN?")} 
                />
                <View style={styles.divider} />
                <FaqItem 
                    question="Why is my transfer pending?" 
                    onPress={() => openChatbot("Why is my transfer pending?")} 
                />
                <View style={styles.divider} />
                <FaqItem 
                    question="How do I increase my daily limits?" 
                    onPress={() => openChatbot("How do I increase my daily limits?")} 
                />
            </View>
        </View>

        {/* AI FAB */}
        <TouchableOpacity style={styles.aiFab} onPress={() => openChatbot()}>
            <Ionicons name="sparkles" size={20} color="#FFF" style={{marginRight: 8}}/>
            <Text style={styles.aiFabText}>Ask Pivota AI</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* WHATSAPP AGENT MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
        >
            <View style={styles.modalContent}>
                <View style={styles.modalIndicator} />
                <Text style={styles.modalTitle}>Select Support Agent</Text>
                <Text style={styles.modalSub}>Who would you like to speak with?</Text>

                {AGENTS.map((agent, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.agentRow} 
                        onPress={() => handleWhatsApp(agent.number)}
                    >
                        <View style={styles.agentIcon}>
                            <Text style={styles.agentInitials}>{agent.name[0]}</Text>
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.agentName}>{agent.name}</Text>
                            <Text style={styles.agentRole}>{agent.role}</Text>
                        </View>
                        <Ionicons name="logo-whatsapp" size={24} color="#10B981" />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setModalVisible(false)}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

// --- SUB-COMPONENTS ---

const SupportCard = ({ icon, title, desc, color, onPress }: any) => (
  <TouchableOpacity 
    style={styles.card} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconBg, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={{ flex: 1, marginLeft: 15 }}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
  </TouchableOpacity>
);

const FaqItem = ({ question, onPress }: { question: string, onPress: () => void }) => (
  <TouchableOpacity style={styles.faqRow} onPress={onPress}>
    <Text style={styles.faqText}>{question}</Text>
    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
  </TouchableOpacity>
);

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  
  content: { padding: 20, paddingBottom: 50 },
  
  // HERO
  hero: { alignItems: 'center', marginVertical: 25 },
  heroIconCircle: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: '#F3E8FF',
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 15,
      borderWidth: 1, borderColor: '#E9D5FF'
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  heroSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 6 },
  
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },
  
  // SUPPORT CARDS
  card: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: '#FFF', 
      padding: 16, 
      borderRadius: 16, 
      marginBottom: 15, 
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 
  },
  iconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  cardDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  
  // FAQ GROUP
  faqSection: { marginBottom: 30 },
  cardGroup: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1
  },
  faqRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 18, 
    paddingHorizontal: 16,
    backgroundColor: '#FFF'
  },
  faqText: { fontSize: 14, fontWeight: '500', color: '#374151', flex: 1 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 16 },

  // AI FAB BUTTON
  aiFab: {
      flexDirection: 'row',
      backgroundColor: '#111827',
      paddingVertical: 14,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
      marginTop: 10
  },
  aiFabText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // MODAL STYLES
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end'
  },
  modalContent: {
      backgroundColor: '#FFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24
  },
  modalIndicator: {
      width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 5, textAlign: 'center' },
  modalSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 25 },
  
  agentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6'
  },
  agentIcon: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: '#F3E8FF',
      justifyContent: 'center', alignItems: 'center',
      marginRight: 15
  },
  agentInitials: { fontSize: 18, fontWeight: '700', color: '#6A0DAD' },
  agentName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  agentRole: { fontSize: 12, color: '#6B7280' },

  cancelBtn: { marginTop: 20, paddingVertical: 15, alignItems: 'center' },
  cancelText: { color: '#EF4444', fontWeight: '700', fontSize: 16 }
});