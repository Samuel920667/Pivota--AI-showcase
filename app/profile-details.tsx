import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, 
  ScrollView, Image, Alert, Dimensions, Platform, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API from '../api/api';
import { useAuth } from '../context/AuthContext';

export let globalProfileImage: string | null = null;

const { width } = Dimensions.get('window');

const ProfileItem = ({ label, value, hasArrow = false, color = '#111827' }: any) => (
  <TouchableOpacity style={styles.itemRow} activeOpacity={0.8}>
    <Text style={styles.itemLabel}>{label}</Text>
    <View style={styles.itemValueContainer}>
      <Text style={[styles.itemValue, { color }]}>
        {value ? String(value) : 'Not Set'}
      </Text>
      {hasArrow ? <Ionicons name="chevron-forward" size={16} color="#D1D5DB" /> : null}
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { userInfo, logout } = useAuth(); 
  
  const [image, setImage] = useState<string | null>(globalProfileImage);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(userInfo || {});

  const fetchProfile = async () => {
    try {
        setLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;
        
        const res = await API.get('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data) {
            const data = res.data.data || res.data;
            setUserData(data);
        }
    } catch (e) {
        console.log("Profile Fetch Error", e);
    } finally {
        setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
        fetchProfile();
    }, [])
  );

  useEffect(() => {
    const loadSavedImage = async () => {
        const saved = await AsyncStorage.getItem('lastProfileImage');
        if (saved) {
            setImage(saved);
            globalProfileImage = saved;
        }
    };
    loadSavedImage();
  }, []);

  const handleImageUpdate = async () => {
    try {
      const lastUpdate = await AsyncStorage.getItem('lastProfileUpdate');
      
      if (lastUpdate) {
        const lastDate = new Date(parseInt(lastUpdate));
        const now = new Date();
        const diffInHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 48) {
          const hoursLeft = Math.ceil(48 - diffInHours);
          Alert.alert(
            "Update Restricted", 
            `Profile picture can only be changed every 48 hours.\n\nPlease wait ${hoursLeft} hours.`
          );
          return; 
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const newUri = result.assets[0].uri;
        setImage(newUri);
        globalProfileImage = newUri;
        
        await AsyncStorage.setItem('lastProfileImage', newUri);
        await AsyncStorage.setItem('lastProfileUpdate', Date.now().toString());
        
        Alert.alert("Success", "Profile picture updated!");
      }

    } catch (error) {
      Alert.alert("Error", "Could not update image.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: "destructive", 
        onPress: () => {
            if (logout) logout();
            router.replace('/login');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} /> 
        <Text style={styles.headerTitle}>Profile Details</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.identitySection}>
          <TouchableOpacity onPress={handleImageUpdate} style={styles.avatarWrapper} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>
              {image ? (
                <Image source={{ uri: image }} style={styles.imageDisplay} />
              ) : (
                <View style={styles.initialsCircle}>
                  <Text style={styles.initialsText}>{userData.first_name?.[0] || "U"}</Text>
                </View>
              )}
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>
             {loading ? "Loading..." : `${userData.first_name || ""} ${userData.last_name || ""}`}
          </Text>
          <Text style={styles.walletId}>{userData.wallet_id || "@user"}</Text>
          
          <View style={styles.tierBadge}>
            <Ionicons name="ribbon" size={14} color="#6A0DAD" />
            <Text style={styles.tierText}>Account Tier: {userData.tier || "1"}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>VERIFICATION</Text>
        <View style={styles.detailsListCard}>
          <ProfileItem label="BVN" value={userData.bvn ? `${String(userData.bvn).substring(0, 3)}********${String(userData.bvn).slice(-2)}` : "Not Linked"} />
          <ProfileItem label="NIN" value={userData.nin ? `${String(userData.nin).substring(0, 3)}********${String(userData.nin).slice(-2)}` : "Not Linked"} />
          <ProfileItem label="Status" value="Verified" color="#10B981" />
        </View>

        <Text style={styles.sectionHeader}>PERSONAL INFO</Text>
        <View style={styles.detailsListCard}>
          <ProfileItem label="Full Name" value={`${userData.first_name || ""} ${userData.last_name || ""}`} />
          <ProfileItem label="Phone" value={userData.phone_number} />
          <ProfileItem label="Email" value={userData.email} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#E11D48" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.4</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 20, 
      paddingTop: Platform.OS === 'android' ? 40 : 10, 
      paddingBottom: 15,
      backgroundColor: '#FFF', 
      borderBottomWidth: 1, 
      borderBottomColor: '#F3F4F6' 
  },
  closeBtn: { 
      width: 40, 
      height: 40, 
      justifyContent: 'center', 
      alignItems: 'flex-end' 
  },
  headerTitle: { color: '#111827', fontSize: 17, fontWeight: '700' },
  
  identitySection: { alignItems: 'center', paddingVertical: 25, backgroundColor: '#FFF', marginBottom: 10 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F3F4F6', overflow: 'hidden', borderWidth: 3, borderColor: '#FFF', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  initialsCircle: { width: '100%', height: '100%', backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center' },
  initialsText: { fontSize: 32, fontWeight: '700', color: '#4338CA' },
  imageDisplay: { width: '100%', height: '100%' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6A0DAD', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  
  userName: { color: '#111827', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  walletId: { color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 10 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, gap: 5 },
  tierText: { color: '#6A0DAD', fontSize: 11, fontWeight: '700' },
  
  sectionHeader: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginLeft: 25, marginTop: 20, marginBottom: 8, letterSpacing: 1 },
  detailsListCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 16, paddingHorizontal: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  itemLabel: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  itemValueContainer: { flexDirection: 'row', alignItems: 'center' },
  itemValue: { fontWeight: '600', marginRight: 8, fontSize: 13, textAlign: 'right' },
  
  logoutButton: { margin: 20, marginTop: 30, padding: 16, borderRadius: 14, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#FFE4E6' },  
  logoutText: { color: '#E11D48', fontWeight: '700', fontSize: 15 },
  versionText: { textAlign: 'center', color: '#D1D5DB', fontSize: 11, marginBottom: 20 }
});