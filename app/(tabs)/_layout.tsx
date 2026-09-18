import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6A0DAD',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarStyle: {
          // ✅ Standard App Height & Elevation
          height: Platform.OS === 'ios' ? 90 : 70, 
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 10,
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          // Floating effect logic
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="fraud-map"
        options={{
          title: 'Safety',
          tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="setting"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}