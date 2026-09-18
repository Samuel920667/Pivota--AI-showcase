import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext'; // ✅ Correct Import

interface SettingsItemProps {
  title: string;
  icon: any;
  color: string;
  onPress?: () => void;
  isDestructive?: boolean;
}

const SettingsItem = ({ title, icon, color, onPress, isDestructive }: SettingsItemProps) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.itemTitle, isDestructive && { color: '#EF4444' }]}>{title}</Text>
    {!isDestructive && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  
  // ✅ Get the logout function from your Authentication Context
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out of Pivota?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: () => logout() // ✅ Call the real logout function
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>SECURITY & LIMITS</Text>
        
        <SettingsItem 
          title="Personal Information" 
          icon="person-outline" 
          color="#6A0DAD" 
          onPress={() => console.log("Personal Info Pressed")} 
        />
        
        <SettingsItem 
          title="Bank Limits" 
          icon="speedometer-outline" 
          color="#6A0DAD" 
          onPress={() => router.push('/limits' as any)} 
        />
        
        <SettingsItem 
          title="Biometrics" 
          icon="finger-print-outline" 
          color="#10B981" 
          onPress={() => console.log("Biometrics Pressed")} 
        />
        
        <SettingsItem 
          title="Change Transaction PIN" 
          icon="lock-closed-outline" 
          color="#6A0DAD" 
          onPress={() => console.log("Change PIN Pressed")} 
        />

        <Text style={[styles.sectionLabel, { marginTop: 30 }]}>APP</Text>
        
        <SettingsItem 
          title="Help & Support" 
          icon="chatbubbles-outline" 
          color="#3B82F6" 
          onPress={() => console.log("Support Pressed")} 
        />
        
        {/* LOGOUT BUTTON */}
        <View style={{ marginTop: 40, marginBottom: 40 }}>
          <SettingsItem 
            title="Log Out" 
            icon="log-out-outline" 
            color="#EF4444" 
            onPress={handleLogout}
            isDestructive={true}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFAFF' },
  header: { 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
    paddingTop: 60 
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  scrollContent: { paddingVertical: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginLeft: 20, marginBottom: 10, letterSpacing: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1F2937' },
});