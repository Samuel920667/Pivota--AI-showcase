import React from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
// 1. Ensure this is imported
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HeatmapScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 2. MapView MUST have a style or it won't show */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject} 
        initialRegion={{
          latitude: 6.5244, // Lagos coords for your demo
          longitude: 3.3792,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Example Marker for High Risk Area */}
        <Marker 
          coordinate={{ latitude: 6.5244, longitude: 3.3792 }}
          title="High Risk Zone"
          description="High number of reported incidents here."
        />
      </MapView>

      {/* Floating Back Button */}
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerLabel}>
          <Text style={styles.labelText}>Security Heatmap</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 20,
    elevation: 5,
  },
  headerLabel: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 15,
  },
  labelText: {
    fontWeight: '700',
    color: '#6A0DAD',
  }
});